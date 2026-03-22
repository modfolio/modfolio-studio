export interface AppDetail {
	id: string;
	name: string;
	headline: string;
	desc: string;
	domain: string;
	url: string;
	features: Array<{ title: string; desc: string }>;
	useCases: Array<{ persona: string; scenario: string }>;
}

export const APP_DETAILS: Record<string, AppDetail> = {
	munseo: {
		id: "munseo",
		name: "Munseo",
		headline: "형식에서 해방하다.",
		desc: "문서 변환 유틸리티",
		domain: "munseo.app",
		url: "https://app.munseo.app",
		features: [
			{
				title: "다중 포맷 변환",
				desc: "DOCX, PDF, HTML, Markdown 등 주요 문서 형식 간 자유로운 변환. 포맷 호환성 문제를 원천 해결합니다.",
			},
			{
				title: "배치 처리",
				desc: "여러 파일을 한번에 변환. 반복 작업을 자동화하여 워크플로우를 단축합니다.",
			},
			{
				title: "Edge 실행",
				desc: "Cloudflare Workers 기반. 서버 설치 없이 브라우저에서 즉시 실행됩니다.",
			},
		],
		useCases: [
			{
				persona: "콘텐츠 크리에이터",
				scenario:
					"블로그 글을 Markdown으로 작성하고, 뉴스레터용 HTML과 포트폴리오용 PDF로 동시에 변환합니다.",
			},
			{
				persona: "개발자",
				scenario:
					"API 문서를 Markdown에서 HTML로 자동 변환하여 배포 파이프라인에 통합합니다.",
			},
		],
	},
	umbracast: {
		id: "umbracast",
		name: "Umbracast",
		headline: "소리를 다루다.",
		desc: "오디오 변환 유틸리티",
		domain: "umbracast.com",
		url: "https://app.umbracast.com",
		features: [
			{
				title: "오디오 포맷 변환",
				desc: "MP3, WAV, FLAC, OGG 등 주요 오디오 형식 간 변환. 품질 손실 없이 최적의 포맷을 선택합니다.",
			},
			{
				title: "Edge 오디오 엔진",
				desc: "Cloudflare Workers에서 직접 처리. 로컬 소프트웨어 설치 없이 어디서든 변환합니다.",
			},
			{
				title: "경량 처리",
				desc: "디바이스 자원을 거의 사용하지 않습니다. 저사양 기기에서도 쾌적하게 동작합니다.",
			},
		],
		useCases: [
			{
				persona: "팟캐스터",
				scenario:
					"녹음한 WAV 파일을 배포용 MP3로 변환하고, 아카이브용 FLAC으로 동시에 저장합니다.",
			},
			{
				persona: "영상 편집자",
				scenario:
					"영상에서 추출한 오디오를 편집 소프트웨어 호환 포맷으로 빠르게 변환합니다.",
			},
		],
	},
	sincheong: {
		id: "sincheong",
		name: "Sincheong",
		headline: "수작업을 끝내다.",
		desc: "범용 폼 빌더",
		domain: "sincheong.app",
		url: "https://app.sincheong.app",
		features: [
			{
				title: "동적 폼 생성",
				desc: "드래그 앤 드롭으로 복잡한 폼을 설계합니다. 조건부 로직, 다단계 폼을 코드 없이 구현합니다.",
			},
			{
				title: "대기열 자동화",
				desc: "접수된 응답을 자동으로 분류하고 대기열에 배치합니다. 수작업 접수를 완전히 제거합니다.",
			},
			{
				title: "데이터 수집 · 분석",
				desc: "응답 데이터를 실시간으로 수집하고 시각화합니다. 내보내기 기능으로 외부 도구와 연동합니다.",
			},
		],
		useCases: [
			{
				persona: "비즈니스 운영",
				scenario:
					"고객 문의 접수 폼을 만들고, 유형별 자동 분류와 담당자 배정으로 응대 시간을 단축합니다.",
			},
			{
				persona: "연구자",
				scenario:
					"설문 조사 폼을 설계하고, 조건부 분기로 응답자별 맞춤 질문을 제공합니다.",
			},
		],
	},
};

export function getAppDetail(id: string): AppDetail | undefined {
	return APP_DETAILS[id];
}

export function getAllAppIds(): string[] {
	return Object.keys(APP_DETAILS);
}
