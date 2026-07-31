import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeAeoSignals, checkAeo } from './aeo-rules';
import { analyzeStructure } from './analyzer';

const page = (body: string, head = '') =>
	`<html><head><title>Test page</title>${head}</head><body>${body}</body></html>`;

describe('analyzeAeoSignals', () => {
	it('counts yield claims with financial context (RU)', () => {
		const s = analyzeAeoSignals(page('<p>Доходность до 25% годовых при перепродаже.</p>'));
		assert.ok(s.yieldClaimCount >= 1);
	});

	it('counts yield claims with financial context (EN)', () => {
		const s = analyzeAeoSignals(page('<p>Projected rental yield of 14% after fees.</p>'));
		assert.equal(s.yieldClaimCount, 1);
	});

	it('ignores percentages without financial context', () => {
		const s = analyzeAeoSignals(page('<p>The building is 90% complete and 50% of units use gas.</p>'));
		assert.equal(s.yieldClaimCount, 0);
	});

	it('detects RU disclaimer', () => {
		const s = analyzeAeoSignals(page('<p>Расчёт является прогнозным и не гарантирует получение дохода.</p>'));
		assert.equal(s.hasDisclaimer, true);
	});

	it('detects updated date and author block', () => {
		const s = analyzeAeoSignals(page('<p>Автор: Елена Мельникова</p><p>Обновлено: 23 июля 2026</p>'));
		assert.equal(s.hasAuthorBlock, true);
		assert.equal(s.hasUpdatedDate, true);
	});

	it('counts external sources, excluding own domain', () => {
		const s = analyzeAeoSignals(
			page('<a href="https://matsne.gov.ge/law">law</a><a href="https://groundz.estate/x">self</a><a href="/pools">internal</a>')
		);
		assert.equal(s.externalSourceCount, 1);
	});

	it('flags mixed RU/EN content', () => {
		const ru = 'инвестиции в недвижимость Грузии доходность аренда налоги '.repeat(8);
		const en = 'investment property returns rental management fees taxes '.repeat(8);
		const s = analyzeAeoSignals(page(`<p>${ru}</p><p>${en}</p>`));
		assert.equal(s.mixedLanguage, true);
	});

	it('does not flag a single-language page', () => {
		const ru = 'инвестиции в недвижимость Грузии доходность аренда налоги '.repeat(12);
		const s = analyzeAeoSignals(page(`<p>${ru}</p>`));
		assert.equal(s.mixedLanguage, false);
	});
});

describe('checkAeo', () => {
	it('critical issue for yield claim without disclaimer', () => {
		const html = page('<p>Доходность до 25% годовых.</p>');
		const r = checkAeo(analyzeAeoSignals(html), analyzeStructure(html));
		assert.ok(r.issues.some(i => i.code === 'yield_claim_no_disclaimer' && i.severity === 'critical'));
		assert.ok(r.aeoScore < 70);
	});

	it('no claim issues when disclaimer and date are present', () => {
		const html = page(
			'<h1>Доходность апартаментов</h1><p>Прогнозная доходность 12%. Расчёт не гарантирует получение дохода.</p><p>Обновлено: 23 июля 2026. Автор: Елена Мельникова</p>'
		);
		const r = checkAeo(analyzeAeoSignals(html), analyzeStructure(html));
		assert.ok(!r.issues.some(i => i.code === 'yield_claim_no_disclaimer'));
		assert.ok(!r.issues.some(i => i.code === 'undated_financial_claims'));
	});

	it('flags missing schema and FAQ as AEO issues', () => {
		const html = page('<p>Просто текст.</p>');
		const r = checkAeo(analyzeAeoSignals(html), analyzeStructure(html));
		assert.ok(r.issues.some(i => i.code === 'aeo_missing_schema'));
		assert.ok(r.issues.some(i => i.code === 'aeo_no_faq'));
	});

	it('clean page scores high', () => {
		const html = page(
			'<h1>Гид</h1><section class="faq">FAQ</section><p>Автор: Е.М. Обновлено: 2026. Источник: <a href="https://nbg.gov.ge">НБГ</a></p>',
			'<script type="application/ld+json">{}</script>'
		);
		const r = checkAeo(analyzeAeoSignals(html), analyzeStructure(html));
		assert.ok(r.aeoScore >= 90, `score ${r.aeoScore}, issues: ${r.issues.map(i => i.code).join(',')}`);
	});
});
