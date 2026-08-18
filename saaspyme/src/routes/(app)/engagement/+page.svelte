<script>
	import { EMOTION_LABELS } from '$lib/shared/emotions.js';

	let { data } = $props();

	const formatDate = (value) =>
		value
			? new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(
					new Date(value)
				)
			: 'En curso';

	const tipoLabel = {
		SALUDO_INICIAL: 'Saludo inicial',
		OFERTA_AYUDA: 'Oferta de ayuda',
		ACLARACION: 'Comentario positivo'
	};
</script>

<svelte:head>
	<title>Engagement | GestorPyme</title>
</svelte:head>

<section class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-normal text-slate-950">Dashboard de Engagement</h1>
		<p class="mt-1 text-sm text-slate-500">
			Emociones detectadas con MorphCast mientras el usuario usa el asistente, y ayudas proactivas
			de Claude.
		</p>
	</div>

	{#if data.error}
		<p class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
			{data.error}
		</p>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Sesiones recientes</p>
			<p class="mt-2 text-2xl font-semibold">{data.kpis.sesiones}</p>
		</div>
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Lecturas emocionales</p>
			<p class="mt-2 text-2xl font-semibold">{data.kpis.lecturas}</p>
		</div>
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Dudas detectadas</p>
			<p class="mt-2 text-2xl font-semibold">{data.kpis.dudasDetectadas}</p>
		</div>
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Ayudas proactivas</p>
			<p class="mt-2 text-2xl font-semibold">{data.kpis.intervenciones}</p>
		</div>
	</div>

	<div class="grid gap-4 lg:grid-cols-2">
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<h2 class="text-sm font-semibold text-slate-950">Emoción dominante por ruta</h2>
			{#if data.porRuta.length}
				<ul class="mt-4 space-y-3">
					{#each data.porRuta as item (item.ruta)}
						<li class="flex items-center justify-between gap-3 text-sm">
							<div>
								<p class="font-medium text-slate-800">{item.ruta}</p>
								<p class="text-xs text-slate-500">{item.total} lecturas</p>
							</div>
							<span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
								{EMOTION_LABELS[item.dominante] ?? item.dominante}
							</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-4 text-sm text-slate-500">
					Aún no hay lecturas. Abre el asistente con cámara.
				</p>
			{/if}
		</div>

		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<h2 class="text-sm font-semibold text-slate-950">Últimas intervenciones de Claude</h2>
			{#if data.intervenciones.length}
				<ul class="mt-4 space-y-3">
					{#each data.intervenciones as item (item.id)}
						<li class="rounded-md border border-slate-100 bg-slate-50 p-3">
							<p class="text-xs font-medium text-slate-500">
								{tipoLabel[item.tipo] ?? item.tipo} · {item.sesion.usuario.nombre}
							</p>
							<p class="mt-1 text-sm text-slate-800">{item.respuestaClaude}</p>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-4 text-sm text-slate-500">Todavía no hay intervenciones proactivas.</p>
			{/if}
		</div>
	</div>

	<div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
		<table class="min-w-full divide-y divide-slate-200 text-sm">
			<thead
				class="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase"
			>
				<tr>
					<th class="px-4 py-3">Usuario</th>
					<th class="px-4 py-3">Ruta de inicio</th>
					<th class="px-4 py-3">Inicio</th>
					<th class="px-4 py-3">Fin</th>
					<th class="px-4 py-3">Lecturas</th>
					<th class="px-4 py-3">Ayudas</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-100">
				{#each data.sesiones as sesion (sesion.id)}
					<tr>
						<td class="px-4 py-3 font-medium text-slate-800">{sesion.usuario.nombre}</td>
						<td class="px-4 py-3 text-slate-600">{sesion.rutaInicio}</td>
						<td class="px-4 py-3 text-slate-600">{formatDate(sesion.inicioEn)}</td>
						<td class="px-4 py-3 text-slate-600">{formatDate(sesion.finEn)}</td>
						<td class="px-4 py-3 text-slate-600">{sesion._count.lecturas}</td>
						<td class="px-4 py-3 text-slate-600">{sesion._count.intervenciones}</td>
					</tr>
				{:else}
					<tr>
						<td class="px-4 py-6 text-slate-500" colspan="6"
							>No hay sesiones registradas todavía.</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
