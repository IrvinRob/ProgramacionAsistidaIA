<script>
	import { resolve } from '$app/paths';

	let { data } = $props();

	const formatMXN = (value) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value ?? 0);
	const formatDate = (value) =>
		new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: 'short', day: '2-digit' }).format(
			new Date(value)
		);

	const columns = [
		{ key: 'numero', label: 'Numero', class: 'px-4 py-3 text-left font-medium' },
		{ key: 'cliente', label: 'Cliente', class: 'px-4 py-3 text-left font-medium' },
		{ key: 'estado', label: 'Estado', class: 'px-4 py-3 text-left font-medium' },
		{ key: 'fecha', label: 'Fecha', class: 'px-4 py-3 text-left font-medium' },
		{ key: 'total', label: 'Total', class: 'px-4 py-3 text-right font-medium' },
		{ key: 'pendiente', label: 'Pendiente', class: 'px-4 py-3 text-right font-medium' }
	];

	function statusClass(estado) {
		const classes = {
			RECHAZADA: 'bg-red-600 text-white',
			PAGADA: 'bg-purple-600 text-white',
			FACTURADA: 'bg-blue-600 text-white',
			APROBADA: 'bg-green-600 text-white',
			ENVIADA: 'bg-yellow-300 text-slate-950',
			BORRADOR: 'bg-orange-500 text-white'
		};

		return classes[estado] ?? 'bg-slate-600 text-white';
	}

	function sortHref(key) {
		const dir = data.sort === key && data.dir === 'asc' ? 'desc' : 'asc';
		const params = [
			data.q ? `q=${encodeURIComponent(data.q)}` : '',
			data.estado ? `estado=${encodeURIComponent(data.estado)}` : '',
			`sort=${encodeURIComponent(key)}`,
			`dir=${encodeURIComponent(dir)}`
		].filter(Boolean);

		return `/cotizaciones?${params.join('&')}`;
	}

	function sortMarker(key) {
		if (data.sort !== key) return '';
		return data.dir === 'asc' ? ' ↑' : ' ↓';
	}
</script>

<svelte:head>
	<title>Cotizaciones | GestorPyme</title>
</svelte:head>

{#snippet cotizacionesTable(cotizaciones, emptyText)}
	<div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
		<table class="w-full text-left text-sm">
			<thead class="bg-slate-50 text-slate-500">
				<tr>
					{#each columns as column (column.key)}
						<th class={column.class}>
							<a
								href={resolve(sortHref(column.key))}
								class={[
									'inline-flex items-center gap-1 hover:text-slate-950',
									column.key === 'total' || column.key === 'pendiente' ? 'justify-end' : ''
								]}
							>
								{column.label}{sortMarker(column.key)}
							</a>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-200">
				{#each cotizaciones as cotizacion (cotizacion.id)}
					<tr>
						<td class="px-4 py-3 font-medium text-slate-950">{cotizacion.numero}</td>
						<td class="px-4 py-3">
							<p>{cotizacion.cliente.nombre}</p>
							<p class="text-xs text-slate-500">
								{cotizacion.cliente.empresa || `${cotizacion.conceptos} conceptos`}
							</p>
						</td>
						<td class="px-4 py-3">
							<span
								class={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(cotizacion.estado)}`}
							>
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
							{emptyText}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/snippet}

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
		<input type="hidden" name="sort" value={data.sort} />
		<input type="hidden" name="dir" value={data.dir} />
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
		<button class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium">
			Filtrar
		</button>
	</form>

	<div class="space-y-3">
		<div>
			<h2 class="mb-3 text-base font-semibold text-slate-950">Cotizaciones activas</h2>
			{@render cotizacionesTable(
				data.cotizaciones,
				'No hay cotizaciones activas con esos filtros.'
			)}
		</div>

		<div>
			<h2 class="mb-3 text-base font-semibold text-slate-950">Cotizaciones rechazadas</h2>
			{@render cotizacionesTable(
				data.cotizacionesRechazadas,
				'No hay cotizaciones rechazadas con esos filtros.'
			)}
		</div>
	</div>
</section>
