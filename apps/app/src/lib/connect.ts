import { createSvelteKitAuth } from "@modfolio/connect-sdk/sveltekit";

// Parameterize the SDK's Locals generic with this app's `App.Locals` so the
// `event` / `resolve` passed through `auth.handle` (hooks.server.ts) are
// structurally compatible with SvelteKit's `RequestEvent` without a cast.
export const auth = createSvelteKitAuth<App.Locals>({
	clientId: "studio",
	protectedPaths: ["/portal"],
});
