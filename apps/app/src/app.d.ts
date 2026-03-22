import type { ConnectUser } from "@modfolio/connect-sdk/sveltekit";

declare global {
	namespace App {
		interface Locals {
			user: ConnectUser | null;
		}
		interface Platform {
			env: {
				PUBLIC_APP_URL?: string;
				PUBLIC_LANDING_URL?: string;
				[key: string]: string | undefined;
			};
		}
	}
}
