import { z } from 'zod';

const rfcRegex = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i;

export const clienteSchema = z.object({
	nombre: z.string().trim().min(2, 'El nombre es obligatorio'),
	empresa: z.string().trim().max(160).optional().or(z.literal('')),
	rfc: z
		.string()
		.trim()
		.transform((value) => value.toUpperCase())
		.refine((value) => value === '' || rfcRegex.test(value), 'RFC mexicano invalido')
		.optional(),
	correo: z.string().trim().email('Correo invalido'),
	telefono: z.string().trim().max(40).optional().or(z.literal('')),
	direccion: z.string().trim().max(500).optional().or(z.literal('')),
	notas: z.string().trim().max(1000).optional().or(z.literal(''))
});

export const conceptoSchema = z.object({
	descripcion: z.string().trim().min(3, 'La descripcion es obligatoria'),
	cantidad: z.coerce.number().positive('La cantidad debe ser mayor a cero'),
	precioUnitario: z.coerce.number().nonnegative('El precio no puede ser negativo')
});

export const pagoSchema = z.object({
	monto: z.coerce.number().positive('El pago debe ser mayor a cero'),
	fecha: z.coerce.date(),
	metodo: z.enum(['TRANSFERENCIA', 'EFECTIVO', 'CHEQUE', 'TARJETA']),
	referencia: z.string().trim().max(120).optional().or(z.literal(''))
});

export function formErrors(result) {
	if (result.success) return {};

	return Object.fromEntries(
		Object.entries(result.error.flatten().fieldErrors).map(([key, value]) => [key, value?.[0]])
	);
}
