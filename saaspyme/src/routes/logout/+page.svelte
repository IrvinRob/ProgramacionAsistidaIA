<script>
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { data } = $props();

	$effect(() => {
		if (!browser || !data.publishableKey) {
			goto(resolve('/login'));
			return;
		}

		import('@clerk/clerk-js')
			.then(async ({ Clerk }) => {
				const clerk = new Clerk(data.publishableKey);
				await clerk.load();
				await clerk.signOut();
			})
			.finally(() => {
				goto(resolve('/login'));
			});
	});
</script>

<svelte:head>
	<title>Cerrando sesion | GestorPyme</title>
</svelte:head>

<main class="grid min-h-screen place-items-center bg-slate-950 px-6 text-white">
	<div class="text-center">
		<h1 class="text-xl font-semibold">Cerrando sesion</h1>
		<p class="mt-2 text-sm text-slate-300">Un momento.</p>
	</div>
</main>
