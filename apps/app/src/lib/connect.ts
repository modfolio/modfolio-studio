import { createSvelteKitAuth } from "@modfolio/connect-sdk/sveltekit";

export const auth = createSvelteKitAuth({
	clientId: "modfolio-studio",
	protectedPaths: ["/portal"],
});
