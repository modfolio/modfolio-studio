// Single source of truth for Studio sub-app metadata (landing site).
//
// Both the listing surfaces (index.astro, apps/index.astro, Footer.astro) and
// the detail pages (apps/[app].astro) read from this one array. Previously the
// listing data lived here and the detail data — a superset with the same
// id/name/headline/desc/domain/url plus a `features` array — was duplicated in
// app-details.ts, so editing a headline, domain, or status meant changing two
// files and silently drifting otherwise. Detail helpers now derive from this
// array (see app-details.ts, kept as a thin compatibility layer).

export interface StudioAppFeature {
	title: string;
	desc: string;
}

export interface StudioApp {
	id: string;
	name: string;
	/** One-line editorial headline used on cards and the detail hero. */
	headline: string;
	/** Short descriptor shown under the name in listings. */
	desc: string;
	domain: string;
	url: string;
	status: "active" | "landing";
	/** Detail-page feature blocks. */
	features: StudioAppFeature[];
}

export const STUDIO_APPS: StudioApp[] = [
	{
		id: "munseo",
		name: "Munseo",
		headline: "어떤 형식이든, 자유롭게.",
		desc: "문서 포맷을 넘나드는 변환",
		domain: "munseo.app",
		url: "https://app.munseo.app",
		status: "landing",
		features: [
			{
				title: "포맷 사이를 자유롭게",
				desc: "DOCX에서 PDF로, Markdown에서 HTML로. 주요 문서 형식을 오가며 호환성 문제 없이 작업합니다.",
			},
			{
				title: "한 번에 여러 파일",
				desc: "배치 변환으로 같은 작업을 반복하지 않습니다. 원본 하나, 결과물 여럿.",
			},
			{
				title: "브라우저에서 바로",
				desc: "파일이 서버로 올라가지 않습니다. 브라우저 안에서 변환이 끝납니다.",
			},
		],
	},
	{
		id: "umbracast",
		name: "Umbracast",
		headline: "소리를 다루는 가장 가벼운 방법.",
		desc: "브라우저에서 바로 동작하는 오디오 변환",
		domain: "umbracast.com",
		url: "https://app.umbracast.com",
		status: "landing",
		features: [
			{
				title: "포맷을 가리지 않습니다",
				desc: "MP3, WAV, FLAC, OGG. 용도에 맞는 포맷을 품질 손실 없이 선택합니다.",
			},
			{
				title: "디바이스에서 처리",
				desc: "오디오 파일이 서버로 전송되지 않습니다. 변환은 디바이스 안에서 끝나고, 원본은 밖으로 나가지 않습니다.",
			},
			{
				title: "어디서든, 바로",
				desc: "데스크톱 앱도, 가입 절차도 필요 없습니다. 브라우저를 열고 파일을 넣으면 끝.",
			},
		],
	},
	{
		id: "sincheong",
		name: "Sincheong",
		headline: "반복은 기계에게, 판단은 사람에게.",
		desc: "접수부터 분류까지 자동화하는 폼 빌더",
		domain: "sincheong.app",
		url: "https://app.sincheong.app",
		status: "active",
		features: [
			{
				title: "코드 없이 설계",
				desc: "조건부 분기, 다단계 흐름, 동적 필드. 복잡한 폼도 드래그 앤 드롭으로 만듭니다.",
			},
			{
				title: "접수 후 자동 분류",
				desc: "응답이 들어오면 유형별로 자동 분류하고 대기열에 배치합니다. 사람이 하나하나 확인할 필요가 없습니다.",
			},
			{
				title: "데이터를 바로 확인",
				desc: "수집된 응답을 실시간으로 확인하고, CSV나 JSON으로 내보내 다른 도구와 연결합니다.",
			},
		],
	},
];

/** Look up a single app by id (used by the detail route). */
export function getStudioApp(id: string): StudioApp | undefined {
	return STUDIO_APPS.find((app) => app.id === id);
}

/** All app ids, for static path generation. */
export function getStudioAppIds(): string[] {
	return STUDIO_APPS.map((app) => app.id);
}
