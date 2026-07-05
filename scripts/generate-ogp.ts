// scripts/generate-ogp.ts — OGP画像（1200×630）を public/ogp.png に生成する。
// 実行: npx tsx scripts/generate-ogp.ts
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const FONT = "'Hiragino Maru Gothic ProN','Yu Gothic','Hiragino Kaku Gothic ProN',Meiryo,'Noto Sans JP',sans-serif";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f7f6ee"/>
  <rect x="0" y="0" width="1200" height="14" fill="#4f9a41"/>
  <text x="96" y="212" font-family="${FONT}" font-size="78" font-weight="700" fill="#2f6b2a">スプラウト栽培ノート</text>
  <text x="96" y="292" font-family="${FONT}" font-size="30" fill="#64705d">約1週間で育てる手順と、根毛・カビの見分け</text>
  <text x="96" y="360" font-family="${FONT}" font-size="25" fill="#64705d">ブロッコリースプラウトを家庭で。栽培・衛生・選び方を、</text>
  <text x="96" y="398" font-family="${FONT}" font-size="25" fill="#64705d">農林水産省や種苗メーカーの公開情報で確かめながら</text>
  <line x1="96" y1="456" x2="720" y2="456" stroke="#d9e4cd" stroke-width="2"/>
  <text x="96" y="508" font-family="${FONT}" font-size="24" fill="#4f9a41" font-weight="600">study-apps.com/sprout-info/</text>
  <!-- 新芽（双葉）＋水滴 -->
  <g transform="translate(1004 300)">
    <circle r="150" fill="#eaf3e2"/>
    <path d="M0 88 V6" fill="none" stroke="#3f7d34" stroke-width="10" stroke-linecap="round"/>
    <path d="M0 18 C-58 18 -96 -18 -96 -70 C-38 -70 0 -34 0 18 Z" fill="#5aa64a"/>
    <path d="M0 2 C58 2 96 -34 96 -86 C38 -86 0 -50 0 2 Z" fill="#77c05f"/>
    <circle cx="72" cy="70" r="15" fill="#8fd0e6"/>
  </g>
</svg>`;

async function main() {
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const outPath = path.join(PUBLIC_DIR, 'ogp.png');
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`✓ ogp.png (1200x630) を生成: ${outPath}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
