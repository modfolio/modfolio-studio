/**
 * The cookie surface this module needs. Both Astro's `AstroCookies` (middleware)
 * and the Connect SDK's structural cookie type (auth hooks) satisfy it.
 */
interface CookieJar {
	get(name: string): { value: string } | undefined;
	set(name: string, value: string, options?: Record<string, unknown>): void;
	delete(name: string, options?: Record<string, unknown>): void;
}

/**
 * Non-credential "this browser has a Studio session" hint.
 *
 * The landing pages are prerendered (no Worker invocation per view), so the
 * Header cannot read `locals.user` at request time. The SSR auth routes keep this
 * cookie in step with the real session and the Header's inline script reads it to
 * pick the CTA. It carries no identity and grants nothing — the session itself
 * stays in the SDK's HttpOnly cookies — which is why it may be readable by script.
 */
export const SIGNED_IN_HINT_COOKIE = "studio_si";

/** Matches the SDK refresh-token lifetime (REFRESH_COOKIE_TTL, 90 days). */
const SIGNED_IN_HINT_TTL = 7_776_000;

export function setSignedInHint(cookies: CookieJar): void {
	cookies.set(SIGNED_IN_HINT_COOKIE, "1", {
		path: "/",
		maxAge: SIGNED_IN_HINT_TTL,
		sameSite: "lax",
		secure: true,
		httpOnly: false,
	});
}

export function clearSignedInHint(cookies: CookieJar): void {
	cookies.delete(SIGNED_IN_HINT_COOKIE, { path: "/" });
}

/** Write only when the hint disagrees with the session, so in-step requests stay cookie-free. */
export function syncSignedInHint(cookies: CookieJar, signedIn: boolean): void {
	const hinted = cookies.get(SIGNED_IN_HINT_COOKIE)?.value === "1";
	if (signedIn && !hinted) setSignedInHint(cookies);
	else if (!signedIn && hinted) clearSignedInHint(cookies);
}
