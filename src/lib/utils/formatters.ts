export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-CY', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(value);
}

export function formatDate(date: Date | string): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	}).format(new Date(date));
}

export function roundPercent(value: number): number {
	return Math.round(value * 100) / 100;
}

