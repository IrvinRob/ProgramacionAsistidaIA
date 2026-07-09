import PDFDocument from 'pdfkit';
import { formatDate, formatMXN } from './format.js';

export async function generarFacturaPdf({ cotizacion, cliente, conceptos, titulo = 'Factura' }) {
	const doc = new PDFDocument({ margin: 48, size: 'LETTER' });
	const chunks = [];

	doc.on('data', (chunk) => chunks.push(chunk));

	doc.fontSize(20).text(`${titulo} ${cotizacion.numero}`, { align: 'left' });
	doc.moveDown(0.5);
	doc.fontSize(10).fillColor('#475569').text(`Cliente: ${cliente.nombre}`);
	if (cliente.empresa) doc.text(`Empresa: ${cliente.empresa}`);
	doc.text(`Correo: ${cliente.correo}`);
	doc.text(`Fecha: ${formatDate(cotizacion.fecha)}`);
	doc.moveDown(1);

	doc.fillColor('#0f172a').fontSize(12).text('Desglose');
	doc.moveDown(0.5);

	const startX = 48;
	let y = doc.y;
	doc.fontSize(9).fillColor('#475569');
	doc.text('Descripcion', startX, y, { width: 230 });
	doc.text('Cant.', startX + 250, y, { width: 50, align: 'right' });
	doc.text('Precio', startX + 320, y, { width: 80, align: 'right' });
	doc.text('Subtotal', startX + 430, y, { width: 90, align: 'right' });
	doc.moveDown(0.5);
	doc.moveTo(startX, doc.y).lineTo(560, doc.y).strokeColor('#e2e8f0').stroke();
	doc.moveDown(0.5);

	doc.fillColor('#0f172a');
	for (const concepto of conceptos) {
		y = doc.y;
		doc.text(concepto.descripcion, startX, y, { width: 230 });
		doc.text(String(concepto.cantidad), startX + 250, y, { width: 50, align: 'right' });
		doc.text(formatMXN(concepto.precioUnitario), startX + 320, y, { width: 80, align: 'right' });
		doc.text(formatMXN(concepto.subtotal), startX + 430, y, { width: 90, align: 'right' });
		doc.moveDown(0.8);
	}

	doc.moveDown(1);
	doc.fontSize(11);
	doc.text(`Subtotal: ${formatMXN(cotizacion.subtotal)}`, { align: 'right' });
	doc.text(`IVA 16%: ${formatMXN(cotizacion.iva)}`, { align: 'right' });
	doc.fontSize(14).text(`Total: ${formatMXN(cotizacion.total)}`, { align: 'right' });

	doc.end();

	return new Promise((resolve, reject) => {
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);
	});
}
