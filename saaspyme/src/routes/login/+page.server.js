import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';

function safeRedirectTo(value) {
	if (!value || !value.startsWith('/') || value.startsWith('//')) {
		return '/dashboard';
	}

	if (['/login', '/logout'].includes(value)) {
		return '/dashboard';
	}

	return value;
}

export function load({ url }) {
	return {
		publishableKey: PUBLIC_CLERK_PUBLISHABLE_KEY,
		redirectTo: safeRedirectTo(url.searchParams.get('redirectTo'))
	};
}
