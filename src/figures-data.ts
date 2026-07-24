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

const FIGURE_DATA: Record<string, { caption: string; inner: string }> = {
  'roothair-vs-mold': {
    caption: '根毛とカビの見分け（模式図）。根毛は同じ向きにそろった細い毛で、霧吹きの水を吸って寝て白さが消える。カビは灰色で不規則な網目状（クモの巣状）にひろがり、水をはじいて残る。全体がやわらかい、ぬめる、酸っぱいにおいがするときは、見分けを問わず食べずに処分する。',
    inner: roothairMoldSvg(),
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
