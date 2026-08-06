// 自作SVG模式図のHTML文字列を一元管理する単一の真実源（SSOT）。
// App.tsx（{{figure:KEY}} 展開）と scripts/prerender.ts（SSG）の双方がここを import し、
// 二重レンダラの食い違い（生タグ露出）を防ぐ。写真は使わず、事実にもとづく模式図で補う。
// 図の内容は各記事の検証済み本文と一致させる（新たな主張を図で作らない）。

const BG = '#f3f8ee';
const DEEP = '#2f6b2a';
const SPROUT = '#4f9a41';
const SOFT = '#8bc47a';
const INK = '#3a4235';
const MOLD = '#9aa0a6';
const MOLD_DEEP = '#6f757b';

// 1) 根毛とカビの見分け（根元のようす・対比）
function roothairMoldSvg(): string {
  const panel = (x: number, title: string, trait: string, body: string) =>
    `<g transform="translate(${x} 0)">` +
    `<rect x="6" y="12" width="126" height="98" rx="8" fill="#ffffff" stroke="${SOFT}" stroke-width="1.3"/>` +
    body +
    `<text x="69" y="102" font-size="7" fill="${INK}" text-anchor="middle">${trait}</text>` +
    `<text x="69" y="124" font-size="10" font-weight="700" fill="${DEEP}" text-anchor="middle">${title}</text>` +
    `</g>`;
  // 共通：小さな双葉の芽・茎・根（根元のクローズアップ）
  const sprout =
    `<path d="M69 40 q -12 -5 -16 -15 q 12 0 16 9 Z" fill="${SPROUT}"/>` +
    `<path d="M69 40 q 12 -5 16 -15 q -12 0 -16 9 Z" fill="${SOFT}"/>` +
    `<path d="M69 40 L69 88" stroke="${DEEP}" stroke-width="3" stroke-linecap="round"/>`;
  // 根毛：同じ向きにそろった純白（淡緑で可視化）の細い毛
  let hairs = '';
  for (let y = 48; y <= 84; y += 4) {
    hairs += `<path d="M67 ${y} L59 ${y + 4}" stroke="${SOFT}" stroke-width="1" stroke-linecap="round"/>`;
    hairs += `<path d="M71 ${y} L79 ${y + 4}" stroke="${SOFT}" stroke-width="1" stroke-linecap="round"/>`;
  }
  const roothair = sprout + hairs;
  // カビ：灰色で不規則な網目（クモの巣状）とわずかな綿毛
  const cotton =
    `<ellipse cx="58" cy="60" rx="9" ry="6" fill="${MOLD}" fill-opacity="0.22"/>` +
    `<ellipse cx="82" cy="72" rx="10" ry="7" fill="${MOLD}" fill-opacity="0.22"/>` +
    `<ellipse cx="70" cy="82" rx="8" ry="5" fill="${MOLD}" fill-opacity="0.22"/>`;
  const web =
    `<path d="M54 50 Q69 58 86 52" stroke="${MOLD}" stroke-width="0.9" fill="none"/>` +
    `<path d="M52 64 Q70 60 88 68" stroke="${MOLD}" stroke-width="0.9" fill="none"/>` +
    `<path d="M55 78 Q69 72 85 82" stroke="${MOLD}" stroke-width="0.9" fill="none"/>` +
    `<path d="M58 48 Q54 66 62 84" stroke="${MOLD}" stroke-width="0.9" fill="none"/>` +
    `<path d="M84 50 Q88 68 78 84" stroke="${MOLD}" stroke-width="0.9" fill="none"/>` +
    `<path d="M60 54 L80 76 M80 56 L60 78" stroke="${MOLD_DEEP}" stroke-width="0.7" fill="none" opacity="0.7"/>`;
  const mold = sprout + cotton + web;
  return (
    `<svg viewBox="0 0 300 134" width="100%" role="img" aria-label="根毛とカビの見分けの模式図。根毛はそろった細い毛、カビは灰色で不規則な網目状にひろがる。">` +
    `<rect width="300" height="134" fill="${BG}"/>` +
    panel(0, '根毛（正常）', 'そろって細い・水で寝る', roothair) +
    panel(150, 'カビ（異常）', '灰色・網目・水をはじく', mold) +
    `</svg>`
  );
}

// 2) 緑化させる育て方と、緑化させない（軟白）育て方の対比
function greeningVsBlanchedSvg(): string {
  const DARK = '#2f3630';
  const LIGHT = '#f6e6a8';
  const x0 = 16, x1 = 196;
  const bar = (y: number, splitX: number | null) =>
    `<rect x="${x0}" y="${y}" width="${(splitX ?? x1) - x0}" height="18" rx="3" fill="${DARK}"/>` +
    (splitX === null
      ? ''
      : `<rect x="${splitX}" y="${y}" width="${x1 - splitX}" height="18" rx="3" fill="${LIGHT}" stroke="${SOFT}" stroke-width="1"/>`);
  // 収穫時の姿：緑化した芽（緑の子葉）と、軟白の芽（白いまま）
  const seedling = (cx: number, cy: number, green: boolean) =>
    `<path d="M${cx} ${cy + 16} L${cx} ${cy - 6}" stroke="${green ? DEEP : '#d8d5c4'}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M${cx} ${cy - 6} q -13 -4 -17 -14 q 13 0 17 8 Z" fill="${green ? SPROUT : '#efece0'}" stroke="${green ? SPROUT : '#cfcbb8'}" stroke-width="0.8"/>` +
    `<path d="M${cx} ${cy - 6} q 13 -4 17 -14 q -13 0 -17 8 Z" fill="${green ? SOFT : '#f7f5ec'}" stroke="${green ? SOFT : '#cfcbb8'}" stroke-width="0.8"/>`;
  return (
    `<svg viewBox="0 0 300 162" width="100%" role="img" aria-label="緑化させる育て方と緑化させない軟白の育て方の対比図。緑化は最後に光を当てて子葉を緑にし、軟白は収穫まで暗いところで育てて白いまま仕上げる。">` +
    `<rect width="300" height="162" fill="${BG}"/>` +
    `<text x="${x0}" y="22" font-size="9" font-weight="700" fill="${DEEP}">緑化させる（かいわれ大根・ブロッコリー）</text>` +
    bar(32, 146) +
    `<text x="81" y="45" font-size="8" fill="#ffffff" text-anchor="middle">暗くして育てる</text>` +
    `<text x="171" y="45" font-size="7.5" fill="${INK}" text-anchor="middle">最後に光</text>` +
    seedling(250, 36, true) +
    `<text x="250" y="64" font-size="8" fill="${INK}" text-anchor="middle">子葉が緑になる</text>` +
    `<line x1="16" y1="76" x2="284" y2="76" stroke="${SOFT}" stroke-width="1" stroke-dasharray="3 3"/>` +
    `<text x="${x0}" y="96" font-size="9" font-weight="700" fill="${DEEP}">緑化させない＝軟白（豆もやし）</text>` +
    bar(106, null) +
    `<text x="106" y="119" font-size="8" fill="#ffffff" text-anchor="middle">収穫まで暗いまま</text>` +
    seedling(250, 110, false) +
    `<text x="250" y="138" font-size="8" fill="${INK}" text-anchor="middle">全体が白いまま</text>` +
    `<text x="${x0}" y="136" font-size="7.5" fill="${INK}">1日目</text>` +
    `<text x="${x1}" y="136" font-size="7.5" fill="${INK}" text-anchor="end">収穫</text>` +
    `<text x="${x0}" y="154" font-size="8" fill="${INK}">同じ水耕でも、最後に光を当てるかどうかで仕上がりが変わる</text>` +
    `</svg>`
  );
}

const FIGURE_DATA: Record<string, { caption: string; inner: string }> = {
  'roothair-vs-mold': {
    caption: '根毛とカビの見分け（模式図）。根毛は同じ向きにそろった細い毛で、霧吹きの水を吸って寝て白さが消える。カビは灰色で不規則な網目状（クモの巣状）にひろがり、水をはじいて残る。全体がやわらかい、ぬめる、酸っぱいにおいがするときは、見分けを問わず食べずに処分します。',
    inner: roothairMoldSvg(),
  },
  'greening-vs-blanched': {
    caption: '緑化と軟白の対比（模式図）。かいわれ大根やブロッコリースプラウトは、暗いところで茎をのばし、最後に明るい室内へ移して子葉を緑にします。豆もやしは収穫まで光を当てず、全体が白いまま育てる。育てているものがどちらの仕上げかを先に確かめる。',
    inner: greeningVsBlanchedSvg(),
  },
};

export const FIGURE_KEYS = Object.keys(FIGURE_DATA);

export function figureHtml(id: string): string | null {
  const f = FIGURE_DATA[id];
  if (!f) return null;
  return (
    `<figure style="margin:18px 0;text-align:center">` +
    `<div style="max-width:420px;margin:0 auto">${f.inner}</div>` +
    `<figcaption style="font-size:0.82rem;color:#5a6b52;margin-top:8px;text-align:left;line-height:1.65">${f.caption}</figcaption>` +
    `</figure>`
  );
}
