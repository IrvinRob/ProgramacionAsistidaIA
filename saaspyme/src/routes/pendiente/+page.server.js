import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';

export function load() {
	return {
		publishableKey: PUBLIC_CLERK_PUBLISHABLE_KEY
	};
}
