<script lang="ts">
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Studio Lab — Modfolio Studio</title>
	<meta
		name="description"
		content="Studio 포탈 — Munseo, Umbracast, Sincheong"
	/>
</svelte:head>

<main class="portal">
	<header class="portal-header">
		<h1 class="portal-title">Studio Lab</h1>
		<div class="user-area">
			{#if data.user}
				<div class="avatar-badge">
					{(data.user.name ?? data.user.email)[0].toUpperCase()}
				</div>
				<div class="user-meta">
					<span class="user-name">{data.user.name ?? "사용자"}</span>
					<span class="user-email">{data.user.email}</span>
				</div>
				<a href="/auth/logout" class="btn-logout">로그아웃</a>
			{/if}
		</div>
	</header>

	<section class="app-grid">
		{#each data.apps as app, i (app.id)}
			<article
				class="app-card"
				data-app={app.id}
				style="animation-delay: {i * 80}ms"
			>
				<div class="card-accent"></div>
				<div class="card-content">
					<div class="card-head">
						<h2 class="card-name">{app.name}</h2>
						<span
							class="card-status"
							class:status-active={app.status === "active"}
							class:status-landing={app.status === "landing"}
						>
							{app.status === "active" ? "Active" : "준비 중"}
						</span>
					</div>
					<p class="card-desc">{app.desc}</p>
					<p class="card-tagline">{app.tagline}</p>
					<div class="card-foot">
						<span class="card-domain">{app.domain}</span>
						{#if app.status === "active"}
							<a
								href={app.url}
								class="card-action"
								target="_blank"
								rel="noopener"
							>
								열기 &rarr;
							</a>
						{:else}
							<span class="card-action card-action--muted">준비 중</span>
						{/if}
					</div>
				</div>
			</article>
		{/each}
	</section>

	<section class="feed-area">
		<h2 class="feed-title">새로운 소식</h2>
		<p class="feed-placeholder">
			Studio 앱들의 최신 소식이 여기에 표시됩니다.
		</p>
	</section>
</main>

<style>
	/* ── Portal Layout ── */

	.portal {
		max-width: 1120px;
		margin: 0 auto;
		padding: var(--space-10) var(--space-6);
	}

	.portal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-10);
		padding-bottom: var(--space-6);
		border-bottom: 1px solid var(--color-border-default);
	}

	.portal-title {
		font-family: var(--font-display);
		font-size: var(--font-size-h2);
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	/* ── User Area ── */

	.user-area {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.avatar-badge {
		width: var(--space-10);
		height: var(--space-10);
		border-radius: var(--radius-full);
		background: var(--color-surface-emphasis);
		border: 1px solid var(--color-border-default);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-ui);
		font-size: var(--font-size-small);
		font-weight: 700;
		color: var(--color-text-1);
	}

	.user-meta {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.user-name {
		font-family: var(--font-ui);
		font-size: var(--font-size-small);
		font-weight: 500;
	}

	.user-email {
		font-family: var(--font-mono);
		font-size: var(--font-size-caption);
		color: var(--color-text-3);
	}

	.btn-logout {
		margin-left: var(--space-4);
		padding: var(--space-2) var(--space-4);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-2);
		font-family: var(--font-ui);
		font-size: var(--font-size-caption);
		text-decoration: none;
		transition: border-color var(--dur-fast) var(--ease-smooth);
	}

	.btn-logout:hover {
		border-color: var(--color-border-hover);
		color: var(--color-text-1);
	}

	/* ── App Card Grid ── */

	.app-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-6);
		margin-bottom: var(--space-16);
	}

	/* Sequential entrance — 60-120ms stagger */
	@keyframes cardIn {
		from {
			opacity: 0;
			transform: translateY(var(--space-4));
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.app-card {
		position: relative;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-lg);
		overflow: hidden;
		animation: cardIn var(--dur-slow) var(--ease-smooth) both;
		transition:
			transform var(--dur-fast) var(--ease-smooth),
			border-color var(--dur-fast) var(--ease-smooth),
			box-shadow var(--dur-base) var(--ease-smooth);
	}

	.app-card:hover {
		transform: translateY(-2px);
		border-color: var(--color-border-hover);
		box-shadow: var(--shadow-md);
	}

	/* Per-app accent top border */
	.card-accent {
		height: 3px;
	}

	.app-card[data-app="munseo"] .card-accent {
		background: linear-gradient(
			90deg,
			var(--color-app-munseo),
			transparent 80%
		);
	}

	.app-card[data-app="umbracast"] .card-accent {
		background: linear-gradient(
			90deg,
			var(--color-app-umbracast),
			transparent 80%
		);
	}

	.app-card[data-app="sincheong"] .card-accent {
		background: linear-gradient(
			90deg,
			var(--color-app-sincheong),
			transparent 80%
		);
	}

	/* Active card emphasis */
	.app-card[data-app="sincheong"] {
		border-color: var(--color-border-hover);
	}

	.card-content {
		padding: var(--space-6);
	}

	.card-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-3);
	}

	.card-name {
		font-family: var(--font-display);
		font-size: var(--font-size-h3);
		font-weight: 700;
	}

	.card-status {
		font-family: var(--font-ui);
		font-size: var(--font-size-caption);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-full);
	}

	.status-active {
		background: color-mix(in oklch, var(--color-status-active) 12%, transparent);
		color: var(--color-status-active);
	}

	.status-landing {
		background: color-mix(
			in oklch,
			var(--color-status-pending) 12%,
			transparent
		);
		color: var(--color-status-pending);
	}

	.card-desc {
		font-family: var(--font-ui);
		font-size: var(--font-size-body);
		color: var(--color-text-2);
		margin-bottom: var(--space-2);
	}

	.card-tagline {
		font-family: var(--font-body);
		font-size: var(--font-size-small);
		color: var(--color-text-3);
		line-height: 1.5;
		margin-bottom: var(--space-6);
		max-width: 45ch;
	}

	.card-foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.card-domain {
		font-family: var(--font-mono);
		font-size: var(--font-size-caption);
		color: var(--color-text-3);
	}

	.card-action {
		font-family: var(--font-ui);
		font-size: var(--font-size-small);
		font-weight: 600;
		color: var(--color-text-1);
		text-decoration: none;
		transition: color var(--dur-fast) var(--ease-smooth);
	}

	.card-action:hover {
		color: var(--color-accent-primary);
	}

	.card-action--muted {
		color: var(--color-text-3);
		cursor: default;
	}

	/* ── Feed Area ── */

	.feed-area {
		padding-top: var(--space-10);
		border-top: 1px solid var(--color-border-default);
	}

	.feed-title {
		font-family: var(--font-display);
		font-size: var(--font-size-h3);
		font-weight: 700;
		margin-bottom: var(--space-4);
	}

	.feed-placeholder {
		font-family: var(--font-body);
		font-size: var(--font-size-small);
		color: var(--color-text-3);
		padding: var(--space-10) 0;
		text-align: center;
		border: 1px dashed var(--color-border-default);
		border-radius: var(--radius-lg);
	}

	/* ── Responsive ── */

	@media (max-width: 768px) {
		.portal-header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-4);
		}

		.user-area {
			width: 100%;
			flex-wrap: wrap;
		}

		.app-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
