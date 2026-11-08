// README용 SVG 카드를 라이트/다크 두 벌로 만들고 README.md까지 생성합니다.
// 내용을 고치려면 아래 DATA만 수정한 뒤 `node scripts/build.mjs`를 실행하세요.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const DATA = {
  handle: "heetae2007",
  name: "채희태",
  englishName: "Heetae Chae",
  title: "Cloud HIS 운영/개발자 @ ezcaretech",
  tagline: ["병원 행정의 반복 업무를", "코드로 옮기는 개발자입니다."],
  site: "https://heetae2007.github.io/heetae/",
  email: "heetae2007@gmail.com",
  intro:
    "ezcaretech에서 클라우드 병원정보시스템(HIS)을 운영하고 개발합니다. 매일 같은 화면을 반복해서 확인하는 일을 보면, 자동화로 덜어낼 방법부터 찾습니다.",
  cron: [
    ["*/5 * * * *", "hira_watch.py"],
    ["0 9 * * 1-5", "sheet_to_notion.gs"],
    ["*/10 * * * *", "zendesk_triage.py"],
  ],
  log: [
    ["09:00", "✓", "티켓 14건 → notion"],
    ["09:05", "✓", "새 고시 2건 → telegram"],
    ["09:10", "·", "분류 대기 3건"],
  ],
  work: [
    {
      slug: "hira",
      title: "심평원 고시 알리미",
      lines: ["심평원 RSS · 요양기관 업무포털 · e-Form 공지를 5분마다 확인해", "새 글만 텔레그램으로 보내는 자동화 서버."],
      stack: ["Python", "Playwright", "SQLite", "Telegram"],
      repo: "https://github.com/heetae2007/Hira_Web_Crawler",
    },
    {
      slug: "notion",
      title: "시트에서 노션으로",
      lines: ["월별 탭에 흩어진 병원 요청 티켓을 티켓번호 기준으로 모아", "노션 데이터베이스 하나로 동기화하는 Apps Script."],
      stack: ["Apps Script", "Notion API"],
      repo: "https://github.com/heetae2007/GoogleSheet_Notion_Appscript",
    },
    {
      slug: "zendesk",
      title: "Zendesk 자동화",
      wip: true,
      lines: ["병원 Zendesk 티켓을 분류하고 반복 문의를 자동으로 태깅해,", "사람이 답해야 할 티켓에 시간을 쓰도록 만드는 중."],
      stack: ["Python", "Zendesk API"],
      repo: "https://github.com/heetae2007/zendesk_auto",
    },
  ],
  stack: [
    ["languages", ["Python", "C#", "JavaScript"]],
    ["frameworks", ["Ember.js", "Google Apps Script"]],
    ["cloud & infra", ["AWS", "GCP", "Ubuntu", "cron"]],
    ["tools & apis", ["Playwright", "Telegram Bot API", "Notion API", "Zendesk API", "Git"]],
  ],
};

const THEMES = {
  light: {
    bg: "#fbfaf7", panel: "#f2f0ea", ink: "#1b1d22", muted: "#6b7080",
    line: "#e3e0d8", accent: "#0a8f6a", accentSoft: "#0a8f6a22", trace: "#0a8f6a",
  },
  dark: {
    bg: "#0f141a", panel: "#161c24", ink: "#e6edf3", muted: "#8b949e",
    line: "#262e39", accent: "#3ddc97", accentSoft: "#3ddc9726", trace: "#3ddc97",
  },
};

const SANS = `-apple-system,BlinkMacSystemFont,'Segoe UI','Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif`;
const MONO = `ui-monospace,SFMono-Regular,Menlo,Consolas,'D2Coding',monospace`;
const W = 840;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// 고정폭 글꼴에서 라틴 문자는 0.6em, 한글은 1em으로 어림합니다.
// 비례폭 글꼴 어림값: 한글 1em, 그 외 0.56em.
const sansWidth = (s, size) => [...s].reduce((w, ch) => w + (/[\u3131-\uD7A3]/.test(ch) ? 1 : ch === " " ? 0.3 : 0.56) * size, 0);
const monoWidth = (s, size) => [...s].reduce((w, ch) => w + (/[ㄱ-힣]/.test(ch) ? 1 : 0.6) * size, 0);

function svg(w, h, title, body, t) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t">
<title id="t">${esc(title)}</title>
<style>
.s{font-family:${SANS}}.m{font-family:${MONO}}
.ink{fill:${t.ink}}.mu{fill:${t.muted}}.ac{fill:${t.accent}}
@keyframes trace{from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes logIn{0%{opacity:0;transform:translateY(4px)}8%,88%{opacity:1;transform:none}100%{opacity:0}}
.trace{animation:trace 4.8s linear infinite}
.blink{animation:blink 1.1s steps(1) infinite}
.pulse{animation:pulse 2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
${body}
</svg>
`;
}

// 심전도 파형: 평탄 → P파 → QRS → T파를 period마다 반복합니다.
function ecgPath(x0, x1, y, period = 190, amp = 1) {
  let d = `M${x0} ${y}`;
  for (let x = x0; x + period <= x1 + 0.1; x += period) {
    const a = (v) => (v * amp).toFixed(1);
    d += ` L${x + 70} ${y} q8 ${a(-9)} 16 0 L${x + 96} ${y} l5 ${a(7)} l8 ${a(-46)} l8 ${a(58)} l6 ${a(-19)}`
      + ` L${x + 140} ${y} q11 ${a(-14)} 22 0 L${x + period} ${y}`;
  }
  return d + ` L${x1} ${y}`;
}

function ecg(x0, x1, y, t, { period, amp, opacity = 1 } = {}) {
  const d = ecgPath(x0, x1, y, period, amp);
  return `<path d="${d}" fill="none" stroke="${t.line}" stroke-width="1.5" stroke-linejoin="round"/>
<path class="trace" d="${d}" pathLength="1000" fill="none" stroke="${t.trace}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="140 860" opacity="${opacity}"/>`;
}

function hero(t) {
  const H = 326;
  const px = 476, py = 34, pw = 330, ph = 222;
  const cron = DATA.cron.map(([expr, job], i) =>
    `<text x="${px + 18}" y="${py + 60 + i * 21}" class="m" font-size="12.5"><tspan class="mu">${esc(expr.padEnd(13))}</tspan><tspan class="ink">${esc(job)}</tspan></text>`).join("\n");
  const log = DATA.log.map(([time, mark, msg], i) =>
    `<g style="animation:logIn 7.5s ${i * 1.2}s ease-out infinite"><text x="${px + 18}" y="${py + 142 + i * 20}" class="m" font-size="12.5"><tspan class="mu">${time} </tspan><tspan class="ac">${esc(mark)} </tspan><tspan class="ink">${esc(msg)}</tspan></text></g>`).join("\n");
  const body = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="${t.bg}" stroke="${t.line}"/>
<circle class="pulse" cx="46" cy="58" r="4" fill="${t.accent}"/>
<text x="58" y="62" class="m mu" font-size="13">~/${esc(DATA.handle)}</text>
<text x="40" y="118" class="s ink" font-size="42" font-weight="700" letter-spacing="-1">${esc(DATA.name)}<tspan dx="14" class="mu" font-size="19" font-weight="500" letter-spacing="0">${esc(DATA.englishName)}</tspan></text>
<text x="40" y="150" class="s mu" font-size="15">${esc(DATA.title)}</text>
${DATA.tagline.map((l, i) => `<text x="40" y="${196 + i * 26}" class="s ink" font-size="18" font-weight="600">${esc(l)}</text>`).join("\n")}
<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="12" fill="${t.panel}" stroke="${t.line}"/>
<text x="${px + 18}" y="${py + 26}" class="m mu" font-size="12">$ crontab -l</text>
<circle class="pulse" cx="${px + pw - 46}" cy="${py + 22}" r="3.5" fill="${t.accent}"/>
<text x="${px + pw - 18}" y="${py + 26}" class="m ac" font-size="11" text-anchor="end">live</text>
${cron}
<line x1="${px + 18}" x2="${px + pw - 18}" y1="${py + 118}" y2="${py + 118}" stroke="${t.line}" stroke-dasharray="3 4"/>
${log}
<text x="${px + 18}" y="${py + 202}" class="m ac" font-size="12.5">$ <tspan class="blink">▍</tspan></text>
${ecg(24, W - 24, 296, t)}`;
  return svg(W, H, `${DATA.name} ${DATA.englishName}. ${DATA.title}. ${DATA.tagline.join(" ")} 오른쪽 터미널에는 5분마다 도는 자동화 crontab과 실행 로그가 보이고, 아래로 심전도 라인이 흐릅니다.`, body, t);
}

function button(label, icon) {
  const size = 13, h = 40;
  const w = Math.round(monoWidth(label, size) + 58);
  const render = (t) => svg(w, h, label, `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="20" fill="${t.bg}" stroke="${t.line}"/>
<g transform="translate(18 ${h / 2})" fill="none" stroke="${t.accent}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icon}</g>
<text x="38" y="${h / 2 + 4.5}" class="m ink" font-size="${size}">${esc(label)}</text>`, t);
  return { w, svg: render };
}

const ICONS = {
  site: `<circle cx="0" cy="0" r="7"/><path d="M-7 0h14M0-7c3 3.5 3 10.5 0 14M0-7c-3 3.5-3 10.5 0 14"/>`,
  mail: `<rect x="-7" y="-5" width="14" height="10" rx="1.5"/><path d="M-7-4l7 5 7-5"/>`,
};

function sectionHead(label, count, t) {
  const H = 56;
  const lw = monoWidth(label, 14);
  const body = `<text x="4" y="34" class="m ac" font-size="14">//</text>
<text x="28" y="34" class="m ink" font-size="14" font-weight="600">${esc(label)}</text>
<line x1="${40 + lw}" x2="${W - 56}" y1="29.5" y2="29.5" stroke="${t.line}"/>
<text x="${W - 4}" y="34" class="m mu" font-size="13" text-anchor="end">${esc(count)}</text>`;
  return svg(W, H, label, body, t);
}

function workCard(item, i, t) {
  const H = 132;
  const num = String(i + 1).padStart(2, "0");
  let tx = W - 28;
  const pills = [...item.stack].reverse().map((s) => {
    const w = monoWidth(s, 11.5) + 20;
    tx -= w;
    const out = `<rect x="${tx}" y="${H - 42}" width="${w}" height="22" rx="11" fill="none" stroke="${t.line}"/><text x="${tx + w / 2}" y="${H - 27}" class="m mu" font-size="11.5" text-anchor="middle">${esc(s)}</text>`;
    tx -= 6;
    return out;
  }).join("\n");
  const wip = item.wip
    ? `<rect x="0" y="-15" width="58" height="20" rx="10" fill="${t.accentSoft}"/><text x="29" y="-1" class="s ac" font-size="11.5" font-weight="600" text-anchor="middle">진행 중</text>`
    : "";
  const body = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="${t.bg}" stroke="${t.line}"/>
<rect x="0.5" y="22" width="3" height="${H - 44}" rx="1.5" fill="${t.accent}"/>
<text x="28" y="50" class="m ac" font-size="22" font-weight="600">${num}</text>
<text x="80" y="48" class="s ink" font-size="19" font-weight="700">${esc(item.title)}</text>
<g transform="translate(${Math.round(80 + sansWidth(item.title, 19) + 12)} 48)">${wip}</g>
<text x="${W - 28}" y="46" class="m mu" font-size="12" text-anchor="end">repo ↗</text>
${item.lines.map((l, j) => `<text x="80" y="${76 + j * 21}" class="s mu" font-size="14">${esc(l)}</text>`).join("\n")}
${pills}`;
  return svg(W, H, `${num} ${item.title}: ${item.lines.join(" ")} 사용 기술: ${item.stack.join(", ")}.`, body, t);
}

function stackCard(t) {
  const rowH = 40, top = 64;
  const H = top + (DATA.stack.length - 1) * rowH + 36;
  const rows = DATA.stack.map(([group, items], r) => {
    const y = top + r * rowH;
    let x = 196;
    const pills = items.map((s) => {
      const w = monoWidth(s, 12.5) + 24;
      const out = `<rect x="${x}" y="${y - 16}" width="${w}" height="26" rx="13" fill="${t.panel}" stroke="${t.line}"/><text x="${x + w / 2}" y="${y + 1.5}" class="m ink" font-size="12.5" text-anchor="middle">${esc(s)}</text>`;
      x += w + 8;
      return out;
    }).join("");
    return `<text x="28" y="${y + 1.5}" class="m mu" font-size="12.5">${esc(group)}</text>${pills}`;
  }).join("\n");
  const body = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="${t.bg}" stroke="${t.line}"/>
<text x="28" y="36" class="m ac" font-size="14">//</text>
<text x="52" y="36" class="m ink" font-size="14" font-weight="600">쓰는 도구</text>
${rows}`;
  return svg(W, H, `쓰는 도구. ${DATA.stack.map(([g, items]) => `${g}: ${items.join(", ")}`).join(". ")}.`, body, t);
}

function footer(t) {
  const H = 150;
  const body = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="${t.bg}" stroke="${t.line}"/>
<text x="${W / 2}" y="52" class="s ink" font-size="20" font-weight="700" text-anchor="middle">반복되는 업무가 있다면 알려주세요.</text>
<text x="${W / 2}" y="80" class="m ac" font-size="14" text-anchor="middle">${esc(DATA.email)}<tspan class="blink">_</tspan></text>
${ecg(40, W - 40, 118, t, { period: 380, amp: 0.6 })}`;
  return svg(W, H, `반복되는 업무가 있다면 알려주세요. 이메일 ${DATA.email}`, body, t);
}

// ---- 출력 ----
const out = {};
for (const [mode, t] of Object.entries(THEMES)) {
  out[`hero-${mode}`] = hero(t);
  out[`work-head-${mode}`] = sectionHead("만든 것", `${String(DATA.work.length).padStart(2, "0")} projects`, t);
  DATA.work.forEach((w, i) => (out[`work-${w.slug}-${mode}`] = workCard(w, i, t)));
  out[`stack-${mode}`] = stackCard(t);
  out[`footer-${mode}`] = footer(t);
}
const btns = {
  site: button("portfolio", ICONS.site),
  email: button("email", ICONS.mail),
};
for (const [key, b] of Object.entries(btns))
  for (const [mode, t] of Object.entries(THEMES)) out[`btn-${key}-${mode}`] = b.svg(t);

for (const [name, content] of Object.entries(out)) writeFileSync(join(ROOT, "assets", `${name}.svg`), content);

const pic = (name, alt, width = "100%") =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${name}-dark.svg" /><img alt="${esc(alt)}" src="assets/${name}-light.svg" width="${width}" /></picture>`;

const readme = `${pic("hero", `${DATA.name} ${DATA.englishName}. ${DATA.title}. ${DATA.tagline.join(" ")}`)}

<a href="${DATA.site}">${pic("btn-site", "Portfolio", btns.site.w)}</a>
<a href="mailto:${DATA.email}">${pic("btn-email", "Email", btns.email.w)}</a>

${DATA.intro}

<br>

${pic("work-head", "만든 것")}
${DATA.work.map((w, i) => `<a href="${w.repo}">${pic(`work-${w.slug}`, `${String(i + 1).padStart(2, "0")} ${w.title}: ${w.lines.join(" ")}`)}</a>`).join("\n")}

<br>

${pic("stack", `쓰는 도구. ${DATA.stack.map(([g, items]) => `${g}: ${items.join(", ")}`).join(". ")}`)}

<br><br>

<a href="mailto:${DATA.email}">${pic("footer", `Where Healthcare Works, I Will Expand Possibilities ${DATA.email}`)}</a>

`;
writeFileSync(join(ROOT, "README.md"), readme);
console.log(`wrote ${Object.keys(out).length} svg + README.md`);
