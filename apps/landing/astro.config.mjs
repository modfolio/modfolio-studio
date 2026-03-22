import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	vite: {
		ssr: {
			external: ["node:async_hooks"],
		},
	},
});
