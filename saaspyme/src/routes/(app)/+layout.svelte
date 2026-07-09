<script>
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { visibleNavItems } from '$lib/shared/nav.js';

	let { data, children } = $props();
	let items = $derived(visibleNavItems(data.usuario));
</script>

<div class="min-h-screen bg-slate-50 text-slate-950">
	<aside
		class="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-4 py-5 lg:block"
	>
		<div class="px-2 text-lg font-semibold tracking-tight">GestorPyme</div>
		<nav class="mt-8 space-y-1">
			{#each items as item (item.href)}
				<a
					href={resolve(item.href)}
					class={[
						'block rounded-md px-3 py-2 text-sm font-medium transition',
						page.url.pathname.startsWith(item.href)
							? 'bg-slate-900 text-white'
							: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
					]}
				>
					{item.label}
				</a>
			{/each}
		</nav>
	</aside>

	<div class="lg:pl-64">
		<header
			class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6"
		>
			<div>
				<p class="text-sm text-slate-500">Sesion activa</p>
				<p class="max-w-[220px] truncate text-sm font-medium text-slate-950 sm:max-w-none">
					{data.usuario?.nombre}
				</p>
				<p class="text-xs text-slate-500">{data.usuario?.rol}</p>
			</div>
			<a
				href={resolve('/logout')}
				class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
			>
				Cerrar sesion
			</a>
		</header>

		<nav class="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
			{#each items as item (item.href)}
				<a
					href={resolve(item.href)}
					class={[
						'rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap',
						page.url.pathname.startsWith(item.href)
							? 'bg-slate-900 text-white'
							: 'text-slate-600 hover:bg-slate-100'
					]}
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<main class="px-4 py-6 sm:px-6 lg:px-8">{@render children()}</main>
	</div>
</div>
