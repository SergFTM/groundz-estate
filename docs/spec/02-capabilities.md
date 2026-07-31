# Capabilities — Immutable Frame

Каждая capability обязательна для tenant. Не может быть удалена. Может быть скрыта в UI через `tenant.skin.enabledCaps`.

## Capability Manifest contract

```ts
interface Capability {
  id: string;                          // 'seo-optimizer'
  always_enabled: true;                // нельзя поменять
  models: string[];                    // имена Prisma-моделей
  routes: string[];                    // маршруты SvelteKit
  apiEndpoints: string[];
  aiPrompts?: Record<string, () => string>;
  ragNamespace?: string;               // под-фильтр в Qdrant
  bootstrap: (ctx: BootstrapCtx) => Promise<void>;
}
```

## Каркас-таблица capabilities

| ID | Models | UI routes | API endpoints | Bootstrap action |
|---|---|---|---|---|
| `lead-capture` | Lead | `/lead-forms`, `/contact` | `/api/book-consultation`, `/api/lead` | seed default form configs |
| `catalog` | Project, Unit, ConstructionPhase, ConstructionMedia | `/projects`, `/projects/[slug]`, `/admin/projects` | `/api/projects` | seed sample project from RAG |
| `cabinet` | User, Document, Payment | `/(cabinet)/*` (all 4 roles) | `/auth/*` | seed super-admin + roles |
| `investment-pools` | InvestmentPool, InvestorInvestment, Milestone, ConstructionReport | `/investment`, `/investor/*` | `/api/invest/*` | optional, gated by skin |
| `otc-market` | OtcListing, OtcOffer | `/otc`, `/investor/otc` | `/api/otc/*` | optional |
| `seo-optimizer` | SeoKeywordCluster, SeoPageProfile, SeoAudit, SeoContentRevision, InternalLinkSuggestion | `/admin/seo/*` | `/api/seo/*` | auto-run setup/analyze on RAG |
| `rag-chat` | (no model — uses Qdrant) | `/api/ai/chat` widget | `/api/ai/chat`, `/api/invest/pool-chat` | ensure tenant collection |
| `content` | Article, ArticleComment, ArticleCommentLike, FAQ, JobPosition, JobApplication | `/knowledge`, `/faq`, `/jobs` | `/api/articles/*` | seed FAQ from RAG |
| `notifications` | (uses email lib) | — | — | configure SMTP env |
| `market-data` | MarketIndex, IndexComponent, DailyPrice | `/admin/market-indices`, market widgets | `/api/market/*` | seed default indices |

## Capability registry

`src/lib/server/capabilities/registry.ts`

```ts
import { LEAD_CAPTURE } from './lead-capture/manifest';
import { CATALOG } from './catalog/manifest';
import { CABINET } from './cabinet/manifest';
import { INVESTMENT_POOLS } from './investment-pools/manifest';
import { OTC_MARKET } from './otc-market/manifest';
import { SEO_OPTIMIZER } from './seo-optimizer/manifest';
import { RAG_CHAT } from './rag-chat/manifest';
import { CONTENT } from './content/manifest';
import { NOTIFICATIONS } from './notifications/manifest';
import { MARKET_DATA } from './market-data/manifest';

export const CAPABILITIES = [
  LEAD_CAPTURE, CATALOG, CABINET, INVESTMENT_POOLS, OTC_MARKET,
  SEO_OPTIMIZER, RAG_CHAT, CONTENT, NOTIFICATIONS, MARKET_DATA,
] as const;

export function findCapability(id: string) {
  return CAPABILITIES.find(c => c.id === id);
}
```

## Bootstrap order (важно)

```
1. cabinet              (User table должен быть первым — все FK ссылаются)
2. notifications        (email config)
3. content              (Article, FAQ — нужны для SEO setup/analyze)
4. catalog              (Project, Unit)
5. lead-capture
6. investment-pools
7. otc-market
8. market-data
9. rag-chat             (Qdrant collection)
10. seo-optimizer       (запускает setup/analyze, использует content + catalog)
```

## Skin-overlay интеграция

Каждая capability при рендере UI:
1. Читает свои базовые поля (`Unit.code`, `Unit.bedrooms`, ...).
2. Читает `tenant.skin.unitFields` → дорисовывает динамические инпуты в формах.
3. Читает `tenant.skin.copyLibrary.voice` → подмешивает в AI промпты.
4. Читает `tenant.skin.brand` → подставляет цвета через CSS variables.

## Capability isolation rules

- Capability **не должна** напрямую импортировать модели/функции другой capability — только через публичные интерфейсы.
- Все Prisma-доступы идут через `event.locals.tenant.prisma`.
- Все AI-вызовы идут через `aiCore.ask({ tenantSlug, capability: 'seo', question, k })`.
- Логи capability помечаются префиксом: `[seo-optimizer:audit-page] ...`.
