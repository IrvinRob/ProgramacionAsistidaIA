<script>
	import { resolve } from '$app/paths';
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
		<a
			href={resolve('/logout')}
			class="mt-6 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
		>
			Cerrar sesion
		</a>
	</section>
</main>
