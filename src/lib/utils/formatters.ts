export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-CY', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(value);
}

export function formatCurrencyFull(value: number): string {
	return new Intl.NumberFormat('en-CY', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(value);
}

export function formatDate(date: Date | string): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	}).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
	return new Intl.DateTimeFormat('en-GB', {
		month: 'short',
		year: 'numeric'
	}).format(new Date(date));
}

export function roundPercent(value: number): number {
	return Math.round(value * 100) / 100;
}

export function formatPercent(value: number): string {
	return `${roundPercent(value).toFixed(2)}%`;
}

export function formatArea(sqm: number): string {
	return `${sqm} m²`;
}
