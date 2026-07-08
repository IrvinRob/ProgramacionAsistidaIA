export const mxnFormatter = new Intl.NumberFormat('es-MX', {
	style: 'currency',
	currency: 'MXN'
});

export const dateFormatter = new Intl.DateTimeFormat('es-MX', {
	year: 'numeric',
	month: 'short',
	day: '2-digit'
});

export function formatMXN(value) {
	return mxnFormatter.format(Number(value ?? 0));
}

export function formatDate(value) {
	if (!value) return '';
	return dateFormatter.format(new Date(value));
}
