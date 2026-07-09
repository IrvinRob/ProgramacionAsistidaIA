function numericSuffix(value) {
	const match = String(value ?? '').match(/(\d+)$/);
	return match ? Number(match[1]) : 0;
}

async function nextPrefixedId(tx, model, prefix, pad = 4) {
	const rows = await tx[model].findMany({
		where: { id: { startsWith: prefix } },
		select: { id: true },
		take: 1000
	});
	const next = rows.reduce((max, row) => Math.max(max, numericSuffix(row.id)), 0) + 1;

	return `${prefix}${String(next).padStart(pad, '0')}`;
}

export async function nextCotizacionIdentity(tx, fecha = new Date()) {
	const year = fecha.getUTCFullYear();
	const prefix = `COT-${year}-`;
	const rows = await tx.cotizacion.findMany({
		where: { numero: { startsWith: prefix } },
		select: { numero: true },
		take: 1000
	});
	const next = rows.reduce((max, row) => Math.max(max, numericSuffix(row.numero)), 0) + 1;
	const numero = `${prefix}${String(next).padStart(4, '0')}`;

	return { id: numero, numero };
}

export async function nextConceptoIds(tx, count) {
	const firstId = await nextPrefixedId(tx, 'concepto', 'con_');
	const first = numericSuffix(firstId);

	return Array.from(
		{ length: count },
		(_, index) => `con_${String(first + index).padStart(4, '0')}`
	);
}

export async function nextHistorialId(tx) {
	return nextPrefixedId(tx, 'historialCot', 'his_');
}

export async function nextPagoId(tx) {
	return nextPrefixedId(tx, 'pago', 'pag_');
}
