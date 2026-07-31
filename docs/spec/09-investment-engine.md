# 09 — Investment Engine

**Status:** v0.1 (2026-05-14) — порт math из импортированных `realestate-*` skills в детерминированный TS-модуль.

> Дочерний модуль `management-accounting/`. Не "AI agent" — **детерминированный калькулятор** для инвестиционных сценариев недвижимости. LLM не задействован; engine принимает структурированный `Property + Financing`, возвращает структурированный `Result`.

## Location

```
src/lib/server/ai-core/management-accounting/investment/
├── types.ts         # Zod schemas + result types
├── assumptions.ts   # Per-market operating assumptions
├── calc.ts          # Pure functions
├── calc.test.ts     # node:test suite (npm run test:engines)
└── index.ts         # Barrel export
```

## Contract

Engine соответствует общему контракту из [ai-core/README](../../src/lib/server/ai-core/README.md):

| Engine field | Investment realization |
|---|---|
| `id` | `investment` |
| `capabilities` | `buy_and_hold`, `brrrr`, `flip`, `mortgage`, `noi`, `70_rule_check` |
| `requiredContext` | `tenantId`, `role` (read), `market` (optional override) |
| `sources` | TBD: `realestate.properties` SoT (Phase 5+). До этого — input передаётся вызывающим. |
| `call(req, ctx)` | wrapper над `buyAndHold` / `brrrr` / `flip`, обогащённый ctx + audit |
| `audit(req, res, ctx)` | append `{ formula_version, input_hash, output, market, ts }` |

В v0.1 engine — **pure functions**. Engine-обёртка с QueryContext/Policy/Audit придёт в Phase 5 вместе с остальными движками AI Core.

## Inputs

### `Property` (zod-validated)

```ts
{
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt?: number;
  annualPropertyTax: number;
  monthlyHoa: number;
  estimatedMonthlyRent: number;
  condition: 'excellent' | 'good' | 'average' | 'fair' | 'poor';
}
```

### `Financing` (zod-validated)

```ts
{
  downPaymentPct: number;     // 0..1
  annualRate: number;          // 0..1
  termYears: number;
  closingCostsPct: number;     // default 0.025
}
```

### Market profiles (`assumptions.ts`)

Optimistic profile per market. **Осознанный выбор** для marketing-facing проекций (landing pages, инвестор-питчи). Переключение на conservative — когда появятся реальные portfolio data или нужны lender-facing отчёты.

| Market | vacancy | mgmt | maint | capex | rentGrowth | apprec |
|---|---|---|---|---|---|---|
| **CY** (default) | 4% | 8% | 4% | 3% | 5% | 6% |
| RU | 3% | 4% | 4% | 3% | 6% | 5% |
| EU | 4% | 7% | 4% | 3% | 3.5% | 4% |
| US | 3% | 6% | 4% | 3% | 4% | 5% |

`DEFAULT_MARKET = 'CY'`. Override через `buyAndHold(property, financing, 'RU')` или передачу custom `OperatingAssumptions`.

## Outputs

### `BuyAndHoldResult`
```ts
{
  totalCashInvested: number;   // down + closing
  monthlyPI: number;            // mortgage principal+interest
  monthlyPITI: number;          // + taxes/insurance/HOA
  noi: number;                  // annual net operating income
  annualCashFlow: number;       // NOI - debt service
  capRate: number;              // NOI / price
  cashOnCash: number;           // annualCashFlow / totalCashInvested
  dscr: number;                 // NOI / annual debt service
  grossRentMultiplier: number;  // price / annual gross rent
}
```

### `BrrrrResult`
- `allInCost`, `arv`, `equityCreated`
- `refinanceAmount` (75% LTV), `cashLeftInDeal`
- `infiniteReturn` (cashLeftInDeal ≤ 0)
- `meets70Rule`

### `FlipResult`
- `totalProjectCost`, `netProfit`, `profitMarginPct`
- `roiOnCashInvested`, `annualizedRoi`
- `meets70Rule`

## Math invariants (verified in `calc.test.ts`)

1. `monthlyMortgagePayment(0, *, *) === 0`
2. `monthlyMortgagePayment(L, 0, T) === L / (T*12)` (linear amortization at zero rate)
3. Standard amortization formula: $200k @ 6% / 30y ≈ $1199.10
4. `noi(p, 'RU') > noi(p, 'CY')` when only mgmt fee differs (RU 4% < CY 8%)
5. **Positive leverage:** when `capRate > mortgageRate`, lower down payment → higher cash-on-cash
6. **70% rule:** `purchase + rehab ≤ ARV * 0.7` (boundary inclusive)
7. **Infinite return:** when `(purchase + closing + rehab + holding) ≤ ARV * 0.75`

## Hard rules respected

- ✓ Локально — no cloud AI calls
- ✓ Zod валидация на границе (`propertySchema`, `financingSchema`)
- ✓ Stateless — никакого глобального состояния
- ✓ `$env/static/private` не требуется (engine не лезет в env)
- ✓ Не нарушает "AI = оркестратор" — это не LLM, это math
- ⚠ Audit hook TBD (Phase 5) — пока вызывающий код фиксирует сам
- ⚠ Policy pre/post-check TBD — engine безопасен для read-only сценариев

## Usage

```ts
import { buyAndHold, brrrr, flip, getAssumptions } from '$lib/server/ai-core/management-accounting/investment';

const result = buyAndHold(
  { address: '...', price: 400_000, ... },
  { downPaymentPct: 0.3, annualRate: 0.045, termYears: 25, closingCostsPct: 0.025 },
  'CY' // optional market override
);
```

## Testing

```sh
npm run test:engines
```

Использует built-in `node:test` + `tsx`. 14 тестов / 6 suites. Никаких внешних test-runner зависимостей.

## Provenance

Math портирована из импортированных Claude Code skills (`agents/realestate-*`, `skills/realestate-*`). Скилы остаются как **дизайн-тайм инструменты разработчика** и не используются runtime'ом.

## Roadmap

- **v0.1 (now)** — pure functions, in-memory inputs
- **v0.2** — Engine wrapper (`call(req, ctx)`) + audit entries
- **v0.3** — `realestate.properties` adapter; resolve `propertyId` → `Property` через SoT
- **v0.4** — Multi-year projection function (10-year cash flow + appreciation + tax shield)
- **v0.5** — Scoring rubric (0-100 weighted composite Property Score)
