<script>
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { visibleNavItems } from '$lib/shared/nav.js';

	let { data, children } = $props();
	let items = $derived(visibleNavItems(data.usuario));
	let primaryItems = $derived(items.filter((item) => item.href !== '/usuarios'));
	let secondaryItems = $derived(items.filter((item) => item.href === '/usuarios'));
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

	<div class="min-w-0 lg:pl-64">
		<div class="sticky top-0 z-20 max-w-full border-b border-slate-200 bg-white/90 backdrop-blur">
			<header class="flex h-16 min-w-0 items-center justify-between gap-3 px-4 sm:px-6">
				<div class="flex min-w-0 items-center gap-3">
					{#if data.usuario?.imageUrl}
						<img
							src={data.usuario.imageUrl}
							alt=""
							class="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
							referrerpolicy="no-referrer"
						/>
					{:else}
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-600"
						>
							{data.usuario?.nombre?.charAt(0) ?? 'U'}
						</div>
					{/if}
					<div class="min-w-0">
						<p class="text-sm text-slate-500">Sesion activa</p>
						<p class="max-w-[180px] truncate text-sm font-medium text-slate-950 sm:max-w-none">
							{data.usuario?.nombre}
						</p>
						<p class="text-xs text-slate-500">{data.usuario?.rol}</p>
					</div>
				</div>
				<a
					href={resolve('/logout')}
					class="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
				>
					Cerrar sesion
				</a>
			</header>

			<nav class="space-y-2 px-4 py-3 lg:hidden">
				<div class="grid grid-cols-4 gap-1">
					{#each primaryItems as item (item.href)}
						<a
							href={resolve(item.href)}
							class={[
								'rounded-md px-1.5 py-2 text-center text-xs font-medium whitespace-nowrap sm:text-sm',
								page.url.pathname.startsWith(item.href)
									? 'bg-slate-900 text-white'
									: 'text-slate-600 hover:bg-slate-100'
							]}
						>
							{item.label}
						</a>
					{/each}
				</div>
				{#if secondaryItems.length}
					<div class="flex flex-wrap gap-1">
						{#each secondaryItems as item (item.href)}
							<a
								href={resolve(item.href)}
								class={[
									'rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap sm:text-sm',
									page.url.pathname.startsWith(item.href)
										? 'bg-slate-900 text-white'
										: 'text-slate-600 hover:bg-slate-100'
								]}
							>
								{item.label}
							</a>
						{/each}
					</div>
				{/if}
			</nav>
		</div>

		<main class="min-w-0 px-4 py-6 sm:px-6 lg:px-8">{@render children()}</main>
	</div>
</div>
