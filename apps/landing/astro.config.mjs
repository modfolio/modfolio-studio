import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	// Prerendered pages are emitted as `contact.html`, not `contact/index.html`.
	// Workers Static Assets (html_handling auto-trailing-slash) then serves
	// `/contact` directly with 200; the directory form answered `/contact` with a
	// 307 to `/contact/` — an extra round trip on every internal link, since the
	// site links without the slash — and moved the canonical URL.
	build: {
		format: "file",
	},
	// Prefetch same-origin links on hover so a navigation feels instant. Pairs
	// with the <ClientRouter /> in Base.astro (which swaps documents client-side).
	prefetch: {
		prefetchAll: true,
		defaultStrategy: "hover",
	},
	vite: {
		ssr: {
			external: ["node:async_hooks"],
		},
	},
});
