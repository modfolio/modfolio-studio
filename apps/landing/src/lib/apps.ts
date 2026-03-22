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
		headline: "어떤 형식이든, 자유롭게.",
		desc: "문서 포맷을 넘나드는 변환 도구",
		domain: "munseo.app",
		url: "https://app.munseo.app",
		status: "landing",
	},
	{
		id: "umbracast",
		name: "Umbracast",
		headline: "소리, 가장 가벼운 방법으로.",
		desc: "설치 없이 동작하는 오디오 변환",
		domain: "umbracast.com",
		url: "https://app.umbracast.com",
		status: "landing",
	},
	{
		id: "sincheong",
		name: "Sincheong",
		headline: "반복은 기계에게, 판단은 사람에게.",
		desc: "접수부터 분류까지 자동화하는 폼 빌더",
		domain: "sincheong.app",
		url: "https://app.sincheong.app",
		status: "active",
	},
];
