<script>
	import { Bar, Doughnut } from 'svelte-chartjs';
	import {
		BarElement,
		CategoryScale,
		Chart as ChartJS,
		Legend,
		LinearScale,
		ArcElement,
		Tooltip
	} from 'chart.js';

	let { data } = $props();

	ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

	const formatMXN = (value) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value ?? 0);

	const estadoLabels = $derived(data.cotsPorEstado.map((item) => item.estado));
	const estadoValues = $derived(data.cotsPorEstado.map((item) => item._count.estado));
	const ingresosLabels = $derived(data.ingresosPorMes.map((item) => item.label));
	const ingresosValues = $derived(data.ingresosPorMes.map((item) => item.total));
	const estadoColors = {
		RECHAZADA: '#dc2626',
		PAGADA: '#9333ea',
		FACTURADA: '#2563eb',
		APROBADA: '#16a34a',
		ENVIADA: '#fde047',
		BORRADOR: '#f97316'
	};

	const ingresosChart = $derived({
		labels: ingresosLabels,
		datasets: [
			{
				label: 'Cobrado',
				data: ingresosValues,
				backgroundColor: '#0f172a',
				borderRadius: 6
			}
		]
	});
	const estadosChart = $derived({
		labels: estadoLabels,
		datasets: [
			{
				data: estadoValues,
				backgroundColor: estadoLabels.map((estado) => estadoColors[estado] ?? '#475569'),
				borderWidth: 0
			}
		]
	});
	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			tooltip: {
				callbacks: {
					label: (context) => formatMXN(context.parsed.y ?? context.parsed)
				}
			}
		}
	};
	const doughnutOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { position: 'bottom' }
		}
	};
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
			<p class="text-sm text-slate-500">Ventas del mes</p>
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

	<div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<h2 class="text-base font-semibold">Cobrado por mes</h2>
			<div class="mt-4 h-72">
				{#if data.ingresosPorMes.some((item) => item.total > 0)}
					<Bar data={ingresosChart} options={chartOptions} />
				{:else}
					<p
						class="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500"
					>
						Aun no hay pagos para graficar.
					</p>
				{/if}
			</div>
		</div>

		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<h2 class="text-base font-semibold">Cotizaciones por estado</h2>
			<div class="mt-4 h-72">
				{#if data.cotsPorEstado.length}
					<Doughnut data={estadosChart} options={doughnutOptions} />
				{:else}
					<p
						class="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500"
					>
						Aun no hay cotizaciones para graficar.
					</p>
				{/if}
			</div>
		</div>
	</div>

	<div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
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

		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<h2 class="text-base font-semibold">Clientes con mayor pendiente</h2>
			<div class="mt-4 space-y-3">
				{#each data.topClientesPendiente as cliente (cliente.id)}
					<div class="rounded-md border border-slate-200 p-4">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="font-medium text-slate-950">{cliente.nombre}</p>
								<p class="text-sm text-slate-500">{cliente.empresa || 'Sin empresa'}</p>
							</div>
							<p class="text-right font-semibold">{formatMXN(cliente.pendiente)}</p>
						</div>
					</div>
				{:else}
					<p
						class="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500"
					>
						No hay saldos pendientes.
					</p>
				{/each}
			</div>
		</div>
	</div>
</section>
