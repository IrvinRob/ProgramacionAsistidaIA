<script>
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Cotizaciones | GestorPyme</title>
</svelte:head>

<section class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-normal text-slate-950">Cotizaciones</h1>
			<p class="mt-1 text-sm text-slate-500">Creacion, estados, pagos e historial.</p>
		</div>
		<a
			href={resolve('/cotizaciones/nueva')}
			class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
		>
			Nueva cotizacion
		</a>
	</div>

	<div class="rounded-lg border border-slate-200 bg-white p-8 text-center">
		<h2 class="text-base font-semibold text-slate-950">Modulo en preparacion</h2>
		<p class="mt-2 text-sm text-slate-500">
			La siguiente etapa implementa listado, filtros, creacion, detalle y transiciones seguras.
		</p>
	</div>
</section>
