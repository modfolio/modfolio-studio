/**
 * scripts/lib/signal-ledger.ts — **신호 원장**(하네스 진화 계획 WP-A · 4.1.9). 게이트 러너의 단계 결과와 가드 훅의 판정을
 * **기기 안 · 저장소 밖** append 원장에 남긴다. 이 모듈은 쓰는 쪽과 그것을 검사하는 데 필요한 최소의 읽는 쪽이다 —
 * 수용 판정·집계는 이 릴리스의 몫이 아니다(계획 §4: 4.1.9 = 새 저장 형식 1 · 쓰기만).
 *
 * ## 형식
 *
 * 위치 `~/.modfolio/signals/<repo>/<YYYYMMDD>-<shard>.jsonl` — 한 줄 한 행(JSON).
 * - **샤드 = 쓰는 프로세스**: 게이트 러너는 자기 pid, 가드는 자기를 부른 에이전트 프로세스(ppid · `MODFOLIO_SIGNAL_SHARD` 가
 *   있으면 그것). 가드는 도구 호출마다 새 프로세스라 자기 pid 로 샤드를 만들면 행 하나에 파일 하나가 된다. 한 샤드에 동시에
 *   쓰는 것은 한 세션의 병렬 가드뿐이고, 행은 `PIPE_BUF`(4096) 보다 훨씬 짧은 `O_APPEND` 한 번이라 섞이지 않는다.
 *   여러 워크트리·세션은 서로 다른 샤드에 쓴다 — 읽는 쪽이 샤드를 합친다(계획 G-8).
 * - **게이트 행**(`kind: "gate"`): 단계마다 한 행 + 판정에 이른 실행은 끝에 `step: "run"` 종료 행 하나.
 *   종료 행이 없는 runId 는 **중단된 실행**이다(SIGKILL 은 아무것도 못 남긴다 — 그래서 «없음» 이 곧 증거다).
 * - **가드 행**(`kind: "guard"`): 가드 프로세스 하나에 한 행. `allow` 도 센다 — 노출 분모가 있어야 «재발률» 과 «발화 0» 이
 *   성립한다(계획 C-3·C-10). 원시 `head`·트리·명령·경로·세션 id 는 싣지 않는다(C-7) — `sessionKey` 는 기기 안의 소금(30일마다
 *   바뀐다)으로 세션 id 를 해시한 것이라 30일이 지나면 서로 이을 수 없다.
 *
 * ## 필드 규율
 *
 * `step`·`guard`·`class`·`gate`·`repo` 는 `^[a-z0-9:_-]+$` 의 **선언된 값**만 — 비허용 문자를 담은 id 는 쓰기 전에
 * 던진다(호출자 결함 · 테스트 exit 1). 자유 텍스트 필드는 없다. 보존 180일(`pruneSignals`), 삭제는 디렉터리 하나.
 *
 * ⚠ 이 파일은 멤버에 `.claude/lib/` 로 배달된다(`SHARED_PARENT_LIBS`) — 가드가 `../lib/signal-ledger.ts` 로 import 한다.
 *   node 내장 밖을 import 하지 않는다(`shared-import-closure.test.ts`).
 */

import { createHash, randomBytes } from 'node:crypto';
import {
  appendFileSync,
  existsSync,
  linkSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** id 필드의 허용 문자. 동적으로 합성한 문자열(경로·명령·사람 말)이 들어오면 여기서 걸린다. */
export const SIGNAL_ID_RE = /^[a-z0-9:_-]+$/;

/** 보존 기간(일). 이보다 오래된 샤드는 `pruneSignals` 가 지운다. */
export const RETENTION_DAYS = 180;

/** 세션 키 소금의 수명(일). 지나면 새 소금 — 그 전후의 sessionKey 는 이을 수 없다. */
export const SALT_DAYS = 30;

export const GATE_OUTCOMES = ['pass', 'fail', 'undecidable', 'skipped'] as const;
export const GUARD_OUTCOMES = ['allow', 'warn', 'block'] as const;
export const GATES = ['quick', 'full', 'release', 'weekly'] as const;

export type GateOutcome = (typeof GATE_OUTCOMES)[number];

/** 게이트 종료 행의 예약 `step`. 같은 이름의 단계는 러너가 해시 id 로 바꾼다(`stepSignalId`). */
export const RUN_STEP = 'run';
export type GuardOutcome = (typeof GUARD_OUTCOMES)[number];
export type GateName = (typeof GATES)[number];

export interface GateRow {
  readonly kind: 'gate';
  readonly ts: string;
  readonly repo: string;
  /** 이 실행의 무작위 id — 같은 실행의 단계 행과 종료 행을 묶는다. */
  readonly runId: string;
  /** 같은 `treeOid`·같은 gate 에서 이 실행이 몇 번째인가(1부터 · 최근 `ATTEMPT_WINDOW_DAYS` 일의 샤드 기준). */
  readonly attempt: number;
  readonly gate: GateName;
  /** 이 실행이 고른 단계 수(좁히기·tier 반영 뒤). */
  readonly selected: number;
  /** 고른 단계를 전부 돌렸나. 단계 행에서는 «그 시점까지» 라 늘 false, 종료 행에서만 판정이 담긴다. */
  readonly completed: boolean;
  /** 단계 이름(체인 선언의 값) 또는 종료 행의 `run`. */
  readonly step: string;
  readonly outcome: GateOutcome;
  readonly durationMs: number;
  /**
   * 원 종료 코드. 단계 행 = 그 단계의 코드(0 이 아니면 outcome 은 `fail` — 2 를 판정 불능으로 단정하지 않는다),
   * 종료 행 = 러너가 낸 코드(0·1·2), `skipped` = null.
   */
  readonly exitCode: number | null;
  /** `.modfolio/project.json` 의 `policyDigest`. 못 읽으면 null(«모른다» — 빈 문자열로 접지 않는다). */
  readonly policyDigest: string | null;
  /** 작업 트리 내용 OID(`contentTree`). 못 쟀으면 null. */
  readonly treeOid: string | null;
}

export interface GuardRow {
  readonly kind: 'guard';
  readonly ts: string;
  readonly repo: string;
  readonly sessionKey: string;
  readonly guard: string;
  /** 정규화된 사건 계급 — 가드가 선언한 정적 값. 통과는 `none`. */
  readonly class: string;
  readonly outcome: GuardOutcome;
}

export type SignalRow = GateRow | GuardRow;

/** 신호 원장의 뿌리. 테스트·격리 실행은 `MODFOLIO_SIGNALS_HOME` 으로 옮긴다(실 원장을 시험 행으로 더럽히지 않는다). */
export function signalsRoot(env: NodeJS.ProcessEnv = process.env, home = homedir()): string {
  const o = env.MODFOLIO_SIGNALS_HOME;
  return o !== undefined && o !== '' ? o : join(home, '.modfolio', 'signals');
}

export function assertSignalId(field: string, value: string): void {
  if (!SIGNAL_ID_RE.test(value))
    throw new Error(
      `signal-ledger: ${field}=${JSON.stringify(value)} 는 ${SIGNAL_ID_RE} 가 아니다 — 선언된 정적 값만 싣는다`,
    );
}

/** repo 이름을 id 규율에 맞춘다 — 폴더 이름은 사람이 짓는 것이라 대문자·점이 올 수 있다. 결과가 비면 던진다. */
export function normalizeRepo(name: string): string {
  const n = name
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  assertSignalId('repo', n);
  return n;
}

function yyyymmdd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

export function shardPath(root: string, repo: string, now: Date, shard: string): string {
  assertSignalId('shard', shard);
  return join(root, repo, `${yyyymmdd(now)}-${shard}.jsonl`);
}

function validate(row: SignalRow): void {
  assertSignalId('repo', row.repo);
  if (row.kind === 'gate') {
    assertSignalId('step', row.step);
    assertSignalId('runId', row.runId);
    if (!(GATES as readonly string[]).includes(row.gate))
      throw new Error(`signal-ledger: gate=${row.gate} 는 ${GATES.join('|')} 가 아니다`);
    if (!(GATE_OUTCOMES as readonly string[]).includes(row.outcome))
      throw new Error(
        `signal-ledger: outcome=${row.outcome} 는 ${GATE_OUTCOMES.join('|')} 가 아니다`,
      );
    if (!Number.isInteger(row.attempt) || row.attempt < 1)
      throw new Error(`signal-ledger: attempt=${row.attempt} 는 1 이상의 정수여야 한다`);
    if (!Number.isInteger(row.selected) || row.selected < 0)
      throw new Error(`signal-ledger: selected=${row.selected} 는 0 이상의 정수여야 한다`);
    if (row.policyDigest !== null) assertSignalId('policyDigest', row.policyDigest);
    if (row.treeOid !== null) assertSignalId('treeOid', row.treeOid);
  } else {
    assertSignalId('guard', row.guard);
    assertSignalId('class', row.class);
    assertSignalId('sessionKey', row.sessionKey);
    if (!(GUARD_OUTCOMES as readonly string[]).includes(row.outcome))
      throw new Error(
        `signal-ledger: outcome=${row.outcome} 는 ${GUARD_OUTCOMES.join('|')} 가 아니다`,
      );
  }
}

/**
 * 한 행을 샤드에 덧붙인다. 검증 실패는 **던진다**(호출자 결함 — 조용히 고쳐 쓰지 않는다).
 * 쓰기 실패(디스크·권한)도 던진다 — 계측 실패를 성공이나 0 으로 접지 않는 것은 호출자의 몫이고, 호출자는 그것을 «미기록» 으로 말한다.
 */
export function appendSignal(
  row: SignalRow,
  opts: { readonly shard: string; readonly root?: string; readonly now?: Date },
): string {
  validate(row);
  const root = opts.root ?? signalsRoot();
  const path = shardPath(root, row.repo, opts.now ?? new Date(row.ts), opts.shard);
  mkdirSync(join(root, row.repo), { recursive: true, mode: 0o700 });
  appendFileSync(path, `${JSON.stringify(row)}\n`, { mode: 0o600 });
  return path;
}

/** 소금 기간 번호 — epoch 부터 `SALT_DAYS` 일 단위. 같은 기간의 모든 프로세스는 같은 소금 파일을 본다. */
export function saltPeriod(now: Date): number {
  return Math.floor(now.getTime() / (SALT_DAYS * 86_400_000));
}

/**
 * 세션 id → 기기 안 세션 키. 소금은 기간마다 한 파일(`<root>/.session-salt-<기간>` · 0600)이고 기간이 바뀌면 새 소금이다 —
 * 기간이 다른 키는 서로 이을 수 없다(최대 `SALT_DAYS` 일). 소금 파일은 다음 기간이 끝날 때까지 남고(앞 기간 프로세스 보호)
 * 그 뒤 지워진다 — 키를 다시 계산할 수 있는 기간은 최대 `2 × SALT_DAYS` 일이다.
 *
 * ⚠ 동시 생성(리뷰 P2): 같은 세션의 병렬 가드가 처음 소금을 만들 때 각자 다른 소금을 쓰면 한 세션이 여러 키로 갈라진다.
 *   그래서 이름을 기간으로 고정하고, 임시 파일을 다 쓴 뒤 `link` 로 붙인다 — `link` 는 이미 있으면 EEXIST 로 실패하는 원자
 *   연산이라 이긴 하나만 남고, 보이는 순간 내용이 완전하다. 진 쪽은 이긴 소금을 읽는다.
 *
 * 세션 id 가 없으면 `unknown` — 가짜 키를 지어내지 않는다.
 */
export function sessionKey(
  sessionId: string | undefined,
  root = signalsRoot(),
  now = new Date(),
): string {
  if (sessionId === undefined || sessionId === '') return 'unknown';
  const period = saltPeriod(now);
  const path = join(root, `.session-salt-${period}`);
  let salt = readSalt(path);
  if (salt === null) {
    mkdirSync(root, { recursive: true, mode: 0o700 });
    const tmp = `${path}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
    writeFileSync(tmp, randomBytes(16).toString('hex'), { mode: 0o600 });
    try {
      linkSync(tmp, path);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
    } finally {
      rmSync(tmp, { force: true });
    }
    salt = readSalt(path);
    if (salt === null) throw new Error(`signal-ledger: 소금 ${path} 를 읽지 못했다`);
    // 두 기간 전의 소금부터 지운다 — 남겨 두면 키를 다시 계산할 수 있어 «기간이 지나면 이을 수 없다» 가 거짓이 된다.
    // 바로 앞 기간은 한 기간 늦게 지운다(후속 P2): 경계 직전에 시각을 잰 프로세스가 아직 그 소금을 읽는데, 여기서 지우면
    // 그 프로세스가 앞 기간 소금을 새로 만들어 같은 세션이 두 키로 갈라진다. 이 기간보다 뒤(시계 어긋남)는 건드리지 않는다.
    for (const f of readdirSync(root)) {
      const m = /^\.session-salt-(\d+)$/.exec(f);
      if (m && Number(m[1]) < period - 1) rmSync(join(root, f), { force: true });
    }
  }
  return createHash('sha256').update(`${salt}:${sessionId}`).digest('hex').slice(0, 16);
}

function readSalt(path: string): string | null {
  try {
    const v = readFileSync(path, 'utf8').trim();
    return /^[0-9a-f]{32}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

/** 이 repo 의 샤드 파일(최근 `days` 일 · 이름의 날짜 기준). 디렉터리가 없으면 빈 배열. */
export function shardFiles(
  repo: string,
  root = signalsRoot(),
  days?: number,
  now = new Date(),
): string[] {
  const dir = join(root, repo);
  if (!existsSync(dir)) return [];
  const floor = days === undefined ? null : yyyymmdd(new Date(now.getTime() - days * 86_400_000));
  return readdirSync(dir)
    .filter((f) => /^\d{8}-[a-z0-9:_-]+\.jsonl$/.test(f))
    .filter((f) => floor === null || f.slice(0, 8) >= floor)
    .sort()
    .map((f) => join(dir, f));
}

/** 샤드를 합쳐 읽는다. 깨진 줄은 버리지 않고 `broken` 으로 센다(«없음» 으로 접지 않는다). */
export function readSignals(
  repo: string,
  root = signalsRoot(),
  days?: number,
  now = new Date(),
): { readonly rows: SignalRow[]; readonly broken: number } {
  const rows: SignalRow[] = [];
  let broken = 0;
  for (const f of shardFiles(repo, root, days, now)) {
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      if (line.trim() === '') continue;
      try {
        const r = JSON.parse(line) as SignalRow;
        if (r.kind === 'gate' || r.kind === 'guard') rows.push(r);
        else broken++;
      } catch {
        broken++;
      }
    }
  }
  return { rows, broken };
}

/** attempt 를 셀 때 보는 기간 — 같은 트리가 이보다 오래 남는 일은 드물고, 매 게이트마다 180일치를 읽지 않는다. */
export const ATTEMPT_WINDOW_DAYS = 14;

/** 같은 gate·treeOid 로 이미 기록된 실행 수 + 1. treeOid 를 모르면 1(이을 수 없다). */
export function nextAttempt(
  repo: string,
  gate: GateName,
  treeOid: string | null,
  root = signalsRoot(),
  now = new Date(),
): number {
  if (treeOid === null) return 1;
  const runs = new Set<string>();
  for (const r of readSignals(repo, root, ATTEMPT_WINDOW_DAYS, now).rows)
    if (r.kind === 'gate' && r.gate === gate && r.treeOid === treeOid) runs.add(r.runId);
  return runs.size + 1;
}

export interface GateRunSummary {
  readonly runId: string;
  readonly gate: GateName;
  readonly selected: number;
  readonly stepRows: number;
  /** 종료 행이 있고 그 행이 completed=true 인가. 종료 행이 없으면(중단) false. */
  readonly completed: boolean;
  /** 종료 행의 판정. 종료 행이 없으면 null(«중단 — 판정 없음»). */
  readonly outcome: GateOutcome | null;
}

/** 게이트 행을 실행 단위로 묶는다. */
export function summarizeGateRuns(rows: readonly SignalRow[]): GateRunSummary[] {
  const by = new Map<string, GateRow[]>();
  for (const r of rows) if (r.kind === 'gate') by.set(r.runId, [...(by.get(r.runId) ?? []), r]);
  return [...by.entries()].map(([runId, rs]) => {
    const end = rs.find((r) => r.step === RUN_STEP);
    const first = rs[0] as GateRow;
    return {
      runId,
      gate: first.gate,
      selected: first.selected,
      stepRows: rs.filter((r) => r.step !== RUN_STEP).length,
      completed: end?.completed === true,
      outcome: end?.outcome ?? null,
    };
  });
}

/** `RETENTION_DAYS` 보다 오래된 샤드를 지운다. 지운 파일 수를 돌려준다. */
export function pruneSignals(root = signalsRoot(), now = new Date()): number {
  if (!existsSync(root)) return 0;
  const floor = yyyymmdd(new Date(now.getTime() - RETENTION_DAYS * 86_400_000));
  let n = 0;
  for (const repo of readdirSync(root, { withFileTypes: true })) {
    if (!repo.isDirectory()) continue;
    for (const f of readdirSync(join(root, repo.name)))
      if (/^\d{8}-/.test(f) && f.slice(0, 8) < floor) {
        rmSync(join(root, repo.name, f), { force: true });
        n++;
      }
  }
  return n;
}
