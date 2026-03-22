import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			routes: {
				include: ["/*"],
				exclude: ["<all>"],
			},
		}),
		alias: {
			$lib: "./src/lib",
		},
	},
};

export default config;
