const CLERK_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@6.24.0/dist/clerk.browser.js';

let clerkPromise;

export function loadClerk(publishableKey) {
	if (!publishableKey) {
		return Promise.reject(new Error('Falta PUBLIC_CLERK_PUBLISHABLE_KEY'));
	}

	if (globalThis.Clerk) {
		return Promise.resolve(globalThis.Clerk);
	}

	if (!clerkPromise) {
		clerkPromise = new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.async = true;
			script.crossOrigin = 'anonymous';
			script.dataset.clerkPublishableKey = publishableKey;
			script.src = CLERK_SCRIPT_URL;
			script.addEventListener('load', () => {
				if (globalThis.Clerk) {
					resolve(globalThis.Clerk);
				} else {
					reject(new Error('Clerk no quedo disponible en window'));
				}
			});
			script.addEventListener('error', () => {
				reject(new Error('No se pudo descargar Clerk'));
			});
			document.head.appendChild(script);
		});
	}

	return clerkPromise;
}
