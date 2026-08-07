import { createSvelteKitAuth } from "@modfolio/connect-sdk/sveltekit";

// Parameterize the SDK's Locals generic with this app's `App.Locals` so the
// `event` / `resolve` passed through `auth.handle` (hooks.server.ts) are
// structurally compatible with SvelteKit's `RequestEvent` without a cast.
export const auth = createSvelteKitAuth<App.Locals>({
	clientId: "studio",
	protectedPaths: ["/portal"],
	// v10 은 로그아웃 기본이 **전역**(Connect end_session 경유)이고 그 뒤 착지점의
	// 기본값이 `/` 다. ⚠ 이 앱은 `protectedPaths` 가 `/portal` 뿐인데도 **홈이
	// 보호돼 있다** — 라이브 실측에서 미인증 `GET /` 이 302 로 `/auth/login` 에
	// 간다(선언이 아니라 라우트 레벨에서 막고 있다는 뜻이다). 기본값을 그대로 두면
	// 로그아웃 직후 로그인으로 튕겨 «실패한 것처럼» 보이므로 명시한다.
	// ⚠ 값은 **앱 상대 경로** — 절대 URL 은 sanitize 된다.
	logout: { postLogoutRedirect: "/auth/login" },
});
