import type { Handle } from "@sveltejs/kit";
import { auth } from "$lib/connect";

export const handle: Handle = ({ event, resolve }) =>
	auth.handle({ event, resolve });
