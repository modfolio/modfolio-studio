import type { MiddlewareHandler } from "astro";
import { auth } from "./lib/connect";

export const onRequest: MiddlewareHandler = async (context, next) => {
	if (context.url.pathname.startsWith("/auth/")) {
		return auth.middleware(context, next);
	}
	context.locals.user = null;
	return next();
};
