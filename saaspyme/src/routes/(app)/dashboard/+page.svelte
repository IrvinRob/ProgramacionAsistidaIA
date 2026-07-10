<script>
	import { resolve } from '$app/paths';
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

	const estadosActivos = new Set(['ENVIADA', 'APROBADA', 'FACTURADA']);
	const activeRingPlugin = {
		id: 'activeRing',
		afterDatasetDraw(chart, args) {
			if (args.index !== 0) return;

			const meta = chart.getDatasetMeta(0);
			const labels = chart.data.labels ?? [];
			const ctx = chart.ctx;

			ctx.save();
			ctx.lineWidth = 10;
			ctx.lineCap = 'butt';

			meta.data.forEach((arc, index) => {
				const estado = labels[index];
				if (!estadosActivos.has(estado)) return;

				const { x, y, startAngle, endAngle, outerRadius } = arc.getProps(
					['x', 'y', 'startAngle', 'endAngle', 'outerRadius'],
					true
				);

				ctx.beginPath();
				ctx.strokeStyle = estadoColors[estado] ?? '#0f172a';
				ctx.arc(x, y, outerRadius + 14, startAngle, endAngle);
				ctx.stroke();
			});

			ctx.restore();
		}
	};

	ChartJS.register(
		CategoryScale,
		LinearScale,
		BarElement,
		ArcElement,
		Tooltip,
		Legend,
		activeRingPlugin
	);

	const formatMXN = (value) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value ?? 0);

	const estadoOrder = ['RECHAZADA', 'BORRADOR', 'ENVIADA', 'APROBADA', 'FACTURADA', 'PAGADA'];
	const estadosOrdenados = $derived(
		estadoOrder
			.map((estado) => data.cotsPorEstado.find((item) => item.estado === estado))
			.filter(Boolean)
	);
	const estadoLabels = $derived(estadosOrdenados.map((item) => item.estado));
	const estadoValues = $derived(estadosOrdenados.map((item) => item._count.estado));
	const cotizacionesActivas = $derived(
		estadosOrdenados.reduce((sum, item) => {
			return estadosActivos.has(item.estado) ? sum + item._count.estado : sum;
		}, 0)
	);
	const ingresosLabels = $derived(data.ingresosPorMes.map((item) => item.label));
	const ventasValues = $derived(data.ingresosPorMes.map((item) => item.ventas));
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
				label: 'Ventas del mes',
				data: ventasValues,
				backgroundColor: '#16a34a',
				borderRadius: 6
			},
			{
				label: 'Cobrado por mes',
				data: ingresosValues,
				backgroundColor: '#9333ea',
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
			legend: { display: true, position: 'top' },
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
		cutout: '42%',
		layout: { padding: 18 },
		plugins: {
			legend: { display: false }
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
			<p class="mt-2 text-2xl font-semibold">{formatMXN(data.kpis.totalVentas)}</p>
		</div>
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Facturado en el mes</p>
			<p class="mt-2 text-2xl font-semibold">{formatMXN(data.kpis.totalFacturadoMes)}</p>
		</div>
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Cobrado este mes</p>
			<p class="mt-2 text-2xl font-semibold">{formatMXN(data.kpis.totalCobrado)}</p>
		</div>
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Cartera pendiente</p>
			<p class="mt-2 text-2xl font-semibold">{formatMXN(data.kpis.carteraPendiente)}</p>
		</div>
	</div>

	<div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<h2 class="text-base font-semibold">Ventas del mes / Cobrado por mes</h2>
			<div class="mt-4 h-72">
				{#if data.ingresosPorMes.some((item) => item.total > 0 || item.ventas > 0)}
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
			<div class="mt-4 h-64">
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
			{#if data.cotsPorEstado.length}
				<div class="mt-4 flex flex-col items-center gap-3">
					<div class="flex items-center gap-3 text-center text-slate-900">
						<span
							class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white"
						>
							{cotizacionesActivas}
						</span>
						<span
							class="text-xs font-semibold uppercase leading-tight tracking-wide text-slate-700"
						>
							Cotizaciones<br />activas
						</span>
					</div>
					<div class="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-600">
						{#each estadosOrdenados as item (item.estado)}
							<div class="flex items-center gap-2">
								<span
									class="h-3 w-8 rounded-sm"
									style={`background-color: ${estadoColors[item.estado] ?? '#475569'}`}
								></span>
								<span>{item.estado}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<h2 class="text-base font-semibold">Ultimas cotizaciones</h2>
			<div class="mt-4 space-y-3 md:hidden">
				{#each data.ultimasCots as cotizacion (cotizacion.id)}
					<div class="rounded-md border border-slate-200 p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="break-words font-semibold text-slate-950">{cotizacion.numero}</p>
								<p class="mt-1 break-words text-sm text-slate-600">{cotizacion.cliente.nombre}</p>
							</div>
							<p class="shrink-0 text-right text-sm font-semibold">
								{formatMXN(Number(cotizacion.total))}
							</p>
						</div>
						<div class="mt-3 flex items-center justify-between gap-3">
							<p
								class="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
							>
								{cotizacion.estado}
							</p>
							<a
								href={resolve(`/cotizaciones/${cotizacion.id}/pdf`)}
								class="inline-flex rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
								aria-label={`Descargar PDF de ${cotizacion.numero}`}
							>
								PDF
							</a>
						</div>
					</div>
				{:else}
					<p
						class="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500"
					>
						Aun no hay cotizaciones.
					</p>
				{/each}
			</div>
			<div class="mt-4 hidden overflow-hidden rounded-md border border-slate-200 md:block">
				<table class="w-full text-left text-sm">
					<thead class="bg-slate-50 text-slate-500">
						<tr>
							<th class="px-4 py-3 font-medium">Numero</th>
							<th class="px-4 py-3 font-medium">Cliente</th>
							<th class="px-4 py-3 font-medium">Estado</th>
							<th class="px-4 py-3 text-right font-medium">Total</th>
							<th class="px-4 py-3 text-right font-medium">PDF</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-200">
						{#each data.ultimasCots as cotizacion (cotizacion.id)}
							<tr>
								<td class="px-4 py-3 font-medium">{cotizacion.numero}</td>
								<td class="px-4 py-3">{cotizacion.cliente.nombre}</td>
								<td class="px-4 py-3">{cotizacion.estado}</td>
								<td class="px-4 py-3 text-right">{formatMXN(Number(cotizacion.total))}</td>
								<td class="px-4 py-3 text-right">
									<a
										href={resolve(`/cotizaciones/${cotizacion.id}/pdf`)}
										class="inline-flex rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
										aria-label={`Descargar PDF de ${cotizacion.numero}`}
									>
										PDF
									</a>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="5" class="px-4 py-8 text-center text-slate-500">
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
						<div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
							<div class="min-w-0">
								<p class="break-words font-medium text-slate-950">{cliente.nombre}</p>
								<p class="text-sm text-slate-500">{cliente.empresa || 'Sin empresa'}</p>
							</div>
							<p class="shrink-0 font-semibold sm:text-right">{formatMXN(cliente.pendiente)}</p>
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
