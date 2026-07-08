import { formatMXN } from './format.js';

function escapeHtml(value) {
	return String(value ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

export function templateCotizacionEnviada({ cliente, cotizacion, conceptos, url }) {
	const filasConceptos = conceptos
		.map(
			(concepto) => `
				<tr>
					<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(concepto.descripcion)}</td>
					<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${escapeHtml(concepto.cantidad)}</td>
					<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMXN(concepto.precioUnitario)}</td>
					<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMXN(concepto.subtotal)}</td>
				</tr>`
		)
		.join('');

	return `<!doctype html>
<html lang="es">
	<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
		<div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
			<div style="background:#1f2937;padding:24px 32px;">
				<h1 style="color:#ffffff;margin:0;font-size:22px;">Cotizacion ${escapeHtml(cotizacion.numero)}</h1>
			</div>
			<div style="padding:32px;">
				<p style="color:#374151;font-size:15px;">Estimado/a <strong>${escapeHtml(cliente.nombre)}</strong>,</p>
				<p style="color:#374151;font-size:15px;">Le enviamos la cotizacion <strong>${escapeHtml(cotizacion.numero)}</strong> con el siguiente desglose:</p>
				<table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
					<thead>
						<tr style="background:#f3f4f6;">
							<th style="padding:10px 12px;text-align:left;color:#6b7280;">Descripcion</th>
							<th style="padding:10px 12px;text-align:center;color:#6b7280;">Cant.</th>
							<th style="padding:10px 12px;text-align:right;color:#6b7280;">Precio Unit.</th>
							<th style="padding:10px 12px;text-align:right;color:#6b7280;">Subtotal</th>
						</tr>
					</thead>
					<tbody>${filasConceptos}</tbody>
				</table>
				<div style="text-align:right;margin-top:16px;padding:16px;background:#eef2ff;border-radius:6px;">
					<p style="margin:4px 0;color:#6b7280;font-size:13px;">Subtotal: ${formatMXN(cotizacion.subtotal)}</p>
					<p style="margin:4px 0;color:#6b7280;font-size:13px;">IVA (16%): ${formatMXN(cotizacion.iva)}</p>
					<p style="margin:0;color:#1f2937;font-size:20px;font-weight:bold;">Total: ${formatMXN(cotizacion.total)}</p>
				</div>
				${
					url
						? `<p style="margin-top:24px;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#1f2937;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:6px;">Ver cotizacion</a></p>`
						: ''
				}
			</div>
		</div>
	</body>
</html>`;
}

export function templateRecordatorioPago({ cliente, cotizacion, saldoPendiente }) {
	return `<!doctype html>
<html lang="es">
	<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
		<div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
			<div style="background:#1f2937;padding:24px 32px;">
				<h1 style="color:#ffffff;margin:0;font-size:22px;">Recordatorio de pago</h1>
			</div>
			<div style="padding:32px;">
				<p style="color:#374151;">Estimado/a <strong>${escapeHtml(cliente.nombre)}</strong>,</p>
				<p style="color:#374151;">Le recordamos que tiene un saldo pendiente de la cotizacion <strong>${escapeHtml(cotizacion.numero)}</strong>.</p>
				<div style="text-align:center;padding:24px;background:#fef3c7;border-radius:8px;margin:20px 0;">
					<p style="margin:0;color:#92400e;font-size:13px;">Saldo pendiente</p>
					<p style="margin:8px 0 0;color:#92400e;font-size:28px;font-weight:bold;">${formatMXN(saldoPendiente)}</p>
				</div>
				<p style="color:#374151;font-size:14px;">Para cualquier aclaracion, no dude en contactarnos.</p>
			</div>
		</div>
	</body>
</html>`;
}
