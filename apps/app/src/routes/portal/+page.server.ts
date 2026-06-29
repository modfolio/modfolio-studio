import { error } from "@sveltejs/kit";
import { STUDIO_APPS } from "$lib/apps";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	// /portal is a protectedPath — the Connect SDK hook (hooks.server.ts)
	// verifies the session and redirects unauthenticated requests before this
	// load runs. If we reach here without a verified user, the session
	// verification is in a degraded/inconsistent state. Surface it through the
	// branded error boundary (+error.svelte) rather than rendering an
	// authenticated shell with no user, and narrow `user` to non-null for the
	// page component.
	if (!locals.user) {
		error(503, "세션을 확인할 수 없습니다. 다시 로그인해 주세요.");
	}

	return {
		user: locals.user,
		apps: STUDIO_APPS,
	};
};
