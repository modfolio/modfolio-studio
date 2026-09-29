import type { MiddlewareHandler } from "astro";
import { auth } from "./lib/connect";
import { syncSignedInHint } from "./lib/signed-in-hint";

// The landing pages are prerendered, so at request time this runs only for the
// SSR routes (/auth/*). The Astro SDK middleware verifies the session cookie
// (rotating the refresh token when needed) and sets `context.locals.user`; it has
// no protectedPaths enforcement — the site is fully public — so it never forces a
// redirect. On the way through it re-aligns the non-credential signed-in hint the
// prerendered Header reads (see lib/signed-in-hint.ts). The auth hooks in
// lib/connect.ts set/clear it on login and logout, and those writes land after
// this one, so they win.
export const onRequest: MiddlewareHandler = (context, next) => {
	if (context.isPrerendered) return next();
	return auth.middleware(context, () => {
		syncSignedInHint(context.cookies, context.locals.user !== null);
		return next();
	});
};
