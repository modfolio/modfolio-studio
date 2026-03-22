export interface StudioApp {
	id: string;
	name: string;
	headline: string;
	desc: string;
	domain: string;
	url: string;
	status: "active" | "landing";
}

export const STUDIO_APPS: StudioApp[] = [
	{
		id: "munseo",
		name: "Munseo",
		headline: "형식에서 해방하다.",
		desc: "문서 변환 유틸리티",
		domain: "munseo.app",
		url: "https://app.munseo.app",
		status: "landing",
	},
	{
		id: "umbracast",
		name: "Umbracast",
		headline: "소리를 다루다.",
		desc: "오디오 변환 유틸리티",
		domain: "umbracast.com",
		url: "https://app.umbracast.com",
		status: "landing",
	},
	{
		id: "sincheong",
		name: "Sincheong",
		headline: "수작업을 끝내다.",
		desc: "범용 폼 빌더",
		domain: "sincheong.app",
		url: "https://app.sincheong.app",
		status: "active",
	},
];
