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
		{#each data.apps as app (app.id)}
			<article class="app-card" data-app={app.id}>
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
	:global(body) {
		font-family:
			"acumin-pro",
			"Pretendard Variable",
			sans-serif;
		background: oklch(0.07 0.01 280);
		color: oklch(0.93 0.01 300);
		min-height: 100vh;
		margin: 0;
		line-height: 1.6;
	}

	.portal {
		max-width: 1120px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem;
	}

	.portal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid oklch(0.22 0.01 280);
	}

	.portal-title {
		font-family: "freight-display-pro", "Pretendard Variable", serif;
		font-size: clamp(1.5rem, 1.25rem + 1.25vw, 2.5rem);
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.user-area {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.avatar-badge {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 9999px;
		background: oklch(0.19 0.015 280);
		border: 1px solid oklch(0.22 0.01 280);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: "aktiv-grotesk", "Pretendard Variable", sans-serif;
		font-size: 0.875rem;
		font-weight: 700;
	}

	.user-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.user-name {
		font-family: "aktiv-grotesk", "Pretendard Variable", sans-serif;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.user-email {
		font-family: "source-code-pro", "SF Mono", monospace;
		font-size: 0.75rem;
		color: oklch(0.45 0.02 280);
	}

	.btn-logout {
		margin-left: 1rem;
		padding: 0.5rem 1rem;
		border: 1px solid oklch(0.22 0.01 280);
		border-radius: 6px;
		background: transparent;
		color: oklch(0.68 0.02 290);
		font-family: "aktiv-grotesk", "Pretendard Variable", sans-serif;
		font-size: 0.75rem;
		text-decoration: none;
		transition: border-color 0.15s;
	}

	.btn-logout:hover {
		border-color: oklch(0.3 0.01 280);
		color: oklch(0.93 0.01 300);
	}

	.app-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 4rem;
	}

	.app-card {
		position: relative;
		background: oklch(0.12 0.01 280);
		border: 1px solid oklch(0.22 0.01 280);
		border-radius: 16px;
		overflow: hidden;
		transition:
			transform 0.15s,
			border-color 0.15s,
			box-shadow 0.3s;
	}

	.app-card:hover {
		transform: translateY(-2px);
		border-color: oklch(0.3 0.01 280);
		box-shadow: 0 6px 20px oklch(0 0 0 / 0.3);
	}

	.card-accent {
		height: 3px;
	}

	.app-card[data-app="munseo"] .card-accent {
		background: linear-gradient(90deg, oklch(0.75 0.12 18), transparent 80%);
	}

	.app-card[data-app="umbracast"] .card-accent {
		background: linear-gradient(90deg, oklch(0.85 0.12 85), transparent 80%);
	}

	.app-card[data-app="sincheong"] .card-accent {
		background: linear-gradient(90deg, oklch(0.72 0.14 300), transparent 80%);
	}

	.app-card[data-app="sincheong"] {
		border-color: oklch(0.3 0.01 280);
	}

	.card-content {
		padding: 1.5rem;
	}

	.card-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.card-name {
		font-family: "freight-display-pro", "Pretendard Variable", serif;
		font-size: clamp(1.25rem, 1.1rem + 0.75vw, 1.75rem);
		font-weight: 700;
	}

	.card-status {
		font-family: "aktiv-grotesk", "Pretendard Variable", sans-serif;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
	}

	.status-active {
		background: oklch(0.82 0.1 170 / 0.12);
		color: oklch(0.82 0.1 170);
	}

	.status-landing {
		background: oklch(0.85 0.12 85 / 0.12);
		color: oklch(0.85 0.12 85);
	}

	.card-desc {
		font-family: "aktiv-grotesk", "Pretendard Variable", sans-serif;
		font-size: 1rem;
		color: oklch(0.68 0.02 290);
		margin-bottom: 0.5rem;
	}

	.card-tagline {
		font-family: "acumin-pro", "Pretendard Variable", sans-serif;
		font-size: 0.875rem;
		color: oklch(0.45 0.02 280);
		line-height: 1.5;
		margin-bottom: 1.5rem;
	}

	.card-foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.card-domain {
		font-family: "source-code-pro", "SF Mono", monospace;
		font-size: 0.75rem;
		color: oklch(0.45 0.02 280);
	}

	.card-action {
		font-family: "aktiv-grotesk", "Pretendard Variable", sans-serif;
		font-size: 0.875rem;
		font-weight: 600;
		color: oklch(0.93 0.01 300);
		text-decoration: none;
		transition: color 0.15s;
	}

	.card-action:hover {
		color: oklch(0.75 0.12 18);
	}

	.card-action--muted {
		color: oklch(0.45 0.02 280);
		cursor: default;
	}

	.feed-area {
		padding-top: 2.5rem;
		border-top: 1px solid oklch(0.22 0.01 280);
	}

	.feed-title {
		font-family: "freight-display-pro", "Pretendard Variable", serif;
		font-size: clamp(1.25rem, 1.1rem + 0.75vw, 1.75rem);
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.feed-placeholder {
		font-family: "acumin-pro", "Pretendard Variable", sans-serif;
		font-size: 0.875rem;
		color: oklch(0.45 0.02 280);
		padding: 2.5rem 0;
		text-align: center;
		border: 1px dashed oklch(0.22 0.01 280);
		border-radius: 16px;
	}

	@media (max-width: 768px) {
		.portal-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
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
