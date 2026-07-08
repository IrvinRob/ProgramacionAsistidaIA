<script>
	import { Doughnut } from 'svelte-chartjs';
	import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';

	ChartJS.register(ArcElement, Tooltip, Legend);

	let { data } = $props();

	const formatMXN = (value) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value ?? 0);

	const estadoData = $derived({
		labels: data.cotsPorEstado.map((item) => item.estado),
		datasets: [
			{
				data: data.cotsPorEstado.map((item) => item._count.estado),
				backgroundColor: ['#64748b', '#f59e0b', '#16a34a', '#dc2626', '#7c3aed', '#0f766e']
			}
		]
	});
</script>

<svelte:head>
	<title>Dashboard | GestorPyme</title>
</svelte:head>

<section class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-normal text-slate-950">Dashboard</h1>
		<p class="mt-1 text-sm text-slate-500">Resumen financiero del despacho.</p>
	</div>

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
			<div class="mt-4 min-h-72">
				<Doughnut data={estadoData} />
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
