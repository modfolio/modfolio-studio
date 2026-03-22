import { STUDIO_APPS } from "$lib/apps";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
		apps: STUDIO_APPS,
	};
};
