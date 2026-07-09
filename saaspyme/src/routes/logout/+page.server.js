import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';
import { SESSION_COOKIE } from '$lib/server/auth.js';

export function load({ cookies }) {
	cookies.delete(SESSION_COOKIE, { path: '/' });

	return {
		publishableKey: PUBLIC_CLERK_PUBLISHABLE_KEY
	};
}
