export const ESTADOS_FINALES = new Set(['RECHAZADA', 'PAGADA']);

export const TRANSICIONES_ESTADO = {
	BORRADOR: ['ENVIADA'],
	ENVIADA: ['APROBADA', 'RECHAZADA'],
	APROBADA: ['FACTURADA', 'PAGADA'],
	FACTURADA: ['PAGADA'],
	RECHAZADA: [],
	PAGADA: []
};

export function puedeCambiarEstado(estadoActual, nuevoEstado) {
	return TRANSICIONES_ESTADO[estadoActual]?.includes(nuevoEstado) ?? false;
}

export function calcularTotales(conceptos) {
	const subtotal = conceptos.reduce((sum, concepto) => {
		return sum + Number(concepto.cantidad) * Number(concepto.precioUnitario);
	}, 0);
	const iva = subtotal * 0.16;
	const total = subtotal + iva;

	return {
		subtotal: redondearMoneda(subtotal),
		iva: redondearMoneda(iva),
		total: redondearMoneda(total)
	};
}

export function redondearMoneda(value) {
	return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calcularSaldo(cotizacion) {
	const pagado = cotizacion.pagos?.reduce((sum, pago) => sum + Number(pago.monto), 0) ?? 0;
	return redondearMoneda(Number(cotizacion.total) - pagado);
}
