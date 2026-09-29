import { createAstroAuth } from "@modfolio/connect-sdk/astro";
import { clearSignedInHint, setSignedInHint } from "./signed-in-hint";

export const auth = createAstroAuth({
	clientId: "studio",
	hooks: {
		// Keep the prerendered Header's signed-in hint in step with the session.
		onCallback: async (_user, context) => setSignedInHint(context.cookies),
		onLogout: async (context) => clearSignedInHint(context.cookies),
	},
});
