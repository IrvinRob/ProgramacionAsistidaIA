import { formatMXN } from './format.js';

function escapeHtml(value) {
	return String(value ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

function renderConceptos(conceptos) {
	return conceptos
		.map(
			(concepto) => `
				<div style="border:1px solid #e5e7eb;border-radius:8px;margin:0 0 12px;overflow:hidden;">
					<div style="padding:12px;background:#f9fafb;">
						<p style="margin:0;color:#111827;font-size:14px;font-weight:bold;line-height:1.4;word-break:break-word;">${escapeHtml(concepto.descripcion)}</p>
					</div>
					<div style="padding:10px 12px;border-top:1px solid #e5e7eb;">
						<table role="presentation" style="width:100%;border-collapse:collapse;font-size:13px;">
							<tr>
								<td style="padding:4px 0;color:#6b7280;">Cantidad</td>
								<td style="padding:4px 0;text-align:right;color:#111827;font-weight:bold;">${escapeHtml(concepto.cantidad)}</td>
							</tr>
							<tr>
								<td style="padding:4px 0;color:#6b7280;">Precio unitario</td>
								<td style="padding:4px 0;text-align:right;color:#111827;font-weight:bold;">${formatMXN(concepto.precioUnitario)}</td>
							</tr>
							<tr>
								<td style="padding:4px 0;color:#6b7280;">Subtotal</td>
								<td style="padding:4px 0;text-align:right;color:#111827;font-weight:bold;">${formatMXN(concepto.subtotal)}</td>
							</tr>
						</table>
					</div>
				</div>`
		)
		.join('');
}

export function templateCotizacionEnviada({
	cliente,
	cotizacion,
	conceptos,
	aprobarUrl,
	rechazarUrl
}) {
	const conceptosHtml = renderConceptos(conceptos);

	return `<!doctype html>
<html lang="es">
	<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:12px;width:100%;">
		<div style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;box-sizing:border-box;">
			<div style="background:#1f2937;padding:22px 20px;">
				<h1 style="color:#ffffff;margin:0;font-size:22px;line-height:1.25;word-break:break-word;">Cotizacion ${escapeHtml(cotizacion.numero)}</h1>
			</div>
			<div style="padding:24px 20px;">
				<p style="color:#374151;font-size:15px;line-height:1.5;">Estimado/a <strong>${escapeHtml(cliente.nombre)}</strong>,</p>
				<p style="color:#374151;font-size:15px;line-height:1.5;">Le enviamos la cotizacion <strong>${escapeHtml(cotizacion.numero)}</strong> con el siguiente desglose:</p>
				<div style="margin:20px 0;">${conceptosHtml}</div>
				<div style="text-align:right;margin-top:16px;padding:16px;background:#eef2ff;border-radius:6px;box-sizing:border-box;">
					<p style="margin:4px 0;color:#6b7280;font-size:13px;">Subtotal: ${formatMXN(cotizacion.subtotal)}</p>
					<p style="margin:4px 0;color:#6b7280;font-size:13px;">IVA (16%): ${formatMXN(cotizacion.iva)}</p>
					<p style="margin:0;color:#1f2937;font-size:20px;font-weight:bold;line-height:1.3;">Total: ${formatMXN(cotizacion.total)}</p>
				</div>
				<p style="margin-top:24px;">
					<a href="${escapeHtml(aprobarUrl)}" style="display:block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:6px;margin:0 0 10px;text-align:center;font-weight:bold;">Aprobar cotizacion</a>
					<a href="${escapeHtml(rechazarUrl)}" style="display:block;background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:6px;text-align:center;font-weight:bold;">Rechazar cotizacion</a>
				</p>
			</div>
		</div>
	</body>
</html>`;
}

export function templateFacturaEnviada({ cliente, cotizacion, conceptos, pagarUrl }) {
	const conceptosHtml = renderConceptos(conceptos);

	return `<!doctype html>
<html lang="es">
	<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:12px;width:100%;">
		<div style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;box-sizing:border-box;">
			<div style="background:#1f2937;padding:22px 20px;">
				<h1 style="color:#ffffff;margin:0;font-size:22px;line-height:1.25;word-break:break-word;">Factura ${escapeHtml(cotizacion.numero)}</h1>
			</div>
			<div style="padding:24px 20px;">
				<p style="color:#374151;font-size:15px;line-height:1.5;">Estimado/a <strong>${escapeHtml(cliente.nombre)}</strong>,</p>
				<p style="color:#374151;font-size:15px;line-height:1.5;">Su cotizacion fue aprobada y se adjunta la factura con el siguiente desglose:</p>
				<div style="margin:20px 0;">${conceptosHtml}</div>
				<div style="text-align:right;margin-top:16px;padding:16px;background:#f8fafc;border-radius:6px;box-sizing:border-box;">
					<p style="margin:4px 0;color:#6b7280;font-size:13px;">Subtotal: ${formatMXN(cotizacion.subtotal)}</p>
					<p style="margin:4px 0;color:#6b7280;font-size:13px;">IVA (16%): ${formatMXN(cotizacion.iva)}</p>
					<p style="margin:0;color:#1f2937;font-size:20px;font-weight:bold;line-height:1.3;">Total: ${formatMXN(cotizacion.total)}</p>
				</div>
				<p style="margin-top:24px;">
					<a href="${escapeHtml(pagarUrl)}" style="display:block;background:#1f2937;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:6px;text-align:center;font-weight:bold;">Liquidar factura</a>
				</p>
				<p style="color:#64748b;font-size:13px;margin-top:12px;">Si desea abonar una parte a su cuenta, contáctenos por teléfono o whatsapp.</p>
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
