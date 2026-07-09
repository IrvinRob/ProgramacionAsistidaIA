<script>
	let { data } = $props();

	const formatMXN = (value) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value ?? 0);

	const totalEstados = $derived(
		data.cotsPorEstado.reduce((sum, item) => sum + item._count.estado, 0)
	);
</script>

<svelte:head>
	<title>Dashboard | GestorPyme</title>
</svelte:head>

<section class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-normal text-slate-950">Dashboard</h1>
		<p class="mt-1 text-sm text-slate-500">Resumen financiero del despacho.</p>
	</div>

	{#if data.error}
		<p class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
			{data.error}
		</p>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Facturado este mes</p>
			<p class="mt-2 text-2xl font-semibold">{formatMXN(data.kpis.totalFacturado)}</p>
		</div>
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Cobrado este mes</p>
			<p class="mt-2 text-2xl font-semibold">{formatMXN(data.kpis.totalCobrado)}</p>
		</div>
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Cartera pendiente</p>
			<p class="mt-2 text-2xl font-semibold">{formatMXN(data.kpis.carteraPendiente)}</p>
		</div>
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Cotizaciones activas</p>
			<p class="mt-2 text-2xl font-semibold">{data.kpis.cotsActivas}</p>
		</div>
	</div>

	<div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<h2 class="text-base font-semibold">Cotizaciones por estado</h2>
			<div class="mt-4 space-y-3">
				{#each data.cotsPorEstado as item (item.estado)}
					<div>
						<div class="flex items-center justify-between text-sm">
							<span class="font-medium text-slate-700">{item.estado}</span>
							<span class="text-slate-500">{item._count.estado}</span>
						</div>
						<div class="mt-2 h-2 rounded-full bg-slate-100">
							<div
								class="h-2 rounded-full bg-slate-900"
								style={`width: ${totalEstados ? (item._count.estado / totalEstados) * 100 : 0}%`}
							></div>
						</div>
					</div>
				{:else}
					<p class="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
						Aun no hay cotizaciones para graficar.
					</p>
				{/each}
			</div>
		</div>

		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<h2 class="text-base font-semibold">Ultimas cotizaciones</h2>
			<div class="mt-4 overflow-hidden rounded-md border border-slate-200">
				<table class="w-full text-left text-sm">
					<thead class="bg-slate-50 text-slate-500">
						<tr>
							<th class="px-4 py-3 font-medium">Numero</th>
							<th class="px-4 py-3 font-medium">Cliente</th>
							<th class="px-4 py-3 font-medium">Estado</th>
							<th class="px-4 py-3 text-right font-medium">Total</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-200">
						{#each data.ultimasCots as cotizacion (cotizacion.id)}
							<tr>
								<td class="px-4 py-3 font-medium">{cotizacion.numero}</td>
								<td class="px-4 py-3">{cotizacion.cliente.nombre}</td>
								<td class="px-4 py-3">{cotizacion.estado}</td>
								<td class="px-4 py-3 text-right">{formatMXN(Number(cotizacion.total))}</td>
							</tr>
						{:else}
							<tr>
								<td colspan="4" class="px-4 py-8 text-center text-slate-500">
									Aun no hay cotizaciones.
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</section>
