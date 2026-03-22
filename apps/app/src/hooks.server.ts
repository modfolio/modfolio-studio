import type { Handle } from "@sveltejs/kit";
import { auth } from "$lib/connect";

export const handle: Handle = async ({ event, resolve }) => {
	return auth.handle({
		event: event as unknown as Parameters<typeof auth.handle>[0]["event"],
		resolve: resolve as unknown as Parameters<typeof auth.handle>[0]["resolve"],
	});
};
