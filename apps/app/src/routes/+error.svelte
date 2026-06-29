<script lang="ts">
import { page } from "$app/state";

// Branch copy by status family — 404 (missing) vs everything else (failure).
const isNotFound = $derived(page.status === 404);

const heading = $derived(
	isNotFound ? "페이지를 찾을 수 없습니다" : "문제가 발생했습니다",
);

const detail = $derived(
	isNotFound
		? "요청하신 페이지가 없거나 이동되었습니다."
		: (page.error?.message ?? "잠시 후 다시 시도해 주세요."),
);
</script>

<svelte:head>
	<title>{page.status} — Studio Lab</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="error-page">
	<div class="error-accent"></div>
	<p class="error-code">{page.status}</p>
	<h1 class="error-heading">{heading}</h1>
	<p class="error-detail">{detail}</p>
	<div class="error-links">
		<a href="/portal" class="error-link error-link--primary">
			Studio Lab로 돌아가기
		</a>
		<a
			href="https://studio.modfolio.io"
			class="error-link"
			target="_blank"
			rel="noopener"
		>
			studio.modfolio.io
		</a>
	</div>
</main>

<style>
	.error-page {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		max-width: 560px;
		margin: 0 auto;
		padding: var(--space-16) var(--space-6);
		text-align: center;
	}

	/* Accent motif — echoes the portal card-accent gradient. */
	.error-accent {
		width: var(--space-16);
		height: 3px;
		margin-bottom: var(--space-8);
		border-radius: var(--radius-full);
		background: linear-gradient(
			90deg,
			var(--color-accent-primary),
			var(--color-accent-tertiary)
		);
		animation: accentIn var(--dur-slow) var(--ease-smooth) both;
	}

	.error-code {
		font-family: var(--font-mono);
		font-size: var(--font-size-display);
		font-weight: var(--font-weight-bold);
		line-height: 1;
		color: var(--color-text-3);
		margin-bottom: var(--space-4);
		animation: riseIn var(--dur-slow) var(--ease-smooth) 0.04s both;
	}

	.error-heading {
		font-family: var(--font-display);
		font-size: var(--font-size-h2);
		font-weight: var(--font-weight-bold);
		letter-spacing: -0.01em;
		color: var(--color-text-1);
		margin-bottom: var(--space-3);
		animation: riseIn var(--dur-slow) var(--ease-smooth) 0.08s both;
	}

	.error-detail {
		font-family: var(--font-body);
		font-size: var(--font-size-body);
		color: var(--color-text-2);
		line-height: 1.6;
		margin-bottom: var(--space-10);
		max-width: 42ch;
		animation: riseIn var(--dur-slow) var(--ease-smooth) 0.12s both;
	}

	.error-links {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-4);
		animation: riseIn var(--dur-slow) var(--ease-smooth) 0.16s both;
	}

	.error-link {
		font-family: var(--font-ui);
		font-size: var(--font-size-small);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-2);
		text-decoration: none;
		padding: var(--space-3) var(--space-6);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-full);
		transition:
			color var(--dur-fast) var(--ease-smooth),
			border-color var(--dur-fast) var(--ease-smooth),
			background var(--dur-fast) var(--ease-smooth);
	}

	.error-link:hover {
		color: var(--color-text-1);
		border-color: var(--color-border-hover);
	}

	.error-link--primary {
		color: var(--color-text-1);
		border-color: var(--color-border-hover);
		background: var(--color-surface-emphasis);
	}

	.error-link--primary:hover {
		border-color: var(--color-accent-primary);
	}

	@keyframes riseIn {
		from {
			opacity: 0;
			transform: translateY(var(--space-3));
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes accentIn {
		from {
			opacity: 0;
			transform: scaleX(0.4);
		}
		to {
			opacity: 1;
			transform: scaleX(1);
		}
	}

	@media (max-width: 768px) {
		.error-links {
			flex-direction: column;
			width: 100%;
		}

		.error-link {
			width: 100%;
		}
	}
</style>
