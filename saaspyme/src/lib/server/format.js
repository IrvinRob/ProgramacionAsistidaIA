import { formatCalendarDate } from '$lib/dates.js';

export const mxnFormatter = new Intl.NumberFormat('es-MX', {
	style: 'currency',
	currency: 'MXN'
});

export function formatMXN(value) {
	return mxnFormatter.format(Number(value ?? 0));
}

export function formatDate(value) {
	if (!value) return '';
	return formatCalendarDate(value);
}
