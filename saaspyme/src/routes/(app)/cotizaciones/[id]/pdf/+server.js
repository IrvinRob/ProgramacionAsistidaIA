import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { requireUsuario } from '$lib/server/auth.js';
import { generarFacturaPdf } from '$lib/server/facturaPdf.js';

export async function GET({ locals, params }) {
	requireUsuario(locals);

	const cotizacion = await prisma.cotizacion.findUnique({
		where: { id: params.id },
		include: { cliente: true, conceptos: true }
	});

	if (!cotizacion) {
		error(404, 'Cotizacion no encontrada.');
	}

	const pdf = await generarFacturaPdf({
		cotizacion,
		cliente: cotizacion.cliente,
		conceptos: cotizacion.conceptos,
		titulo: 'Cotizacion'
	});

	return new Response(pdf, {
		headers: {
			'content-type': 'application/pdf',
			'content-disposition': `attachment; filename="cotizacion-${cotizacion.numero}.pdf"`
		}
	});
}
