/**
 * scripts/hooks/_wip-push.ts — `wip/*` push 판정 (ADR-029 §7 · 오너 2026-09-23 저녁 `/modfolio-moon`).
 *
 * ## 판정하는 곳은 git pre-push 훅 하나다
 *
 * git 은 pre-push 훅에 **실제로 갱신할 ref 목록**을 stdin 으로 준다(`<local ref> <local sha> <remote ref> <remote sha>`).
 * 명령줄은 그 목록이 아니다 — `push.default=upstream`·`remote.<n>.push`·`push.followTags` 가 대상을 바꾼다(3.93.0 후보
 * 독립 리뷰 P1). 그래서 판정(`judgeWipPush`)은 git 이 준 줄로만 한다. Claude 쪽 `pre-push-guard` 는 명령이 wip push 로
 * **보이고** 우리 git 훅이 래퍼로 설치돼 있을 때만 판정을 넘긴다(`gitPrePushMode`) — 명령 해석이 틀려도 git 훅이 실제
 * ref 로 다시 가르므로, 해석의 오류는 «넘길까 말까» 에만 영향을 준다.
 *
 * ## 무엇을 스캔하나
 *
 * 보내는 ref 가 **전부** `refs/heads/wip/*` 일 때만 wip 규칙이다(태그·다른 브랜치가 한 줄이라도 섞이면 호출자는 풀 영수증).
 * 원격에 아직 없는 **모든 커밋**의 **추가된 줄**을 스캔한다 — 끝 커밋의 파일만 보면 중간 커밋에 들어갔다가 지워진 비밀이
 * 그대로 게시된다(리뷰 P0). 병합은 결합 diff(`--cc`)로 병합이 들인 줄만 본다. 바이너리는 그 커밋의 blob 을 읽어 본다.
 * 선언(`.claude/rules/secret-sweep-allowlist.json`)은 **보내는 끝 커밋에 커밋된 것**을 쓴다 — 작업 트리의 미커밋 선언은
 * 면제가 아니다(리뷰 P3). 범위가 크거나(원격 추적 ref 가 없거나 낡음) 읽지 못하면 **막는다** — 판정 불능은 통과가 아니다.
 *
 * 4.1.4 — «원격에 이미 있는 것» 은 원격 추적 ref 만이 아니라 **보내는 그 URL** 의 `git ls-remote` 로도 잰다. git 은 훅에
 * `$1` = 원격 이름(이름 없는 push 면 URL) · `$2` = **실제로 보내는 URL** 을 준다. URL 로 직접 보내면 추적 ref 가 없어
 * 저장소 전체 히스토리가 «원격에 없음» 으로 세어져 막혔고(fleet-4 T10b pdgd: 보관 태그 push 가 수천 커밋으로 막힘),
 * 이름 push 여도 추적 ref 는 **fetch URL** 의 것이라 두 번째 push URL(NAS)의 사실이 아니었다(T12 리뷰 P2).
 *
 * 이 파일은 공유 lib 이라 멤버의 `.claude/hooks/` 에도 착지한다 — 동기화되는 형제(`./secret-patterns.ts`)만 임포트한다.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { parseSecretAllowlist, scanSecrets } from "./secret-patterns.ts";

export type PushVerdict =
	| { readonly allow: true; readonly message: string }
	| { readonly allow: false; readonly message: string };

export const WIP_REF = /^refs\/heads\/wip\//;
/**
 * 보관 태그 — 헌장 규칙: main 에 없는 커밋을 가진 브랜치를 지우기 전에 `archive/<이름>-<날짜>` 태그를 두 원격에 올린다.
 * 그 태그는 **옛 커밋**을 가리키고 그 트리엔 게이트 영수증이 있을 수 없다 — 풀 영수증 규칙이면 영원히 못 올린다
 * (2026-09-30 fleet-4 T6: pdgd 워커가 wip 브랜치 push + GitHub API + Forgejo 컨테이너 안 `git tag` 로 우회했다).
 * 통합 후보가 아니므로 wip 와 같이 **보내는 커밋의 비밀 스윕**만 한다.
 */
export const ARCHIVE_TAG_REF = /^refs\/tags\/archive\//;
/** 스윕 규칙을 절대 쓰지 않는 브랜치 — 통합 브랜치는 늘 풀 영수증이다(삭제도). */
const INTEGRATION_BRANCH = /^refs\/heads\/(main|master)$/;
const ZERO_SHA = /^0+$/;
/** 한 번의 wip push 가 보낼 수 있는 커밋 상한 — 넘으면 원격 추적 ref 가 없거나 낡은 것이다(전체 히스토리를 훑지 않는다). */
export const MAX_WIP_COMMITS = 300;
/** 패치 출력 상한 — 넘으면 판정 불능(막는다). */
const MAX_PATCH_BYTES = 128 * 1024 * 1024;
/** 바이너리 blob 하나의 스캔 상한 — 넘으면 못 읽은 것으로 막는다. */
const MAX_BLOB_BYTES = 8 * 1024 * 1024;
const ALLOWLIST_PATH = ".claude/rules/secret-sweep-allowlist.json";
/** 메시지에 싣는 위반 줄 상한 — stderr 는 모델 컨텍스트로 들어간다(리뷰 P3). */
const MAX_LISTED = 10;

/**
 * git 훅 설치 표식 — `install-git-hooks.ts` 의 `MARKER`·`CHAIN_BEGIN` 과 같아야 한다(`git-pre-push-wip.test.ts` 가 대조한다).
 * 이 파일은 동기화되는 lib 이라 동기화되지 않는 `install-git-hooks.ts` 를 임포트할 수 없다.
 */
export const GIT_HOOK_MARKER = "# modfolio-harness git hook (managed)";
export const GIT_HOOK_CHAIN_BEGIN =
	"# BEGIN modfolio-harness pre-push chain (managed by harness-pull)";

export type PushLine = {
	readonly localRef: string;
	readonly localSha: string;
	readonly remoteRef: string;
	readonly remoteSha: string;
};

/** git 이 pre-push 훅 stdin 으로 주는 줄: `<local ref> <local sha> <remote ref> <remote sha>`. */
export function parsePushLines(stdin: string): PushLine[] {
	return stdin
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean)
		.map((l) => {
			const [localRef = "", localSha = "", remoteRef = "", remoteSha = ""] = l.split(/\s+/);
			return { localRef, localSha, remoteRef, remoteSha };
		});
}

/** 보내는 ref 가 **전부** `wip/*` 브랜치일 때만 wip 규칙이다. 빈 목록은 wip 가 아니다(판정 근거가 없다). */
export function isWipPush(lines: readonly PushLine[]): boolean {
	return lines.length > 0 && lines.every((l) => WIP_REF.test(l.remoteRef));
}

/**
 * 한 줄이 «통합 후보가 아닌» ref 갱신인가 — `wip/*` 브랜치 · 보관 태그(`refs/tags/archive/*`) 생성·갱신 ·
 * 통합 브랜치(main·master)가 **아닌** 브랜치의 삭제. 보관 태그의 **삭제**는 아니다(보관의 뜻이 사라진다 → 풀 규칙).
 */
export function isSweepOnlyLine(l: PushLine): boolean {
	if (WIP_REF.test(l.remoteRef)) return true;
	if (ARCHIVE_TAG_REF.test(l.remoteRef)) return !ZERO_SHA.test(l.localSha);
	return (
		ZERO_SHA.test(l.localSha) &&
		l.remoteRef.startsWith("refs/heads/") &&
		!INTEGRATION_BRANCH.test(l.remoteRef)
	);
}

/** 보내는 ref 가 **전부** 스윕 규칙 대상일 때만 — 한 줄이라도 main·다른 브랜치·일반 태그가 섞이면 풀 영수증. */
export function isSweepOnlyPush(lines: readonly PushLine[]): boolean {
	return lines.length > 0 && lines.every(isSweepOnlyLine);
}

/** 메시지의 이름 — wip 만이면 «wip push», 아니면 보관·삭제가 섞인 것이다. */
function pushLabel(lines: readonly PushLine[]): string {
	return isWipPush(lines) ? "wip push" : "wip·보관 태그·브랜치 삭제 push";
}

/** git 의 C 인용 경로(`"a\tb"`)를 푼다 — 인용이 아니면 그대로. */
export function unquoteGitPath(raw: string): string {
	if (!(raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2)) return raw;
	const body = raw.slice(1, -1);
	const bytes: number[] = [];
	for (let i = 0; i < body.length; i++) {
		const c = body[i] ?? "";
		if (c !== "\\") {
			for (const b of Buffer.from(c, "utf8")) bytes.push(b);
			continue;
		}
		const n = body[i + 1] ?? "";
		if (/[0-7]/.test(n)) {
			bytes.push(Number.parseInt(body.slice(i + 1, i + 4), 8));
			i += 3;
			continue;
		}
		const map: Record<string, number> = {
			n: 10,
			t: 9,
			r: 13,
			'"': 34,
			"\\": 92,
			a: 7,
			b: 8,
			f: 12,
			v: 11,
		};
		bytes.push(map[n] ?? n.charCodeAt(0));
		i += 1;
	}
	return Buffer.from(bytes).toString("utf8");
}

export interface AddedBlock {
	readonly commit: string;
	readonly file: string;
	readonly text: string;
}

/**
 * `git log -p --diff-merges=cc --no-renames --format=commit %H` 출력에서 커밋·파일별 **추가된 줄**과 바이너리 변경을 모은다.
 * 일반 diff 는 부모 1칸, 결합 diff 는 부모 수만큼의 칸이 줄 앞에 붙는다 — 그 칸에 `+` 가 하나라도 있으면 추가된 줄이다.
 */
export function collectAdded(patch: string): {
	blocks: AddedBlock[];
	binaries: { commit: string; file: string }[];
} {
	const blocks: AddedBlock[] = [];
	const binaries: { commit: string; file: string }[] = [];
	let commit = "";
	let file: string | null = null;
	let parents = 1;
	let inHunk = false;
	let buf: string[] = [];
	const flush = () => {
		if (file !== null && buf.length > 0) blocks.push({ commit, file, text: buf.join("\n") });
		buf = [];
	};
	for (const line of patch.split("\n")) {
		const c = /^commit ([0-9a-f]{40,64})$/.exec(line);
		if (c) {
			flush();
			commit = c[1] ?? "";
			file = null;
			inHunk = false;
			continue;
		}
		if (line.startsWith("diff --git ")) {
			flush();
			// `a/P b/P` — `--no-renames` 라 두 쪽이 같다. 공백이 든 경로도 가운데서 가른다.
			const rest = line.slice("diff --git ".length);
			file = rest.startsWith('"')
				? unquoteGitPath(rest.slice(rest.indexOf('"b/'))).replace(/^b\//, "")
				: rest.slice(2, (rest.length - 1) / 2);
			parents = 1;
			inHunk = false;
			continue;
		}
		if (line.startsWith("diff --cc ") || line.startsWith("diff --combined ")) {
			flush();
			file = unquoteGitPath(line.replace(/^diff --(cc|combined) /, ""));
			inHunk = false;
			continue;
		}
		if (!inHunk && line.startsWith("+++ ")) {
			// 경로에 공백이 있으면 git 이 헤더 끝에 TAB 을 붙인다(diff.c) — 떼지 않으면 선언 키와 영영 안 맞는다(리뷰 dA P2).
			const target = line.slice(4).replace(/\t$/, "");
			file = target === "/dev/null" ? null : unquoteGitPath(target).replace(/^b\//, "");
			continue;
		}
		const bin = /^Binary files (?:(.+) and (.+) )?differ$/.exec(line);
		if (bin) {
			// 결합 diff 는 «Binary files differ» 만 적는다 — 그때도 이 커밋의 blob 을 읽는다.
			if (file !== null && bin[2] !== "/dev/null") binaries.push({ commit, file });
			continue;
		}
		const h = /^(@{2,}) /.exec(line);
		if (h) {
			parents = (h[1] ?? "@@").length - 1;
			inHunk = true;
			continue;
		}
		if (inHunk && file !== null && line.length >= parents && line.slice(0, parents).includes("+"))
			buf.push(line.slice(parents));
	}
	flush();
	return { blocks, binaries };
}

function git(root: string, args: readonly string[], input?: string) {
	return spawnSync("git", ["-c", "core.quotePath=false", ...args], {
		cwd: root,
		encoding: "utf8",
		input,
		maxBuffer: MAX_PATCH_BYTES,
	});
}

/** 보내는 끝 커밋에 커밋된 선언 — 없으면 빈 목록 · 손상되면 던진다. */
function allowlistAt(root: string, sha: string): Set<string> {
	const r = git(root, ["show", `${sha}:${ALLOWLIST_PATH}`]);
	if (r.status !== 0) return new Set();
	return new Set(parseSecretAllowlist(r.stdout ?? "").map((a) => `${a.file}::${a.id}`));
}

/** 바이너리 blob 들을 한 프로세스(`cat-file --batch`)로 읽는다. 읽지 못한 것은 null. */
function readBlobs(root: string, specs: readonly string[]): (string | null)[] {
	if (specs.length === 0) return [];
	const r = spawnSync("git", ["cat-file", "--batch"], {
		cwd: root,
		input: `${specs.join("\n")}\n`,
		maxBuffer: MAX_PATCH_BYTES,
	});
	if (r.status !== 0 || !r.stdout) return specs.map(() => null);
	const out: (string | null)[] = [];
	const buf = r.stdout as Buffer;
	let pos = 0;
	for (let i = 0; i < specs.length; i++) {
		const nl = buf.indexOf(10, pos);
		if (nl < 0) {
			out.push(null);
			continue;
		}
		const header = buf.subarray(pos, nl).toString("utf8");
		const m = /^[0-9a-f]+ (\w+) (\d+)$/.exec(header);
		if (!m) {
			out.push(null); // `<spec> missing` 등
			pos = nl + 1;
			continue;
		}
		const size = Number(m[2]);
		const body = buf.subarray(nl + 1, nl + 1 + size);
		out.push(size > MAX_BLOB_BYTES ? null : body.toString("utf8"));
		pos = nl + 1 + size + 1;
	}
	return out;
}

/**
 * «이미 게시됨» 으로 뺄 원격 추적 ref 의 범위. git 은 훅에 `$1` = 원격 **이름**(이름 없는 push 면 URL)을 준다.
 *   · 설정된 원격 이름 → 그 원격의 추적 ref 만(`--remotes=<이름>`) — 다른 원격에만 있는 커밋은 여기 없다.
 *   · URL·경로(이름 없는 push) → 추적 ref 가 없다 — 줄의 remote sha 만 뺀다(null).
 *   · 인자를 못 받음(옛 래퍼·손으로 부름) → 종전대로 모든 원격(`--remotes`). 호출자가 그 사실을 메시지에 적는다.
 * 2026-09-24 실측: 래퍼가 `"$@"` 를 넘기지 않아 이 함수의 첫 갈래가 한 번도 돌지 않았다 — 빈 원격으로 보내는 wip
 * push 가 «원격에 없는 커밋 0개» 로 스윕 없이 통과했다.
 */
export function remoteScope(root: string, remote: string | null): string | null {
	if (remote === null || remote === "") return "--remotes";
	if (!/^[A-Za-z0-9._-]+$/.test(remote)) return null;
	const names = git(root, ["remote"]);
	// 목록을 못 읽으면 덜 뺀다(더 많이 스캔한다) — 못 읽음을 «이미 게시됨» 쪽으로 접지 않는다.
	if (names.status !== 0) return null;
	return (names.stdout ?? "").split("\n").some((n) => n.trim() === remote)
		? `--remotes=${remote}`
		: null;
}

/** `git ls-remote` 한 줄 — 벗긴 줄(`^{}`)은 ref 이름에서 떼고 그대로 싣는다(대상이 커밋이다). */
export interface RemoteRef {
	readonly sha: string;
	readonly ref: string;
}

/**
 * 보내는 원격의 ref 목록 — `target` 은 git 이 준 URL($2)이 있으면 그것, 없으면 원격 이름($1). 둘 다 없으면 null(잴 수 없다).
 * 못 읽으면(네트워크·인증·시간 초과) null — 호출자가 «이미 게시됨» 쪽으로 접지 않는다. 테스트가 대상을 바꿀 수 있게 target 을 받는다.
 */
export function lsRemote(
	root: string,
	target: string | null,
	patterns: readonly string[] = [],
): RemoteRef[] | null {
	if (target === null || target === "") return null;
	const r = spawnSync("git", ["ls-remote", "--", target, ...patterns], {
		cwd: root,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
		timeout: 30_000,
		maxBuffer: MAX_PATCH_BYTES,
	});
	if (r.status !== 0 || r.error) return null;
	return (r.stdout ?? "")
		.split("\n")
		.map((row) => row.split("\t"))
		.filter(([sha, ref]) => /^[0-9a-f]{40,64}$/.test(sha ?? "") && (ref ?? "") !== "")
		.map(([sha = "", ref = ""]) => ({ sha, ref: ref.replace(/\^\{\}$/, "") }));
}

/** 이 저장소에 **커밋(또는 커밋을 가리키는 태그)으로** 있는 sha 만 — 한 프로세스(`cat-file --batch-check`)로 가른다. */
export function localCommitish(root: string, shas: readonly string[]): string[] {
	const uniq = [...new Set(shas)];
	if (uniq.length === 0) return [];
	const r = spawnSync("git", ["cat-file", "--batch-check=%(objectname) %(objecttype)"], {
		cwd: root,
		encoding: "utf8",
		input: `${uniq.join("\n")}\n`,
		maxBuffer: MAX_PATCH_BYTES,
	});
	if (r.status !== 0) return [];
	return (r.stdout ?? "")
		.split("\n")
		.map((row) => row.trim().split(" "))
		.filter(([, type]) => type === "commit" || type === "tag")
		.map(([sha = ""]) => sha);
}

/**
 * 브랜치 삭제가 커밋을 잃게 하는가 — 헌장 규칙: main 에 없는 커밋을 가진 브랜치는 `archive/*` 태그를 **두 원격에** 올린 뒤에만
 * 지운다. 그래서 «담겼는가» 는 **지우는 그 원격**에서 잰다(리뷰 delta P0: 로컬 태그만으로는 원격에 보관 사본이 없을 수 있다):
 * 그 원격에 **실제로 있는**(`git ls-remote <보내는 URL>`) `main`·`master`·`refs/tags/archive/*`(벗긴 대상) 중 하나가
 * 지워질 끝(`remoteSha`)을 담으면 null.
 *   · 4.1.4 — `url`(훅의 $2)이 있으면 그 URL 을 읽는다. 원격 **이름**으로 읽으면 fetch URL 이라, 두 번째 push URL(NAS)로 지울 때
 *     GitHub 의 보관 태그를 보고 통과시켰다(T12 리뷰 P2). URL 을 못 받았을 때(옛 래퍼 · `moon.ts`)만 이름과 그 추적 ref 를 쓴다.
 *   · 4.1.4 — **고유 내용 없는 끝**(fleet-4 T10b pdgd): 끝 커밋의 트리가 부모 하나의 트리와 **같고** 부모가 **전부** 그 원격의
 *     main·보관 태그에 담겨 있으면 잃는 내용이 없다(보관 브랜치들을 합친 병합 커밋 · 빈 커밋). 한 칸만 본다 — 재귀하지 않는다.
 * 원격 이름을 못 받았거나, 끝 커밋이 이 저장소에 없거나, 원격을 못 읽으면 잴 수 없다 — 막는다(판정 불능은 통과가 아니다).
 */
export function deletionLoss(
	root: string,
	l: PushLine,
	remote: string | null,
	url: string | null = null,
): string | null {
	if (ZERO_SHA.test(l.remoteSha)) return null; // 원격에 없는 ref — 잃을 것이 없다
	const tip = l.remoteSha.slice(0, 8);
	const tag = `\`git tag archive/<브랜치 이름의 / 를 - 로>-<YYYYMMDD> ${tip}\``;
	const target = url !== null && url !== "" ? url : remote;
	if (target === null || target === "")
		return `원격 이름을 못 받아(옛 래퍼 · 손으로 부름) 그 원격에 보관 사본이 있는지 잴 수 없다 → \`bun run modfolio:install-guards\``;
	if (git(root, ["cat-file", "-e", `${l.remoteSha}^{commit}`]).status !== 0)
		return `지울 원격 끝 ${tip}(${l.remoteRef}) 이 이 저장소에 없어 담겼는지 잴 수 없다 → \`git fetch ${target}\` 뒤 다시(담기지 않았으면 ${tag} 을 그 원격에 먼저 올린다)`;
	const contains = (sha: string, ref: string) =>
		git(root, ["merge-base", "--is-ancestor", sha, ref]).status === 0;
	// URL 을 못 받았을 때만 이름의 추적 ref 를 쓴다 — URL 이 있으면 추적 ref 는 다른 URL(fetch)의 사실일 수 있다.
	const tracking: string[] = [];
	if ((url === null || url === "") && remote !== null && /^[A-Za-z0-9._-]+$/.test(remote))
		for (const b of ["main", "master"]) {
			const ref = `refs/remotes/${remote}/${b}`;
			if (git(root, ["rev-parse", "--verify", "--quiet", ref]).status === 0) tracking.push(ref);
		}
	const listed = lsRemote(root, target, [
		"refs/heads/main",
		"refs/heads/master",
		"refs/tags/archive/*",
	]);
	if (listed === null && tracking.length === 0)
		return `원격 ${target} 의 main·보관 태그를 읽지 못했다(ls-remote 실패) · 판정 불능은 통과가 아니다`;
	// 벗긴 줄(`^{}`)과 주석 태그 객체 sha 를 둘 다 시도한다 — 이 저장소에 있는 것만 잴 수 있다.
	const holders = [
		...tracking,
		...localCommitish(
			root,
			(listed ?? []).map((r) => r.sha),
		),
	];
	const kept = (sha: string) => holders.some((h) => contains(sha, h));
	if (kept(l.remoteSha)) return null;
	// 고유 내용 없는 끝 — 트리가 부모 하나와 같고 부모가 전부 담겨 있다.
	const parents = git(root, ["rev-list", "--parents", "-n", "1", l.remoteSha]);
	const ps = (parents.stdout ?? "").trim().split(/\s+/).slice(1).filter(Boolean);
	const treeOf = (sha: string) => (git(root, ["rev-parse", `${sha}^{tree}`]).stdout ?? "").trim();
	if (parents.status === 0 && ps.length > 0) {
		const t = treeOf(l.remoteSha);
		if (t !== "" && ps.some((p) => treeOf(p) === t) && ps.every(kept)) return null;
	}
	return (
		`${l.remoteRef} 의 끝 ${tip} 이 원격 ${target} 의 main 에도 보관 태그에도 없다 — 지우면 그 커밋을 잃는다.\n` +
		`  → ${tag} 을 두 원격에 먼저 push 한 뒤 지운다(헌장 규칙 · 로컬 태그만으로는 원격에 사본이 없다)\n` +
		"  (끝이 보관된 부모들을 합친 병합·빈 커밋처럼 **고유 내용이 없으면** 태그 없이 지운다 — 트리가 부모 하나와 같고 부모가 전부 그 원격의 main·보관 태그에 있어야 한다)"
	);
}

/**
 * «이미 그 원격에 있음» 으로 뺄 커밋들(sha) — 원격 추적 ref(`remoteScope`) ∪ **보내는 URL 의 `ls-remote`** 중 이 저장소에
 * 있는 것. `lsFailed` 는 ls-remote 를 시도했는데 못 읽었다는 뜻이다(메시지용 — 못 읽음을 «이미 게시됨» 으로 접지 않는다).
 */
export function publishedExclusions(
	root: string,
	remote: string | null,
	url: string | null,
): { readonly shas: string[]; readonly lsFailed: boolean } {
	const shas: string[] = [];
	// 추적 ref 는 **fetch URL** 의 사실이다 — 훅이 보내는 URL($2)을 받았으면 쓰지 않는다: push URL 이 둘(GitHub·NAS)이면
	// GitHub 에만 있는 커밋을 NAS 로 보낼 때 «이미 게시됨» 으로 빠져 비밀 스윕을 건너뛴다(4.1.4 후보 리뷰 P0).
	// URL 이 있는데 ls-remote 를 못 읽으면 덜 뺀다(더 많이 스캔한다 · 상한을 넘으면 막힌다) — 다른 URL 의 사실로 메우지 않는다.
	const scope = url !== null && url !== "" ? null : remoteScope(root, remote);
	if (scope !== null) {
		const r = git(root, ["rev-parse", scope]);
		if (r.status === 0)
			shas.push(
				...(r.stdout ?? "")
					.split("\n")
					.filter((x) => /^[0-9a-f]{40,64}$/.test(x.trim()))
					.map((x) => x.trim()),
			);
	}
	const target = url !== null && url !== "" ? url : remote;
	let lsFailed = false;
	if (target !== null && target !== "") {
		const listed = lsRemote(root, target);
		if (listed === null) lsFailed = true;
		else
			shas.push(
				...localCommitish(
					root,
					listed.map((r) => r.sha),
				),
			);
	}
	return { shas: [...new Set(shas)], lsFailed };
}

/**
 * `wip/*` push — 원격에 아직 없는 커밋들의 추가된 줄을 비밀 스윕한다. `remote` 는 git 이 훅에 준 원격 이름($1) · `url` 은
 * **실제로 보내는 URL**($2) — 그 원격의 추적 ref · 그 URL 의 `ls-remote` · 줄의 remote sha 를 범위에서 뺀다(다른 원격에만 있는
 * 커밋을 «이미 게시됨» 으로 치지 않는다 · 4.1.4: URL 로 직접 보내도 원격에 있는 히스토리를 다시 세지 않는다).
 */
export function judgeWipPush(
	root: string,
	lines: readonly PushLine[],
	remote: string | null = null,
	maxCommits: number = MAX_WIP_COMMITS,
	url: string | null = null,
): PushVerdict {
	const label = pushLabel(lines);
	const undeclared: string[] = [];
	let scannedBlocks = 0;
	let scannedCommits = 0;
	let published: ReturnType<typeof publishedExclusions> | undefined;
	for (const l of lines) {
		if (ZERO_SHA.test(l.localSha)) {
			// 삭제 push — 보낼 내용은 없지만 **지워질 내용**이 있다(리뷰 P0 · 4.1.3): 원격 끝이 main·보관 태그에 없으면 막는다.
			const loss = deletionLoss(root, l, remote, url);
			if (loss !== null) return { allow: false, message: `⛔ ${label} — ${loss}` };
			continue;
		}
		let allowed: Set<string>;
		try {
			allowed = allowlistAt(root, l.localSha);
		} catch (e) {
			return {
				allow: false,
				message: `⛔ ${label} — 보내는 커밋의 비밀 스윕 선언이 손상됐다(${(e as Error).message}) · 판정 불능은 통과가 아니다`,
			};
		}
		published ??= publishedExclusions(root, remote, url);
		const excl: string[] = [...published.shas];
		if (
			!ZERO_SHA.test(l.remoteSha) &&
			git(root, ["cat-file", "-e", `${l.remoteSha}^{commit}`]).status === 0
		)
			excl.push(l.remoteSha);
		// 뺄 것이 수천 개일 수 있다(보관 태그·브랜치) — 명령줄이 아니라 stdin 으로 준다(`^sha`).
		const revInput = `${[l.localSha, ...new Set(excl)].map((sha, i) => (i === 0 ? sha : `^${sha}`)).join("\n")}\n`;
		const count = git(root, ["rev-list", "--count", "--stdin"], revInput);
		const n = Number((count.stdout ?? "").trim());
		if (count.status !== 0 || !Number.isFinite(n))
			return {
				allow: false,
				message: `⛔ ${label} — 보낼 커밋을 셀 수 없다(${l.localRef}) · 판정 불능은 통과가 아니다`,
			};
		if (n > maxCommits)
			return {
				allow: false,
				message: `⛔ ${label} — 원격에 없는 커밋이 ${n}개다(상한 ${maxCommits}) · ${
					published.lsFailed
						? `보내는 원격(${url ?? remote})의 ref 목록을 읽지 못했고(ls-remote 실패) 추적 ref 도 없거나 낡았다`
						: "원격 추적 ref 가 없거나 낡았다"
				} → \`git fetch ${remote ?? "<원격>"}\` 뒤 다시 · 전체 히스토리를 훑지 않는다(판정 불능은 통과가 아니다)`,
			};
		scannedCommits += n;
		const log = git(
			root,
			[
				"log",
				"-p",
				"--no-color",
				"--no-ext-diff",
				"--no-textconv",
				"--no-renames",
				"--diff-merges=cc",
				// 사용자 설정 `log.showRoot=false` 면 루트 커밋의 diff 가 빠져 그 내용이 스캔 없이 나간다(리뷰 dA P2).
				"--root",
				"--format=commit %H",
				"--stdin",
			],
			revInput,
		);
		if (log.status !== 0 || log.error)
			return {
				allow: false,
				message: `⛔ ${label} — 보낼 커밋의 패치를 못 읽었다(${l.localRef}) · 판정 불능은 통과가 아니다`,
			};
		const { blocks, binaries } = collectAdded(log.stdout ?? "");
		const bodies = readBlobs(
			root,
			binaries.map((b) => `${b.commit}:${b.file}`),
		);
		const unreadable = binaries.filter((_, i) => bodies[i] === null).map((b) => b.file);
		if (unreadable.length > 0)
			return {
				allow: false,
				message: `⛔ ${label} — 읽지 못한 바이너리 ${unreadable.length}개(${unreadable.slice(0, 3).join(" · ")}) · 판정 불능은 통과가 아니다`,
			};
		const all: AddedBlock[] = [
			...blocks,
			...binaries.map((b, i) => ({ commit: b.commit, file: b.file, text: bodies[i] ?? "" })),
		];
		scannedBlocks += all.length;
		for (const b of all)
			for (const h of scanSecrets(b.text))
				if (!allowed.has(`${b.file}::${h.id}`))
					undeclared.push(`${b.file} [${h.id}] @${b.commit.slice(0, 8)}`);
	}
	if (undeclared.length > 0)
		return {
			allow: false,
			message:
				`⛔ ${label} — 선언되지 않은 시크릿 모양 ${undeclared.length}건:\n` +
				undeclared
					.slice(0, MAX_LISTED)
					.map((u) => `    ${u}`)
					.join("\n") +
				(undeclared.length > MAX_LISTED ? `\n    … 외 ${undeclared.length - MAX_LISTED}건` : "") +
				"\n  실제 시크릿이면 즉시 회전하고 그 커밋에서 뺀다(나중 커밋에서 지워도 앞 커밋은 게시된다) · 픽스처면 사유와 함께 선언을 커밋한다",
		};
	return {
		allow: true,
		message: `✓ ${label} — 원격에 없는 커밋 ${scannedCommits}개의 추가 내용 ${scannedBlocks}건 비밀 스윕 통과(통합 후보가 아니다 · main 통합은 여전히 풀 영수증)${
			remote === null || remote === ""
				? "\n  ⚠ 원격 이름을 못 받았다(옛 래퍼 · 손으로 부름) — 모든 원격의 추적 ref 를 «이미 게시됨» 으로 뺐다 → `bun run modfolio:install-guards`"
				: ""
		}`,
	};
}

/** 이 repo 의 git pre-push 훅이 무엇인가 — 우리 래퍼(ref 목록을 받는다) · 체인(못 받는다) · 남의 것 · 없음. */
export function gitPrePushMode(root: string): "wrapper" | "chain" | "foreign" | "none" {
	const r = git(root, ["rev-parse", "--git-path", "hooks/pre-push"]);
	if (r.status !== 0) return "none";
	const path = resolve(root, (r.stdout ?? "").trim());
	if (!existsSync(path)) return "none";
	// git 은 실행 비트가 없는 훅을 돌리지 않는다 — 표식만 보고 «래퍼» 라 하면 가드가 아무도 안 보는 곳에 판정을 넘긴다(리뷰 dA P2).
	if (process.platform !== "win32") {
		try {
			if ((statSync(path).mode & 0o111) === 0) return "none";
		} catch {
			return "none";
		}
	}
	let text: string;
	try {
		text = readFileSync(path, "utf8");
	} catch {
		return "none";
	}
	if (text.includes(GIT_HOOK_CHAIN_BEGIN)) return "chain";
	return text.includes(GIT_HOOK_MARKER) ? "wrapper" : "foreign";
}

/**
 * 명령줄에서 읽은 대상이 스윕 규칙(wip 브랜치 · 보관 태그 · main 아닌 브랜치 삭제)으로 **보이는가** — Claude 쪽 가드가
 * 판정을 git 훅에 넘길지 정할 때만 쓴다. 틀려도 안전하다: git 훅이 실제 ref(`isSweepOnlyPush`)로 다시 가른다.
 */
export function looksLikeSweepOnlyPush(
	root: string,
	targets: { readonly refspecs: readonly string[]; readonly deletion: boolean },
): boolean {
	if (looksLikeWipPush(root, targets)) return true;
	if (targets.refspecs.length === 0) return false;
	return targets.refspecs.every((raw) => {
		const spec = raw.replace(/^\+/, "");
		const deleting = targets.deletion || spec.startsWith(":");
		const dst = spec.includes(":") ? spec.slice(spec.indexOf(":") + 1) : spec;
		if (deleting) {
			const name = dst.replace(/^refs\/heads\//, "");
			return (
				name !== "" &&
				name !== "HEAD" &&
				name !== "main" &&
				name !== "master" &&
				!name.startsWith("refs/tags/")
			);
		}
		return /^(refs\/tags\/)?archive\//.test(dst);
	});
}

/**
 * 명령줄에서 읽은 대상이 wip 브랜치로 **보이는가** — Claude 쪽 가드가 판정을 git 훅에 넘길지 정할 때만 쓴다.
 * 틀려도 안전하다: 넘긴 뒤 git 훅이 실제 ref 로 다시 가른다.
 */
export function looksLikeWipPush(
	root: string,
	targets: { readonly refspecs: readonly string[]; readonly deletion: boolean },
): boolean {
	const current = (): string => {
		const r = git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
		return r.status === 0 ? (r.stdout ?? "").trim() : "";
	};
	const specs = targets.refspecs.length > 0 ? targets.refspecs : [current()];
	if (specs.length === 0) return false;
	return specs.every((raw) => {
		const spec = raw.replace(/^\+/, "");
		const dst = spec.includes(":") ? spec.slice(spec.indexOf(":") + 1) : spec;
		const name = (dst === "HEAD" || dst === "" ? current() : dst).replace(/^refs\/heads\//, "");
		return name.startsWith("wip/");
	});
}
