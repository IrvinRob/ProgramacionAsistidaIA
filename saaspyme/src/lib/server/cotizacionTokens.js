import crypto from 'node:crypto';
import { CLERK_SECRET_KEY } from '$env/static/private';

const ACTIONS = new Set(['aprobar', 'rechazar', 'pagar']);

function secret() {
	return CLERK_SECRET_KEY || 'gestorpyme-dev-secret';
}

function sign(payload) {
	return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createCotizacionToken(cotizacionId, action) {
	const payload = `${cotizacionId}:${action}`;
	return Buffer.from(`${payload}:${sign(payload)}`).toString('base64url');
}

export function verifyCotizacionToken(token) {
	try {
		const decoded = Buffer.from(String(token ?? ''), 'base64url').toString('utf8');
		const parts = decoded.split(':');

		if (parts.length !== 3) return null;

		const [cotizacionId, action, signature] = parts;
		const payload = `${cotizacionId}:${action}`;

		if (!cotizacionId || !ACTIONS.has(action) || sign(payload) !== signature) {
			return null;
		}

		return { cotizacionId, action };
	} catch {
		return null;
	}
}
