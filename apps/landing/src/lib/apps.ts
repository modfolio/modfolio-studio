export interface StudioApp {
	id: string;
	name: string;
	desc: string;
	tagline: string;
	domain: string;
	url: string;
	status: "active" | "landing";
}

export const STUDIO_APPS: StudioApp[] = [
	{
		id: "munseo",
		name: "Munseo",
		desc: "문서 변환 유틸리티",
		tagline: "DOCX, PDF, HTML, Markdown — 형식 간 자유로운 변환",
		domain: "munseo.app",
		url: "https://app.munseo.app",
		status: "landing",
	},
	{
		id: "umbracast",
		name: "Umbracast",
		desc: "오디오 변환 유틸리티",
		tagline: "MP3, WAV, FLAC, OGG — Edge에서 실행되는 변환 엔진",
		domain: "umbracast.com",
		url: "https://app.umbracast.com",
		status: "landing",
	},
	{
		id: "sincheong",
		name: "Sincheong",
		desc: "범용 폼 빌더",
		tagline: "동적 폼 생성, 제출 관리, 대기열 자동화",
		domain: "sincheong.app",
		url: "https://app.sincheong.app",
		status: "active",
	},
];
