<script>
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { loadClerk } from '$lib/client/clerk.js';

	let { data } = $props();
	let error = $state('');
	let clerk = $state();
	let loading = $state(true);
	let submitting = $state(false);

	$effect(() => {
		if (!browser || !data.publishableKey) return;

		loadClerk(data.publishableKey)
			.then((loadedClerk) => {
				clerk = loadedClerk;
				return clerk.load();
			})
			.then(() => {
				if (clerk.user) {
					goto(resolve('/dashboard'));
					return;
				}
			})
			.catch((cause) => {
				console.error('No se pudo cargar Clerk', cause);
				error = 'No se pudo cargar Clerk. Revisa la llave publica.';
			})
			.finally(() => {
				loading = false;
			});
	});

	async function signInWithGoogle() {
		if (!clerk?.client?.signIn) return;

		submitting = true;
		error = '';

		try {
			await clerk.client.signIn.sso({
				strategy: 'oauth_google',
				redirectUrl: `${window.location.origin}${resolve('/dashboard')}`,
				redirectCallbackUrl: `${window.location.origin}${resolve('/login')}`
			});
		} catch (cause) {
			console.error('No se pudo iniciar sesion con Google', cause);
			error = 'No se pudo iniciar sesion con Google. Intenta de nuevo.';
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Login | GestorPyme</title>
</svelte:head>

<main class="grid min-h-screen bg-slate-950 text-white lg:grid-cols-[1.05fr_0.95fr]">
	<section
		class="flex min-h-[42vh] flex-col justify-between px-6 py-8 sm:px-10 lg:min-h-screen lg:px-14"
	>
		<div class="text-lg font-semibold tracking-tight">GestorPyme</div>
		<div class="max-w-xl py-14">
			<h1 class="text-4xl leading-tight font-semibold tracking-normal sm:text-5xl">
				Clientes, cotizaciones y cobranza en un solo lugar.
			</h1>
			<p class="mt-5 max-w-lg text-base leading-7 text-slate-300">
				Acceso privado con Google para despachos contables y consultorias de servicios
				profesionales.
			</p>
		</div>
		<p class="text-sm text-slate-400">MXN · Supabase · Clerk · Resend</p>
	</section>

	<section class="flex items-center justify-center bg-white px-6 py-10 text-slate-950">
		<div class="w-full max-w-md">
			{#if data.publishableKey}
				<div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
					<h2 class="text-xl font-semibold">Iniciar sesion</h2>
					<p class="mt-2 text-sm leading-6 text-slate-600">
						Usa tu cuenta de Google para acceder al panel de GestorPyme.
					</p>
					<button
						type="button"
						class="mt-6 inline-flex w-full justify-center rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
						disabled={loading || submitting || !clerk}
						onclick={signInWithGoogle}
					>
						{submitting ? 'Abriendo Google...' : loading ? 'Cargando...' : 'Continuar con Google'}
					</button>
				</div>
				{#if error}
					<p class="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
				{/if}
			{:else}
				<div class="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
					<h2 class="text-lg font-semibold">Falta configurar Clerk</h2>
					<p class="mt-2 text-sm leading-6">
						Agrega `PUBLIC_CLERK_PUBLISHABLE_KEY` en `.env` para activar el login con Google.
					</p>
				</div>
			{/if}
		</div>
	</section>
</main>
