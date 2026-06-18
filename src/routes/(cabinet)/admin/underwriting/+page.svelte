<script lang="ts">
	import { formatCurrency } from '$lib/utils/formatters';
	let { form } = $props();

	const errors = $derived((form && form.ok === false ? form.errors : {}) as Record<string, string>);
	const input = $derived((form?.input ?? {}) as Record<string, string>);
	const result = $derived(form && form.ok === true ? form : null);

	function fmtPct(n: number, digits = 2): string {
		return (n * 100).toFixed(digits) + '%';
	}
	function fmtNum(n: number, digits = 0): string {
		return n.toLocaleString('en-US', { maximumFractionDigits: digits });
	}
	function signal(value: number, good: number, ok: number): 'good' | 'ok' | 'bad' {
		if (value >= good) return 'good';
		if (value >= ok) return 'ok';
		return 'bad';
	}
</script>

<svelte:head>
	<title>Underwriting — Groundz Admin</title>
</svelte:head>

<div class="wrap">
	<div class="head">
		<span class="kicker">ADMIN</span>
		<h1>Property Underwriting</h1>
		<p class="sub">
			Deterministic investment math from the AI Core investment engine. No LLM —
			pure formulas with per-market assumptions (vacancy, management, capex,
			appreciation). See <code>docs/spec/09-investment-engine.md</code>.
		</p>
	</div>

	<form method="POST" action="?/analyze" class="card form">
		<div class="row">
			<label>
				Market
				<select name="market" value={input.market ?? 'CY'}>
					<option value="CY">CY — Cyprus (default)</option>
					<option value="RU">RU — Russia</option>
					<option value="EU">EU — Europe</option>
					<option value="US">US — United States</option>
				</select>
			</label>
		</div>

		<h3>Property</h3>
		<div class="grid">
			<label class="span-2">
				Address
				<input name="address" required value={input.address ?? ''} placeholder="123 Limassol Ave, Limassol, CY" />
			</label>
			<label>
				List price (€)
				<input name="price" type="number" step="1000" min="0" required value={input.price ?? '400000'} />
			</label>
			<label>
				Monthly rent (€)
				<input name="estimatedMonthlyRent" type="number" step="50" min="0" required value={input.estimatedMonthlyRent ?? '2500'} />
			</label>
			<label>
				Beds
				<input name="beds" type="number" min="0" required value={input.beds ?? '3'} />
			</label>
			<label>
				Baths
				<input name="baths" type="number" min="0" step="0.5" required value={input.baths ?? '2'} />
			</label>
			<label>
				Sq ft
				<input name="sqft" type="number" min="0" required value={input.sqft ?? '1500'} />
			</label>
			<label>
				Year built
				<input name="yearBuilt" type="number" min="1700" max="2100" value={input.yearBuilt ?? '2015'} />
			</label>
			<label>
				Annual property tax (€)
				<input name="annualPropertyTax" type="number" min="0" value={input.annualPropertyTax ?? '1200'} />
			</label>
			<label>
				Monthly HOA (€)
				<input name="monthlyHoa" type="number" min="0" value={input.monthlyHoa ?? '0'} />
			</label>
			<label>
				Condition
				<select name="condition" value={input.condition ?? 'good'}>
					<option value="excellent">Excellent</option>
					<option value="good">Good</option>
					<option value="average">Average</option>
					<option value="fair">Fair</option>
					<option value="poor">Poor</option>
				</select>
			</label>
		</div>

		<h3>Financing</h3>
		<div class="grid">
			<label>
				Down payment %
				<input name="downPaymentPct" type="number" min="0" max="1" step="0.05" required value={input.downPaymentPct ?? '0.3'} />
			</label>
			<label>
				Annual rate
				<input name="annualRate" type="number" min="0" max="1" step="0.001" required value={input.annualRate ?? '0.045'} />
			</label>
			<label>
				Term (years)
				<input name="termYears" type="number" min="1" required value={input.termYears ?? '25'} />
			</label>
			<label>
				Closing costs %
				<input name="closingCostsPct" type="number" min="0" max="0.1" step="0.005" value={input.closingCostsPct ?? '0.025'} />
			</label>
		</div>

		<h3>BRRRR / Flip (optional)</h3>
		<p class="sub small">Leave ARV at 0 to skip BRRRR + Flip analysis.</p>
		<div class="grid">
			<label>
				Rehab cost (€)
				<input name="rehabCost" type="number" min="0" value={input.rehabCost ?? '0'} />
			</label>
			<label>
				ARV (€)
				<input name="arv" type="number" min="0" value={input.arv ?? '0'} />
			</label>
			<label>
				Holding months
				<input name="holdingMonths" type="number" min="0" value={input.holdingMonths ?? '6'} />
			</label>
			<label>
				Holding cost / month (€)
				<input name="holdingCostPerMonth" type="number" min="0" value={input.holdingCostPerMonth ?? '1500'} />
			</label>
		</div>

		{#if Object.keys(errors).length > 0}
			<div class="err">
				{#each Object.entries(errors) as [field, msg]}
					<div><strong>{field}:</strong> {msg}</div>
				{/each}
			</div>
		{/if}

		<button type="submit">Analyze property</button>
	</form>

	{#if result}
		<div class="card">
			<h2>Buy &amp; Hold — {result.property.address}</h2>
			<p class="meta">Market: {result.market} · {fmtPct(result.financing.downPaymentPct, 0)} down · {fmtPct(result.financing.annualRate, 2)} / {result.financing.termYears}y</p>

			<div class="kpis">
				<div class="kpi">
					<span class="kpi-label">Cap rate</span>
					<span class="kpi-value {signal(result.buyHold.capRate, 0.07, 0.05)}">{fmtPct(result.buyHold.capRate)}</span>
				</div>
				<div class="kpi">
					<span class="kpi-label">Cash-on-cash</span>
					<span class="kpi-value {signal(result.buyHold.cashOnCash, 0.08, 0.04)}">{fmtPct(result.buyHold.cashOnCash)}</span>
				</div>
				<div class="kpi">
					<span class="kpi-label">DSCR</span>
					<span class="kpi-value {signal(result.buyHold.dscr, 1.25, 1.0)}">{result.buyHold.dscr.toFixed(2)}</span>
				</div>
				<div class="kpi">
					<span class="kpi-label">GRM</span>
					<span class="kpi-value">{result.buyHold.grossRentMultiplier.toFixed(1)}</span>
				</div>
			</div>

			<table>
				<tbody>
					<tr><th>Total cash invested</th><td>€{fmtNum(result.buyHold.totalCashInvested)}</td></tr>
					<tr><th>Monthly P&amp;I</th><td>€{fmtNum(result.buyHold.monthlyPI, 2)}</td></tr>
					<tr><th>Monthly PITI</th><td>€{fmtNum(result.buyHold.monthlyPITI, 2)}</td></tr>
					<tr><th>Annual NOI</th><td>€{fmtNum(result.buyHold.noi)}</td></tr>
					<tr>
						<th>Annual cash flow</th>
						<td class={result.buyHold.annualCashFlow >= 0 ? 'pos' : 'neg'}>€{fmtNum(result.buyHold.annualCashFlow)}</td>
					</tr>
				</tbody>
			</table>
		</div>

		{#if result.brrrr && result.flip}
			<div class="two-col">
				<div class="card">
					<h2>BRRRR</h2>
					<table>
						<tbody>
							<tr><th>All-in cost</th><td>€{fmtNum(result.brrrr.allInCost)}</td></tr>
							<tr><th>ARV</th><td>€{fmtNum(result.brrrr.arv)}</td></tr>
							<tr><th>Equity created</th><td class={result.brrrr.equityCreated >= 0 ? 'pos' : 'neg'}>€{fmtNum(result.brrrr.equityCreated)}</td></tr>
							<tr><th>Refi amount (75% LTV)</th><td>€{fmtNum(result.brrrr.refinanceAmount)}</td></tr>
							<tr><th>Cash left in deal</th><td class={result.brrrr.cashLeftInDeal <= 0 ? 'pos' : 'neg'}>€{fmtNum(result.brrrr.cashLeftInDeal)}</td></tr>
							<tr><th>Infinite return?</th><td class={result.brrrr.infiniteReturn ? 'pos' : ''}>{result.brrrr.infiniteReturn ? 'Yes' : 'No'}</td></tr>
							<tr><th>70% rule</th><td class={result.brrrr.meets70Rule ? 'pos' : 'neg'}>{result.brrrr.meets70Rule ? 'Meets' : 'Fails'}</td></tr>
						</tbody>
					</table>
				</div>
				<div class="card">
					<h2>Fix &amp; Flip</h2>
					<table>
						<tbody>
							<tr><th>Total project cost</th><td>€{fmtNum(result.flip.totalProjectCost)}</td></tr>
							<tr><th>Net profit</th><td class={result.flip.netProfit >= 0 ? 'pos' : 'neg'}>€{fmtNum(result.flip.netProfit)}</td></tr>
							<tr><th>Profit margin</th><td class={signal(result.flip.profitMarginPct, 0.15, 0.10)}>{fmtPct(result.flip.profitMarginPct)}</td></tr>
							<tr><th>ROI on cash</th><td class={signal(result.flip.roiOnCashInvested, 0.20, 0.10)}>{fmtPct(result.flip.roiOnCashInvested)}</td></tr>
							<tr><th>Annualized ROI</th><td class={signal(result.flip.annualizedRoi, 0.30, 0.15)}>{fmtPct(result.flip.annualizedRoi)}</td></tr>
							<tr><th>70% rule</th><td class={result.flip.meets70Rule ? 'pos' : 'neg'}>{result.flip.meets70Rule ? 'Meets' : 'Fails'}</td></tr>
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.wrap {
		max-width: 1100px;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
	.head .kicker {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}
	.head h1 {
		font-size: var(--text-2xl);
		font-weight: 700;
		margin-top: var(--space-1);
	}
	.head .sub {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		margin-top: var(--space-2);
		max-width: 720px;
	}
	.head .sub code {
		font-size: 12px;
		background: rgba(0, 0, 0, 0.05);
		padding: 1px 6px;
		border-radius: 4px;
	}
	.card {
		background: rgba(255, 255, 255, 0.55);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.06);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}
	.form h3 {
		font-size: var(--text-sm);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
		margin: var(--space-5) 0 var(--space-3);
	}
	.form h3:first-of-type {
		margin-top: var(--space-4);
	}
	.form .small {
		font-size: var(--text-xs);
		margin-bottom: var(--space-3);
	}
	.row {
		display: flex;
		gap: var(--space-4);
		align-items: end;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-3);
	}
	.span-2 {
		grid-column: span 2;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	input,
	select {
		font-family: inherit;
		font-size: var(--text-sm);
		color: var(--color-text);
		text-transform: none;
		letter-spacing: 0;
		padding: var(--space-2) var(--space-3);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: var(--radius-md);
		background: rgba(255, 255, 255, 0.7);
		font-weight: 500;
	}
	input:focus,
	select:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
	}
	button {
		margin-top: var(--space-5);
		padding: var(--space-3) var(--space-6);
		background: var(--color-text);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-weight: 700;
		font-size: var(--text-sm);
		cursor: pointer;
		align-self: start;
	}
	button:hover {
		opacity: 0.9;
	}
	.err {
		margin-top: var(--space-4);
		padding: var(--space-3) var(--space-4);
		background: rgba(220, 38, 38, 0.08);
		border: 1px solid rgba(220, 38, 38, 0.2);
		border-radius: var(--radius-md);
		color: #b91c1c;
		font-size: var(--text-xs);
	}
	.card h2 {
		font-size: var(--text-lg);
		font-weight: 700;
		margin-bottom: var(--space-1);
	}
	.meta {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		margin-bottom: var(--space-5);
	}
	.kpis {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-3);
		margin-bottom: var(--space-5);
	}
	.kpi {
		display: flex;
		flex-direction: column;
		padding: var(--space-3) var(--space-4);
		background: rgba(0, 0, 0, 0.03);
		border-radius: var(--radius-md);
	}
	.kpi-label {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}
	.kpi-value {
		font-size: var(--text-xl);
		font-weight: 700;
		margin-top: var(--space-1);
	}
	.kpi-value.good,
	td.good,
	td.pos {
		color: #15803d;
	}
	.kpi-value.ok {
		color: #b45309;
	}
	.kpi-value.bad,
	td.bad,
	td.neg {
		color: #b91c1c;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th {
		text-align: left;
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		border-bottom: 1px solid rgba(0, 0, 0, 0.04);
	}
	td {
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		font-weight: 600;
		text-align: right;
		border-bottom: 1px solid rgba(0, 0, 0, 0.04);
	}
	.two-col {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-6);
	}
	@media (max-width: 768px) {
		.grid {
			grid-template-columns: 1fr 1fr;
		}
		.span-2 {
			grid-column: span 2;
		}
		.kpis {
			grid-template-columns: 1fr 1fr;
		}
		.two-col {
			grid-template-columns: 1fr;
		}
	}
</style>
