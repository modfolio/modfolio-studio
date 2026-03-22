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
		headline: "어떤 형식이든, 자유롭게.",
		desc: "문서 포맷을 넘나드는 변환 도구",
		domain: "munseo.app",
		url: "https://app.munseo.app",
		features: [
			{
				title: "포맷 간 자유로운 전환",
				desc: "DOCX에서 PDF로, Markdown에서 HTML로. 주요 문서 형식을 오가며 호환성 문제 없이 작업합니다.",
			},
			{
				title: "한 번에 여러 파일",
				desc: "배치 변환으로 반복 작업에 드는 시간을 줄입니다. 같은 작업을 두 번 하지 않아도 됩니다.",
			},
			{
				title: "브라우저에서 바로",
				desc: "Cloudflare Edge에서 실행됩니다. 소프트웨어를 설치하거나 파일을 업로드할 필요 없이, 열면 바로 시작합니다.",
			},
		],
		useCases: [
			{
				persona: "콘텐츠 크리에이터",
				scenario:
					"Markdown으로 작성한 원고를 뉴스레터용 HTML과 포트폴리오용 PDF로 동시에 내보냅니다. 하나의 원본, 여러 형식.",
			},
			{
				persona: "개발 팀",
				scenario:
					"기술 문서를 Markdown에서 HTML로 자동 변환하고, 배포 파이프라인에 바로 연결합니다.",
			},
		],
	},
	umbracast: {
		id: "umbracast",
		name: "Umbracast",
		headline: "소리, 가장 가벼운 방법으로.",
		desc: "설치 없이 동작하는 오디오 변환",
		domain: "umbracast.com",
		url: "https://app.umbracast.com",
		features: [
			{
				title: "무손실 포맷 전환",
				desc: "MP3, WAV, FLAC, OGG 사이를 자유롭게. 용도에 맞는 포맷을 품질 손실 없이 선택합니다.",
			},
			{
				title: "디바이스에 부담 없이",
				desc: "변환 처리가 Cloudflare Edge에서 이루어집니다. 노트북이든 태블릿이든, 디바이스 자원을 소모하지 않습니다.",
			},
			{
				title: "어디서든, 바로",
				desc: "데스크톱 앱 설치도, 가입 절차도 필요 없습니다. 브라우저를 열고 파일을 넣으면 끝.",
			},
		],
		useCases: [
			{
				persona: "팟캐스터",
				scenario:
					"녹음한 WAV 원본을 배포용 MP3와 아카이브용 FLAC으로 동시에 변환합니다. 녹음실에서도, 카페에서도.",
			},
			{
				persona: "영상 편집자",
				scenario:
					"영상에서 분리한 오디오 트랙을 편집 소프트웨어가 요구하는 형식으로 즉시 변환합니다.",
			},
		],
	},
	sincheong: {
		id: "sincheong",
		name: "Sincheong",
		headline: "반복은 기계에게, 판단은 사람에게.",
		desc: "접수부터 분류까지 자동화하는 폼 빌더",
		domain: "sincheong.app",
		url: "https://app.sincheong.app",
		features: [
			{
				title: "코드 없이 설계",
				desc: "조건부 분기, 다단계 흐름, 동적 필드. 복잡한 폼도 코드 한 줄 없이 만들 수 있습니다.",
			},
			{
				title: "접수 후 자동 분류",
				desc: "응답이 들어오면 유형별로 자동 분류하고 대기열에 배치합니다. 사람이 하나하나 확인할 필요가 없습니다.",
			},
			{
				title: "실시간 데이터 확인",
				desc: "수집된 응답을 즉시 확인하고 시각화합니다. 필요하면 CSV, JSON으로 내보내 다른 도구와 연결합니다.",
			},
		],
		useCases: [
			{
				persona: "운영 담당자",
				scenario:
					"고객 문의 접수 폼을 만들고, 유형별 자동 분류와 담당자 배정으로 첫 응대까지의 시간을 줄입니다.",
			},
			{
				persona: "리서처",
				scenario:
					"설문 조사에 조건부 분기를 넣어, 응답자의 답변에 따라 다른 질문을 보여줍니다.",
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
