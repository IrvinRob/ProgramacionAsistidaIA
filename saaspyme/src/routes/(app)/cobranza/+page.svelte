<script>
	let { data, form } = $props();

	const today = new Date().toISOString().slice(0, 10);
	const formatMXN = (value) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value ?? 0);
	const formatDate = (value) =>
		new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: 'short', day: '2-digit' }).format(
			new Date(value)
		);

	function agingClass(dias) {
		if (dias > 30) return 'bg-red-50 text-red-700 border-red-200';
		if (dias >= 15) return 'bg-amber-50 text-amber-700 border-amber-200';
		return 'bg-emerald-50 text-emerald-700 border-emerald-200';
	}
</script>

<svelte:head>
	<title>Cobranza | GestorPyme</title>
</svelte:head>

<section class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-normal text-slate-950">Cobranza</h1>
		<p class="mt-1 text-sm text-slate-500">Saldos pendientes, antiguedad y recordatorios.</p>
	</div>

	{#if form?.errors?.general}
		<p class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{form.errors.general}
		</p>
	{/if}

	<div class="grid gap-4 sm:grid-cols-3">
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Cartera pendiente</p>
			<p class="mt-2 text-2xl font-semibold">{formatMXN(data.totalPendiente)}</p>
		</div>
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Mas de 30 dias</p>
			<p class="mt-2 text-2xl font-semibold">{formatMXN(data.totalVencido30)}</p>
		</div>
		<div class="rounded-lg border border-slate-200 bg-white p-5">
			<p class="text-sm text-slate-500">Cotizaciones pendientes</p>
			<p class="mt-2 text-2xl font-semibold">{data.pendientes.length}</p>
		</div>
	</div>

	<div class="space-y-4">
		{#each data.pendientes as cotizacion (cotizacion.id)}
			<div class="rounded-lg border border-slate-200 bg-white p-5">
				<div class="grid gap-4 lg:grid-cols-[1fr_360px]">
					<div>
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p class="font-semibold text-slate-950">{cotizacion.numero}</p>
								<p class="text-sm text-slate-500">
									{cotizacion.cliente.nombre} · {cotizacion.cliente.empresa ||
										cotizacion.cliente.correo}
								</p>
							</div>
							<span
								class={`rounded-full border px-2 py-1 text-xs font-medium ${agingClass(cotizacion.dias)}`}
							>
								{cotizacion.dias} dias
							</span>
						</div>

						<div class="mt-4 grid gap-3 text-sm sm:grid-cols-4">
							<div>
								<p class="text-slate-500">Fecha</p>
								<p class="font-medium">{formatDate(cotizacion.fecha)}</p>
							</div>
							<div>
								<p class="text-slate-500">Total</p>
								<p class="font-medium">{formatMXN(cotizacion.total)}</p>
							</div>
							<div>
								<p class="text-slate-500">Pagado</p>
								<p class="font-medium">{formatMXN(cotizacion.pagado)}</p>
							</div>
							<div>
								<p class="text-slate-500">Pendiente</p>
								<p class="font-semibold">{formatMXN(cotizacion.pendiente)}</p>
							</div>
						</div>

						<div class="mt-5">
							<p class="text-sm font-semibold text-slate-950">Historial de pagos</p>
							{#if cotizacion.pagos.length}
								<div class="mt-2 overflow-hidden rounded-md border border-slate-200">
									<table class="min-w-full divide-y divide-slate-200 text-sm">
										<thead class="bg-slate-50 text-left text-xs font-medium text-slate-500">
											<tr>
												<th class="px-3 py-2">Fecha</th>
												<th class="px-3 py-2 text-right">Cantidad</th>
												<th class="px-3 py-2">Modo de pago</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-slate-200">
											{#each cotizacion.pagos as pago (pago.id)}
												<tr>
													<td class="px-3 py-2">{formatDate(pago.fecha)}</td>
													<td class="px-3 py-2 text-right font-medium">{formatMXN(pago.monto)}</td>
													<td class="px-3 py-2">
														{pago.metodo}
														{#if pago.referencia}
															<span class="text-slate-500"> · {pago.referencia}</span>
														{/if}
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{:else}
								<p class="mt-2 text-sm text-slate-500">Sin pagos registrados.</p>
							{/if}
						</div>
					</div>

					<div class="space-y-3">
						<form
							method="POST"
							action="?/pagar"
							class="grid gap-2 rounded-md border border-slate-200 p-3"
						>
							<input type="hidden" name="cotizacionId" value={cotizacion.id} />
							<div class="grid gap-2 sm:grid-cols-2">
								<input
									name="monto"
									type="number"
									step="0.01"
									min="0.01"
									max={cotizacion.pendiente}
									placeholder="Monto"
									class="rounded-md border border-slate-300 px-3 py-2 text-sm"
									required
								/>
								<input
									name="fecha"
									type="date"
									value={today}
									class="rounded-md border border-slate-300 px-3 py-2 text-sm"
									required
								/>
								<select name="metodo" class="rounded-md border border-slate-300 px-3 py-2 text-sm">
									<option value="TRANSFERENCIA">Transferencia</option>
									<option value="EFECTIVO">Efectivo</option>
									<option value="CHEQUE">Cheque</option>
									<option value="TARJETA">Tarjeta</option>
								</select>
								<input
									name="referencia"
									placeholder="Referencia"
									class="rounded-md border border-slate-300 px-3 py-2 text-sm"
								/>
							</div>
							<button class="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
								Registrar pago
							</button>
						</form>

						<form method="POST" action="?/recordatorio">
							<input type="hidden" name="cotizacionId" value={cotizacion.id} />
							<button
								class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium"
							>
								Enviar recordatorio
							</button>
							{#if form?.recordatorio?.cotizacionId === cotizacion.id && form.recordatorio.status === 'sent'}
								<p
									class="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
								>
									Recordatorio enviado
								</p>
							{:else if form?.recordatorio?.cotizacionId === cotizacion.id && form.recordatorio.status === 'duplicate'}
								<p
									class="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700"
								>
									Ya se envió recordatorio hoy
								</p>
							{/if}
						</form>
					</div>
				</div>
			</div>
		{:else}
			<div class="rounded-lg border border-slate-200 bg-white p-8 text-center">
				<h2 class="text-base font-semibold text-slate-950">Sin cartera pendiente</h2>
				<p class="mt-2 text-sm text-slate-500">
					No hay cotizaciones aprobadas o facturadas con saldo pendiente.
				</p>
			</div>
		{/each}
	</div>
</section>
