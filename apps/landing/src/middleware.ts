import type { MiddlewareHandler } from "astro";
import { auth } from "./lib/connect";

// Resolve the Connect session on *every* request, not just /auth/* routes.
// The Astro SDK middleware verifies the session cookie (rotating the refresh
// token when needed) and sets `context.locals.user` to the ConnectUser or null.
// It has no protectedPaths enforcement — the landing site is fully public — so
// running it globally never forces a redirect; it only populates `locals.user`.
// Header.astro (and any page) reads `locals.user` to swap the CTA between
// "로그인" and "Open Lab"; scoping this to /auth/* previously left `user` null on
// the home/apps/contact pages, so a signed-in visitor always saw the logged-out
// CTA and was pushed back through the full OIDC flow.
export const onRequest: MiddlewareHandler = (context, next) =>
	auth.middleware(context, next);
