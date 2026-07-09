<script>
	import { resolve } from '$app/paths';

	let { data } = $props();

	const formatMXN = (value) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value ?? 0);
	const formatDate = (value) =>
		value
			? new Intl.DateTimeFormat('es-MX', {
					year: 'numeric',
					month: 'short',
					day: '2-digit'
				}).format(new Date(value))
			: 'Sin fecha';

	const estadoClass = {
		RECHAZADA: 'bg-red-600 text-white',
		BORRADOR: 'bg-orange-500 text-white',
		ENVIADA: 'bg-yellow-300 text-slate-950',
		APROBADA: 'bg-green-600 text-white',
		FACTURADA: 'bg-blue-600 text-white',
		PAGADA: 'bg-purple-600 text-white'
	};
</script>

<svelte:head>
	<title>Historial de cliente | GestorPyme</title>
</svelte:head>

<section class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
		<div class="min-w-0">
			<a
				href={resolve('/clientes')}
				class="inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
			>
				Volver a clientes
			</a>
			<h1 class="mt-4 break-words text-2xl font-semibold tracking-normal text-slate-950">
				Historial de {data.cliente.nombre}
			</h1>
			<p class="mt-1 break-words text-sm text-slate-500">
				{data.cliente.empresa || data.cliente.correo}
			</p>
		</div>
		<span
			class={[
				'w-fit rounded-full px-2 py-1 text-xs font-medium',
				data.cliente.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
			]}
		>
			{data.cliente.activo ? 'Activo' : 'Inactivo'}
		</span>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Cotizaciones</p>
			<p class="mt-2 text-2xl font-semibold">{data.resumen.totalCotizaciones}</p>
		</div>
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Cotizado</p>
			<p class="mt-2 text-2xl font-semibold">{formatMXN(data.resumen.totalCotizado)}</p>
		</div>
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Pagado</p>
			<p class="mt-2 text-2xl font-semibold">{formatMXN(data.resumen.totalPagado)}</p>
		</div>
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Pendiente</p>
			<p class="mt-2 text-2xl font-semibold">{formatMXN(data.resumen.totalPendiente)}</p>
		</div>
	</div>

	<div class="rounded-lg border border-slate-200 bg-white p-5">
		<h2 class="text-base font-semibold text-slate-950">Datos del cliente</h2>
		<div class="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
			<div class="min-w-0">
				<p class="text-slate-500">Correo</p>
				<p class="break-words font-medium">{data.cliente.correo}</p>
			</div>
			<div>
				<p class="text-slate-500">Telefono</p>
				<p class="font-medium">{data.cliente.telefono || 'Sin telefono'}</p>
			</div>
			<div>
				<p class="text-slate-500">RFC</p>
				<p class="font-medium">{data.cliente.rfc || 'Sin RFC'}</p>
			</div>
			<div>
				<p class="text-slate-500">Pagos registrados</p>
				<p class="font-medium">{data.resumen.totalPagos}</p>
			</div>
		</div>
	</div>

	<div class="space-y-4">
		<h2 class="text-base font-semibold text-slate-950">Cotizaciones y pagos</h2>
		{#each data.cotizaciones as cotizacion (cotizacion.id)}
			<div class="rounded-lg border border-slate-200 bg-white p-5">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div class="min-w-0">
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="break-words font-semibold text-slate-950">{cotizacion.numero}</h3>
							<span
								class={[
									'rounded-full px-2 py-1 text-xs font-medium',
									estadoClass[cotizacion.estado] ?? 'bg-slate-100 text-slate-700'
								]}
							>
								{cotizacion.estado}
							</span>
						</div>
						<p class="mt-1 text-sm text-slate-500">
							Fecha: {formatDate(cotizacion.fecha)}
							{#if cotizacion.vencimiento}
								· Vence: {formatDate(cotizacion.vencimiento)}
							{/if}
						</p>
					</div>

					<div class="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[420px]">
						<div>
							<p class="text-slate-500">Total</p>
							<p class="font-semibold">{formatMXN(cotizacion.total)}</p>
						</div>
						<div>
							<p class="text-slate-500">Pagado</p>
							<p class="font-semibold">{formatMXN(cotizacion.pagado)}</p>
						</div>
						<div>
							<p class="text-slate-500">Pendiente</p>
							<p class="font-semibold">{formatMXN(cotizacion.pendiente)}</p>
						</div>
					</div>
				</div>

				<div class="mt-5 grid gap-4 xl:grid-cols-2">
					<div>
						<p class="text-sm font-semibold text-slate-950">Conceptos cotizados</p>
						<div class="mt-2 space-y-2">
							{#each cotizacion.conceptos as concepto (concepto.id)}
								<div class="rounded-md border border-slate-200 p-3 text-sm">
									<p class="break-words font-medium">{concepto.descripcion}</p>
									<div class="mt-2 grid gap-2 text-slate-500 sm:grid-cols-3">
										<p>Cantidad: <span class="text-slate-950">{concepto.cantidad}</span></p>
										<p>
											Precio: <span class="text-slate-950"
												>{formatMXN(concepto.precioUnitario)}</span
											>
										</p>
										<p>
											Subtotal: <span class="text-slate-950">{formatMXN(concepto.subtotal)}</span>
										</p>
									</div>
								</div>
							{:else}
								<p
									class="rounded-md border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500"
								>
									Sin conceptos registrados.
								</p>
							{/each}
						</div>
					</div>

					<div>
						<p class="text-sm font-semibold text-slate-950">Pagos a factura</p>
						<div class="mt-2 space-y-2">
							{#each cotizacion.pagos as pago (pago.id)}
								<div class="rounded-md border border-slate-200 p-3 text-sm">
									<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
										<div>
											<p class="font-medium">{formatDate(pago.fecha)}</p>
											<p class="text-slate-500">
												{pago.metodo}{pago.referencia ? ` · ${pago.referencia}` : ''}
											</p>
										</div>
										<p class="font-semibold">{formatMXN(pago.monto)}</p>
									</div>
								</div>
							{:else}
								<p
									class="rounded-md border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500"
								>
									Sin pagos registrados para esta cotizacion.
								</p>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="rounded-lg border border-slate-200 bg-white p-8 text-center">
				<h2 class="text-base font-semibold text-slate-950">Sin historial</h2>
				<p class="mt-2 text-sm text-slate-500">
					Este cliente todavia no tiene cotizaciones ni pagos registrados.
				</p>
			</div>
		{/each}
	</div>
</section>
