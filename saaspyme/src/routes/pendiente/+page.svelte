<script>
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { loadClerk } from '$lib/client/clerk.js';

	let { data } = $props();
	let status = $state('Revisando tu acceso...');

	$effect(() => {
		if (!browser || !data.publishableKey) return;

		let cancelled = false;

		async function syncPendingUser() {
			try {
				const clerk = await loadClerk(data.publishableKey);
				await clerk.load();

				if (!clerk.session) {
					status = 'No hay sesion activa. Vuelve a iniciar sesion.';
					return;
				}

				const token = await clerk.session.getToken();
				const response = await fetch(resolve('/api/auth/session'), {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						token,
						profile: {
							correo: clerk.user?.primaryEmailAddress?.emailAddress,
							nombre: clerk.user?.fullName
						}
					})
				});

				if (!response.ok) {
					throw new Error('No se pudo revisar el acceso.');
				}

				const result = await response.json();

				if (cancelled) return;

				if (result.redirectTo === '/dashboard') {
					await goto(resolve('/dashboard'), { invalidateAll: true });
					return;
				}

				status = 'Tu correo aun no coincide con un usuario activo.';
			} catch (cause) {
				console.error('No se pudo sincronizar usuario pendiente', cause);
				status = 'No se pudo revisar el acceso. Cierra sesion e intenta de nuevo.';
			}
		}

		syncPendingUser();

		return () => {
			cancelled = true;
		};
	});
</script>

<svelte:head>
	<title>Acceso pendiente | GestorPyme</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-950">
	<section class="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
		<p class="text-sm font-medium text-slate-500">Acceso pendiente</p>
		<h1 class="mt-2 text-2xl font-semibold tracking-normal">Tu usuario aun no esta activo</h1>
		<p class="mt-4 text-sm leading-6 text-slate-600">
			El administrador debe darte de alta como socio o asistente antes de que puedas entrar al
			sistema.
		</p>
		<p class="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">{status}</p>
		<a
			href={resolve('/logout')}
			class="mt-6 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
		>
			Cerrar sesion
		</a>
	</section>
</main>
