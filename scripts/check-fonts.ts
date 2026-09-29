// Deterministic integrity check for the committed @modfolio/fonts output.
//
// The woff2 files are generated on the owner machine from source fonts that are
// not in this repository, so no gate can regenerate them here. What can be
// checked without the sources is that the committed output is self-consistent —
// and that is exactly what the review packet points reviewers at instead of the
// binary diff (.modfolio/project.json review.generatedOutputs):
//
//   1. every file under <static>/fonts/ (except the manifest) carries its own
//      content hash in its name (sha256, first 10 hex — @modfolio/fonts hash.js)
//   2. fonts/fonts-manifest.json lists exactly the files that are on disk
//   3. the generated href module names the manifest's CSS and existing files
//   4. every url() in the hashed CSS resolves to a file on disk
//   5. _headers makes every hashed file immutable — and never the manifest, whose
//      name does not change when its content does
//
// The manifest lives inside fonts/ (`--manifest`) so the whole generated output
// sits under the declared folders; the generator then writes per-file immutable
// rules instead of `/fonts/*`, which is what check 5 accepts.
//
// Exit 1 on any violation, 2 when an app's output cannot be found (undecidable).

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const APPS = [
	{
		name: "landing",
		staticDir: "apps/landing/public",
		hrefModule: "apps/landing/src/fonts-href.ts",
		headers: "apps/landing/public/_headers",
	},
	{
		name: "app",
		staticDir: "apps/app/static",
		hrefModule: "apps/app/src/lib/fonts-href.ts",
		headers: "apps/app/_headers",
	},
];

const MANIFEST = "fonts-manifest.json";
const root = new URL("..", import.meta.url).pathname;
const problems: string[] = [];
let undecidable = false;

for (const app of APPS) {
	const fontsDir = join(root, app.staticDir, "fonts");
	const manifestPath = join(fontsDir, MANIFEST);
	if (!existsSync(fontsDir) || !existsSync(manifestPath)) {
		console.error(`✗ ${app.name}: ${app.staticDir}/fonts 또는 fonts-manifest.json 이 없다 (판정 불능)`);
		undecidable = true;
		continue;
	}
	const onDisk = readdirSync(fontsDir)
		.filter((f) => f !== MANIFEST)
		.sort();
	if (onDisk.length === 0) {
		console.error(`✗ ${app.name}: ${app.staticDir}/fonts 가 비었다 (판정 불능)`);
		undecidable = true;
		continue;
	}

	// 1. name ↔ content hash
	for (const file of onDisk) {
		const m = /\.([0-9a-f]{10})\.(woff2|css)$/.exec(file);
		if (!m) {
			problems.push(`${app.name}: ${file} — 해시 없는 이름(immutable 이 거짓이 된다)`);
			continue;
		}
		const digest = createHash("sha256")
			.update(readFileSync(join(fontsDir, file)))
			.digest("hex")
			.slice(0, 10);
		if (digest !== m[1]) problems.push(`${app.name}: ${file} — 내용 해시 ${digest} ≠ 이름 ${m[1]}`);
	}

	// 2. manifest ↔ disk
	const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
		cssHref: string;
		files: { name: string }[];
	};
	const cssName = manifest.cssHref.replace(/^\/fonts\//, "");
	const listed = [...manifest.files.map((f) => f.name), cssName].sort();
	for (const f of listed) if (!onDisk.includes(f)) problems.push(`${app.name}: 매니페스트의 ${f} 가 디스크에 없다`);
	for (const f of onDisk) if (!listed.includes(f)) problems.push(`${app.name}: 디스크의 ${f} 가 매니페스트에 없다(고아)`);

	// 3. href module ↔ manifest
	const mod = readFileSync(join(root, app.hrefModule), "utf8");
	const cssHref = /fontsCssHref\s*=\s*"([^"]+)"/.exec(mod)?.[1];
	if (cssHref !== manifest.cssHref)
		problems.push(`${app.name}: ${app.hrefModule} 의 fontsCssHref(${cssHref}) ≠ 매니페스트(${manifest.cssHref})`);
	const preloads = [...(/fontPreloads\s*=\s*\[([^\]]*)\]/.exec(mod)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map(
		(p) => p[1] ?? "",
	);
	for (const p of preloads)
		if (!onDisk.includes(p.replace(/^\/fonts\//, ""))) problems.push(`${app.name}: preload ${p} 가 디스크에 없다`);

	// 4. css url() → files
	if (onDisk.includes(cssName)) {
		const css = readFileSync(join(fontsDir, cssName), "utf8");
		for (const [, url] of css.matchAll(/url\("?([^")]+)"?\)/g)) {
			const name = (url ?? "").replace(/^(?:\/fonts\/|\.\/)/, "");
			if (!onDisk.includes(name)) problems.push(`${app.name}: ${cssName} 의 url(${url}) 가 디스크에 없다`);
		}
	}

	// 5. immutable cache rules: each hashed file (or a /fonts/* wildcard, which is
	//    only honest when nothing unhashed shares the folder)
	const headers = existsSync(join(root, app.headers)) ? readFileSync(join(root, app.headers), "utf8") : "";
	const immutable = new Set(
		[...headers.matchAll(/^(\/\S+)\s*\n\s+Cache-Control:[^\n]*immutable/gm)].map((m) => m[1] ?? ""),
	);
	if (immutable.has("/fonts/*"))
		problems.push(`${app.name}: /fonts/* 가 immutable 인데 폴더에 해시 없는 ${MANIFEST} 가 있다`);
	for (const f of onDisk)
		if (!immutable.has(`/fonts/${f}`) && !immutable.has("/fonts/*"))
			problems.push(`${app.name}: ${app.headers} 에 /fonts/${f} immutable 규칙이 없다`);
	if (immutable.has(`/fonts/${MANIFEST}`))
		problems.push(`${app.name}: ${MANIFEST} 가 immutable 이다(내용이 바뀌어도 이름이 같다)`);

	console.log(`· ${app.name}: 파일 ${onDisk.length}개 · preload ${preloads.length}개`);
}

if (problems.length > 0) {
	console.error(`✗ check:fonts — 위반 ${problems.length}건`);
	for (const p of problems) console.error(`  ${p}`);
	process.exit(1);
}
if (undecidable) process.exit(2);
console.log("✓ check:fonts — 생성 글꼴 산출물이 자기 일관적이다");
