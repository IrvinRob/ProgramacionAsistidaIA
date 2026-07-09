let clerkPromise;
let clerkUiPromise;

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

function appendScript(src, attrs = {}) {
	return new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.async = true;
		script.crossOrigin = 'anonymous';
		script.src = src;

		for (const [key, value] of Object.entries(attrs)) {
			script.dataset[key] = value;
		}

		script.addEventListener('load', resolve);
		script.addEventListener('error', () => reject(new Error(`No se pudo descargar ${src}`)));
		document.head.appendChild(script);
	});
}

function loadClerkUi(frontendApi) {
	if (window.__internal_ClerkUICtor) {
		return Promise.resolve(window.__internal_ClerkUICtor);
	}

	if (!clerkUiPromise) {
		clerkUiPromise = appendScript(`https://${frontendApi}/npm/@clerk/ui@1/dist/ui.browser.js`).then(
			() => {
				if (!window.__internal_ClerkUICtor) {
					throw new Error('Clerk UI no quedo disponible en window');
				}

				return window.__internal_ClerkUICtor;
			}
		);
	}

	return clerkUiPromise;
}

function loadClerkScript(frontendApi, publishableKey) {
	if (window.Clerk) {
		return Promise.resolve(window.Clerk);
	}

	return appendScript(`https://${frontendApi}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, {
		clerkPublishableKey: publishableKey
	}).then(() => {
		if (!window.Clerk) {
			throw new Error('Clerk no quedo disponible en window');
		}

		return window.Clerk;
	});
}

export function loadClerk(publishableKey) {
	if (!publishableKey) {
		return Promise.reject(new Error('Falta PUBLIC_CLERK_PUBLISHABLE_KEY'));
	}

	if (!clerkPromise) {
		const frontendApi = getClerkFrontendApi(publishableKey);
		clerkPromise = Promise.all([
			loadClerkUi(frontendApi),
			loadClerkScript(frontendApi, publishableKey)
		]).then(([ClerkUI, Clerk]) =>
			Clerk.load({
				ui: { ClerkUI },
				signInUrl: '/login',
				signUpUrl: '/login',
				signInFallbackRedirectUrl: '/dashboard',
				signUpFallbackRedirectUrl: '/dashboard'
			}).then(() => Clerk)
		);
	}

	return clerkPromise;
}
