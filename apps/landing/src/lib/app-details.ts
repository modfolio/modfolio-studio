// Detail-page view of the Studio app registry.
//
// The canonical data now lives in ./apps.ts (STUDIO_APPS). This module keeps the
// detail-oriented API (AppDetail, getAppDetail, getAllAppIds) that apps/[app].astro
// consumes, but derives it from that single source instead of holding a second
// hand-maintained copy — eliminating the drift that existed when both files
// carried the same headlines/domains/features.

import { STUDIO_APPS, type StudioApp, type StudioAppFeature } from "./apps";

export type { StudioAppFeature };

export interface AppDetail {
	id: string;
	name: string;
	headline: string;
	desc: string;
	domain: string;
	url: string;
	features: StudioAppFeature[];
}

function toDetail(app: StudioApp): AppDetail {
	return {
		id: app.id,
		name: app.name,
		headline: app.headline,
		desc: app.desc,
		domain: app.domain,
		url: app.url,
		features: app.features,
	};
}

export const APP_DETAILS: Record<string, AppDetail> = Object.fromEntries(
	STUDIO_APPS.map((app) => [app.id, toDetail(app)]),
);

export function getAppDetail(id: string): AppDetail | undefined {
	const app = STUDIO_APPS.find((a) => a.id === id);
	return app ? toDetail(app) : undefined;
}

export function getAllAppIds(): string[] {
	return STUDIO_APPS.map((app) => app.id);
}
