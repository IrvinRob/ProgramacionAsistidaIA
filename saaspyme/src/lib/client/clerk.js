let clerkPromise;

function getClerkFrontendApi(publishableKey) {
	const encodedFrontendApi = publishableKey.replace(/^pk_(test|live)_/, '');
	const padded = encodedFrontendApi.padEnd(
		encodedFrontendApi.length + ((4 - (encodedFrontendApi.length % 4)) % 4),
		'='
	);
	return atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
		.replace(/^(test|live)_/, '')
		.replace(/\$$/, '');
}

function getClerkScriptUrl(publishableKey) {
	const frontendApi = getClerkFrontendApi(publishableKey);
	return `https://${frontendApi}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`;
}

export function loadClerk(publishableKey) {
	if (!publishableKey) {
		return Promise.reject(new Error('Falta PUBLIC_CLERK_PUBLISHABLE_KEY'));
	}

	if (window.Clerk) {
		return Promise.resolve(window.Clerk);
	}

	if (!clerkPromise) {
		clerkPromise = new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.async = true;
			script.crossOrigin = 'anonymous';
			script.dataset.clerkPublishableKey = publishableKey;
			script.src = getClerkScriptUrl(publishableKey);
			script.addEventListener('load', () => {
				if (window.Clerk) {
					resolve(window.Clerk);
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
