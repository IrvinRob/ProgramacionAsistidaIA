import { env } from '$env/dynamic/public';

export function load({ locals }) {
	const usuario = locals.usuario
		? {
				id: locals.usuario.id,
				nombre: locals.usuario.nombre,
				correo: locals.usuario.correo,
				rol: locals.usuario.rol,
				activo: locals.usuario.activo,
				imageUrl: locals.imageUrl
			}
		: null;

	return {
		userId: locals.userId,
		usuario,
		morphcastLicenseKey: env.PUBLIC_MORPHCAST_LICENSE_KEY ?? ''
	};
}
