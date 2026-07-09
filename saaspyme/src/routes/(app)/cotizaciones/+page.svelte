<script>
	import { resolve } from '$app/paths';

	let { data } = $props();

	const formatMXN = (value) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value ?? 0);
	const formatDate = (value) =>
		new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: 'short', day: '2-digit' }).format(
			new Date(value)
		);
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

	<form
		method="GET"
		class="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_220px_auto]"
	>
		<input
			name="q"
			value={data.q}
			placeholder="Buscar por numero, cliente o empresa"
			class="rounded-md border border-slate-300 px-3 py-2 text-sm"
		/>
		<select name="estado" class="rounded-md border border-slate-300 px-3 py-2 text-sm">
			<option value="">Todos los estados</option>
			{#each data.estados as estado (estado)}
				<option value={estado} selected={data.estado === estado}>{estado}</option>
			{/each}
		</select>
		<button class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium">Filtrar</button
		>
	</form>

	<div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
		<table class="w-full text-left text-sm">
			<thead class="bg-slate-50 text-slate-500">
				<tr>
					<th class="px-4 py-3 font-medium">Numero</th>
					<th class="px-4 py-3 font-medium">Cliente</th>
					<th class="px-4 py-3 font-medium">Estado</th>
					<th class="px-4 py-3 font-medium">Fecha</th>
					<th class="px-4 py-3 text-right font-medium">Total</th>
					<th class="px-4 py-3 text-right font-medium">Pendiente</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-200">
				{#each data.cotizaciones as cotizacion (cotizacion.id)}
					<tr>
						<td class="px-4 py-3 font-medium text-slate-950">{cotizacion.numero}</td>
						<td class="px-4 py-3">
							<p>{cotizacion.cliente.nombre}</p>
							<p class="text-xs text-slate-500">
								{cotizacion.cliente.empresa || `${cotizacion.conceptos} conceptos`}
							</p>
						</td>
						<td class="px-4 py-3">
							<span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
								{cotizacion.estado}
							</span>
						</td>
						<td class="px-4 py-3">{formatDate(cotizacion.fecha)}</td>
						<td class="px-4 py-3 text-right">{formatMXN(cotizacion.total)}</td>
						<td class="px-4 py-3 text-right font-medium">{formatMXN(cotizacion.saldo)}</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="px-4 py-8 text-center text-slate-500">
							No hay cotizaciones con esos filtros.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
