<script>
import { fontPreloads, fontsCssHref } from "$lib/fonts-href";
import "../app.css";

let { children } = $props();
</script>

<svelte:head>
	{#each fontPreloads as href (href)}
		<link rel="preload" as="font" type="font/woff2" {href} crossorigin="anonymous" />
	{/each}
	<link rel="stylesheet" href={fontsCssHref} />
</svelte:head>

<!--
  Bypass-blocks link (WCAG 2.2 SC 2.4.1). The portal renders a sticky header
  before the main content; keyboard/AT users need a way to skip past it. Targets
  the `id="main"` on each route's <main>. Visually hidden until focused.
-->
<a href="#main" class="skip-link">본문으로 건너뛰기</a>

{@render children()}
