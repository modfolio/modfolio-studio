import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
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
