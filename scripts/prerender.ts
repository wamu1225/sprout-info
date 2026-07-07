import * as fs from 'fs';
import * as path from 'path';
import { articles } from '../src/data/articles.ts';
import type { Article } from '../src/data/articles.ts';
import { referencesHtml } from '../src/references.ts';
import { sectionIconSvg } from '../src/section-icons.ts';
import { tokenizeInline } from '../src/lib/inline.ts';
import type { InlineToken } from '../src/lib/inline.ts';
import { GROW_STEPS } from '../src/data/step-data.ts';
import { DISCERN_ROWS, DISCERN_SUMMARY } from '../src/data/discern-data.ts';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const BASE_URL = 'https://study-apps.com/sprout-info';
const SITE_NAME = 'スプラウト栽培ノート';
const SPROUT = '#4f9a41';
const DEEP = '#2f6b2a';
const SOFT = '#8bc47a';
const LEAF = '#eaf3e2';
const INK_SOFT = '#64705d';
const LINE = '#e2e7d6';

const ico = (name: string, size: number, color = SPROUT) =>
  `<span style="color:${color};display:inline-flex;vertical-align:middle">${sectionIconSvg(name, size)}</span>`;

console.log('--- sprout-info SSG Pre-rendering ---');

if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error('Error: dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

const templateHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tokensToHtml(tokens: InlineToken[]): string {
  return tokens
    .map((tok) => {
      if (tok.type === 'text') return escapeHtml(tok.value);
      if (tok.type === 'bold') return `<strong>${tokensToHtml(tok.children)}</strong>`;
      const href = tok.href;
      const isExternal = /^https?:\/\//.test(href);
      const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${escapeHtml(href)}"${attrs}>${tokensToHtml(tok.children)}</a>`;
    })
    .join('');
}
const inlineToHtml = (text: string) => tokensToHtml(tokenizeInline(text));

function slugifyAscii(_text: string, index: number): string {
  return `section-${index}`;
}

function markdownToHtml(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let i = 0;
  let h2Index = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === '') { i++; continue; }

    if (trimmed.startsWith('## ')) {
      const text = trimmed.slice(3);
      out.push(`<h2 id="${slugifyAscii(text, h2Index++)}" class="content-h2">${inlineToHtml(text)}</h2>`);
      i++; continue;
    }
    if (trimmed.startsWith('### ')) {
      out.push(`<h3 class="content-h3">${inlineToHtml(trimmed.slice(4))}</h3>`);
      i++; continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const rows = tableLines.map((r) => r.split('|').slice(1, -1).map((c) => c.trim()));
        const isSep = (r: string[]) => r.every((c) => /^[-:]+$/.test(c));
        const header = rows[0];
        const data = rows.slice(1).filter((r) => !isSep(r));
        const headerHtml = header.map((c) => `<th>${inlineToHtml(c)}</th>`).join('');
        const bodyHtml = data.map((row) => `<tr>${row.map((c) => `<td>${inlineToHtml(c)}</td>`).join('')}</tr>`).join('');
        out.push(`<div class="content-table-wrap"><table class="content-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`);
      }
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      out.push(`<ol class="content-ol">${items.map((it) => `<li>${inlineToHtml(it)}</li>`).join('')}</ol>`);
      continue;
    }

    if (trimmed.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      out.push(`<ul class="content-ul">${items.map((it) => `<li>${inlineToHtml(it)}</li>`).join('')}</ul>`);
      continue;
    }

    if (trimmed.startsWith('💡 ')) { out.push(`<p class="callout callout-tip">${inlineToHtml(trimmed.slice(2).trim())}</p>`); i++; continue; }
    if (trimmed.startsWith('⚠️ ')) { out.push(`<p class="callout callout-warning">${inlineToHtml(trimmed.slice(2).trim())}</p>`); i++; continue; }
    if (trimmed.startsWith('📖 ')) { out.push(`<p class="callout callout-info">${inlineToHtml(trimmed.slice(2).trim())}</p>`); i++; continue; }

    out.push(`<p class="content-p">${inlineToHtml(trimmed)}</p>`);
    i++;
  }
  return out.join('\n');
}

function buildTocHtml(toc: string[]): string {
  if (!toc.length) return '';
  const items = toc.map((it, idx) => `<li><a href="#${slugifyAscii(it, idx)}">${escapeHtml(it)}</a></li>`).join('');
  return `<nav class="toc"><div class="toc-title">目次</div><ol class="toc-list">${items}</ol></nav>`;
}

function formatDateJa(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[1]}年${parseInt(m[2], 10)}月${parseInt(m[3], 10)}日`;
}

// ── ホーム＝栽培ステッパー＋根毛/カビ判別（静的フォールバック） ──
const NAV_GROUPS: { label: string; ids: string[] }[] = [
  { label: 'はじめに', ids: ['intro', 'vs-seedling'] },
  { label: 'そだてる', ids: ['grow', 'discern'] },
  { label: 'あんぜんに食べる', ids: ['safety', 'choose'] },
  { label: '疑問', ids: ['faq'] },
];

function buildHomeStatic(): string {
  const steps = GROW_STEPS.map((s) => `<li style="position:relative;padding:0 0 16px 84px">
    <span style="position:absolute;left:0;top:0;width:64px;text-align:center;background:${LEAF};color:${DEEP};border:2px solid ${SOFT};border-radius:999px;padding:5px 0;font-size:0.76rem;font-weight:700">${escapeHtml(s.when)}</span>
    <div style="font-weight:700;color:${DEEP};font-size:1.02rem">${escapeHtml(s.title)}</div>
    <p style="margin:3px 0 0;color:${INK_SOFT};font-size:0.9rem;line-height:1.8">${escapeHtml(s.detail)}</p>
  </li>`).join('');

  const discernTable = DISCERN_ROWS.map((r) => `<tr><th style="background:#fafaf4;border:1px solid ${LINE};padding:8px 11px;text-align:left;white-space:nowrap">${escapeHtml(r.aspect)}</th><td style="border:1px solid ${LINE};padding:8px 11px">${escapeHtml(r.hair)}</td><td style="border:1px solid ${LINE};padding:8px 11px">${escapeHtml(r.mold)}</td></tr>`).join('');

  const navHtml = NAV_GROUPS.map((g) => {
    const links = g.ids.map((id) => {
      const a = articles.find((x) => x.id === id);
      if (!a) return '';
      return `<li style="margin-bottom:10px"><a href="/sprout-info/${a.id}/" style="color:${DEEP};font-weight:700;text-decoration:none">${ico(a.icon, 16)} ${escapeHtml(a.shortTitle)}</a><br><span style="color:${INK_SOFT};font-size:0.85rem">${escapeHtml(a.description)}</span></li>`;
    }).join('');
    return `<div style="margin:0 0 16px"><div style="font-size:0.86rem;font-weight:700;color:${DEEP};letter-spacing:0.12em;margin-bottom:8px">${escapeHtml(g.label)}</div><ul style="list-style:none;padding:0 0 0 14px;margin:0">${links}</ul></div>`;
  }).join('');

  return `<article id="static-fallback" style="font-family:'Hiragino Maru Gothic ProN','Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic',Meiryo,sans-serif;line-height:1.9;max-width:880px;margin:0 auto;padding:24px 16px;color:#2c332a">
  <section style="background:#fff;border:1px solid ${LINE};border-top:6px solid ${SPROUT};border-radius:22px;padding:24px 26px 20px;margin-bottom:20px">
    <h1 style="font-size:1.7rem;margin:0 0 8px;color:${DEEP}">約1週間で、新芽を育てる</h1>
    <p style="font-size:0.96rem;color:${INK_SOFT};margin:0 0 20px">ブロッコリースプラウトを、種まきから収穫まで日ごとに。水と容器があれば台所のそばで育てられます。</p>
    <ol style="list-style:none;margin:0;padding:0">${steps}</ol>
    <p style="font-size:0.84rem;color:${INK_SOFT};margin:16px 0 0;padding-top:12px;border-top:1px dashed ${LINE}">日数や温度は目安です。くわしくは <a href="/sprout-info/grow/" style="color:${DEEP}">栽培の手順</a> へ。</p>
  </section>
  <section style="background:#fff;border:1px solid ${LINE};border-radius:22px;padding:22px 24px;margin-bottom:26px">
    <h2 style="font-size:1.25rem;margin:0 0 6px;color:${DEEP}">白いふわふわ、根毛？カビ？</h2>
    <p style="font-size:0.92rem;color:${INK_SOFT};margin:0 0 16px">根元に出る白い綿の多くは、水を吸うための根毛で、正常なものです。霧吹きで見分けられます。</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div style="background:#eef6e8;border:1.5px solid #cbe3ba;border-radius:16px;padding:14px 16px"><div style="font-weight:700;color:${DEEP}">✓ ${escapeHtml(DISCERN_SUMMARY.hair.label)}</div><div style="font-size:0.83rem;color:${INK_SOFT};margin-top:6px">${escapeHtml(DISCERN_SUMMARY.hair.hint)}</div></div>
      <div style="background:#fbeede;border:1.5px solid #edd0a6;border-radius:16px;padding:14px 16px"><div style="font-weight:700;color:#b5651d">✗ ${escapeHtml(DISCERN_SUMMARY.mold.label)}</div><div style="font-size:0.83rem;color:${INK_SOFT};margin-top:6px">${escapeHtml(DISCERN_SUMMARY.mold.hint)}</div></div>
    </div>
    <div style="overflow-x:auto;border-radius:14px;border:1px solid ${LINE}"><table style="border-collapse:collapse;width:100%;font-size:0.86rem;background:#fff"><thead><tr><th style="border:1px solid ${LINE};padding:8px 11px;background:${LEAF};color:${DEEP}"></th><th style="border:1px solid ${LINE};padding:8px 11px;background:${LEAF};color:${DEEP};text-align:left">根毛（正常）</th><th style="border:1px solid ${LINE};padding:8px 11px;background:${LEAF};color:${DEEP};text-align:left">カビ（異常）</th></tr></thead><tbody>${discernTable}</tbody></table></div>
    <p style="font-size:0.83rem;color:${INK_SOFT};margin:14px 0 0">霧吹きで水を吹くと、根毛は寝て消え、カビははじいて残ります。くわしくは <a href="/sprout-info/discern/" style="color:${DEEP}">根毛とカビの見分け</a> へ。</p>
  </section>
  ${navHtml}
  <nav style="margin-top:20px;border-top:1px solid ${LINE};padding-top:16px;display:flex;gap:16px;flex-wrap:wrap">
    <a href="/sprout-info/about/" style="color:${DEEP}">サイトについて</a>
    <a href="/sprout-info/privacy/" style="color:${DEEP}">プライバシーポリシー</a>
  </nav>
</article>`;
}

const homeWebSiteJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: `${BASE_URL}/`,
  description: 'ブロッコリースプラウトを中心に、家庭での水耕栽培を約1週間の手順で解説。根毛とカビの見分け、生食の食中毒予防、選び方や調理までを、農林水産省や種苗メーカーの公開情報で確かめながらまとめた栽培ガイド。',
  inLanguage: 'ja',
  publisher: { '@type': 'Organization', name: 'study-apps.com', url: 'https://study-apps.com/' },
});

const homeItemListJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: `${SITE_NAME}：記事一覧`,
  itemListElement: articles.map((a, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: a.shortTitle,
    description: a.description,
    url: `${BASE_URL}/${a.id}/`,
  })),
});

let rootIndexHtml = templateHtml.replace('<div id="root"></div>', `<div id="root">${buildHomeStatic()}</div>`);
rootIndexHtml = rootIndexHtml.replace(
  '</head>',
  `<script type="application/ld+json">${homeWebSiteJsonLd}</script>\n  <script type="application/ld+json">${homeItemListJsonLd}</script>\n  </head>`
);
fs.writeFileSync(INDEX_HTML_PATH, rootIndexHtml);

const subDirTemplateHtml = templateHtml
  .replace(/href="\.\/assets\//g, 'href="../assets/')
  .replace(/src="\.\/assets\//g, 'src="../assets/')
  .replace(/href="\.\/favicon.svg"/g, 'href="../favicon.svg"');

let generatedCount = 0;

function buildChapterNav(currentId: string): string {
  const idx = articles.findIndex((a) => a.id === currentId);
  if (idx === -1) return '';
  const prev = idx > 0 ? articles[idx - 1] : null;
  const next = idx < articles.length - 1 ? articles[idx + 1] : null;
  if (!prev && !next) return '';
  const prevHtml = prev
    ? `<a href="/sprout-info/${prev.id}/" style="display:block;flex:1;padding:14px 16px;background:#fff;border:1px solid ${LINE};border-radius:16px;text-decoration:none;color:#2c332a"><div style="font-size:0.76rem;color:${SPROUT};margin-bottom:4px">← 前の記事</div><div style="font-size:0.92rem;font-weight:700;color:${DEEP}">${ico(prev.icon, 15)} ${escapeHtml(prev.shortTitle)}</div></a>`
    : `<span style="flex:1"></span>`;
  const nextHtml = next
    ? `<a href="/sprout-info/${next.id}/" style="display:block;flex:1;padding:14px 16px;background:#fff;border:1px solid ${LINE};border-radius:16px;text-decoration:none;color:#2c332a;text-align:right"><div style="font-size:0.76rem;color:${SPROUT};margin-bottom:4px">次の記事 →</div><div style="font-size:0.92rem;font-weight:700;color:${DEEP}">${ico(next.icon, 15)} ${escapeHtml(next.shortTitle)}</div></a>`
    : `<span style="flex:1"></span>`;
  return `<nav style="display:flex;gap:10px;margin:32px 0">${prevHtml}${nextHtml}</nav>`;
}

function buildArticleFallback(a: Article): string {
  const tocHtml = buildTocHtml(a.toc);
  const contentHtml = markdownToHtml(a.content);
  const chapterNavHtml = buildChapterNav(a.id);
  const leadHtml = a.lead ? `<p class="lead" style="color:#2c332a;font-size:1.04rem;margin:16px 0 24px">${inlineToHtml(a.lead)}</p>` : '';
  return `<article style="font-family:'Hiragino Maru Gothic ProN','Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic',Meiryo,sans-serif;line-height:1.9;max-width:880px;margin:0 auto;padding:24px 16px;color:#2c332a">
  <nav style="font-size:0.85rem;color:${INK_SOFT};margin:0 0 16px"><a href="/sprout-info/" style="color:${DEEP};text-decoration:none">${SITE_NAME}</a> <span style="color:#9ca3af">›</span> <span style="color:#4b5563;font-weight:600">${escapeHtml(a.shortTitle)}</span></nav>
  <header style="text-align:center;margin-bottom:20px">
    <div style="line-height:1;margin-bottom:8px">${ico(a.icon, 30)}</div>
    <h1 style="font-size:1.46rem;color:${DEEP};margin:0 0 8px">${escapeHtml(a.title)}</h1>
    <div style="font-size:0.85rem;color:${INK_SOFT};margin-top:6px">最終更新: ${formatDateJa(a.updatedAt)}</div>
  </header>
  ${leadHtml}
  ${tocHtml}
  <div class="section-content">
${contentHtml}
  </div>
  ${referencesHtml(a.references)}
  ${chapterNavHtml}
  <p style="margin-top:32px"><a href="/sprout-info/" style="color:${DEEP}">← トップへ戻る</a></p>
</article>`;
}

function applyMeta(html: string, title: string, description: string, urlPath: string, ogType: string): string {
  return html
    .replace(/<title>.*?<\/title>/, `<title>${title} | ${SITE_NAME}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${escapeHtml(description)}"`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${escapeHtml(title)}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${escapeHtml(description)}"`)
    .replace(/<meta property="og:type" content="[^"]*"/, `<meta property="og:type" content="${ogType}"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${BASE_URL}${urlPath}"`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${BASE_URL}${urlPath}"`)
    .replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${escapeHtml(title)}"`)
    .replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${escapeHtml(description)}"`);
}

function writeArticlePage(a: Article) {
  const dir = path.join(DIST_DIR, a.id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let html = applyMeta(subDirTemplateHtml, a.title, a.description, `/${a.id}/`, 'article')
    .replace('<div id="root"></div>', `<div id="root">${buildArticleFallback(a)}</div>`);

  const articleJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    url: `${BASE_URL}/${a.id}/`,
    inLanguage: 'ja',
    datePublished: a.updatedAt,
    dateModified: a.updatedAt,
    author: { '@type': 'Organization', name: 'study-apps.com' },
    publisher: { '@type': 'Organization', name: 'study-apps.com', url: 'https://study-apps.com/' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/${a.id}/` },
  });

  const breadcrumbJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: a.shortTitle, item: `${BASE_URL}/${a.id}/` },
    ],
  });

  html = html.replace(
    '</head>',
    `<script type="application/ld+json">${articleJsonLd}</script>\n  <script type="application/ld+json">${breadcrumbJsonLd}</script>\n  </head>`
  );

  fs.writeFileSync(path.join(dir, 'index.html'), html);
  generatedCount++;
}

for (const a of articles) writeArticlePage(a);

function writeStaticPage(id: string, title: string, description: string, bodyHtml: string) {
  const dir = path.join(DIST_DIR, id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const fallback = `<article style="font-family:'Hiragino Maru Gothic ProN','Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic',Meiryo,sans-serif;line-height:1.9;max-width:880px;margin:0 auto;padding:24px 16px;color:#2c332a">
  <nav style="font-size:0.85rem;color:${INK_SOFT};margin:0 0 16px"><a href="/sprout-info/" style="color:${DEEP};text-decoration:none">${SITE_NAME}</a> <span style="color:#9ca3af">›</span> <span style="color:#4b5563;font-weight:600">${escapeHtml(title)}</span></nav>
  <h1 style="font-size:1.46rem;color:${DEEP}">${escapeHtml(title)}</h1>
  ${bodyHtml}
  <p style="margin-top:32px"><a href="/sprout-info/" style="color:${DEEP}">← トップへ戻る</a></p>
</article>`;

  const pageJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: `${BASE_URL}/${id}/`,
    inLanguage: 'ja',
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${BASE_URL}/` },
  });
  const breadcrumbJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: title, item: `${BASE_URL}/${id}/` },
    ],
  });

  let html = applyMeta(subDirTemplateHtml, title, description, `/${id}/`, 'website')
    .replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
  html = html.replace(
    '</head>',
    `<script type="application/ld+json">${pageJsonLd}</script>\n  <script type="application/ld+json">${breadcrumbJsonLd}</script>\n  </head>`
  );
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  generatedCount++;
}

const sectionH2 = (t: string) => `<h2 style="font-size:1.3rem;color:${DEEP};border-left:5px solid ${SPROUT};padding-left:12px;margin:32px 0 12px">${t}</h2>`;

writeStaticPage(
  'about',
  'サイトについて',
  `${SITE_NAME}について。本サイトの目的と情報源、編集方針、健康と安全の扱いを説明します。`,
  `<p>本サイト「${SITE_NAME}」は、ブロッコリースプラウトを中心に、家庭でスプラウトを安全に育てて食べるための情報をまとめたものです。トップでは約1週間の栽培の手順と、根毛とカビの見分けを示し、各ページで育て方、衛生、選び方や調理までを扱います。</p>
  ${sectionH2('編集と制作の方針')}
  <p>本サイトの内容は、農林水産省の衛生管理の指針や、種苗メーカーの家庭向けの育て方などの公開情報を参照し、事実を確認したうえで、運営者が自分の言葉で書いています。出典の文章をそのまま転載することはありません。</p>
  ${sectionH2('健康と安全について')}
  <p>本サイトは、特定の健康効果や病気の予防をうたいません。成分の効果には研究途上のものが多く、数値や倍率、特定の商品を宣伝することもしません。また、生で食べるスプラウトには食中毒のリスクがあるため、衛生については公的機関の情報にもとづいて記述しています。においや変色があるものは食べないでください。</p>
  ${sectionH2('お問い合わせ')}
  <p>ご質問や誤りのご指摘は<a href="https://forms.gle/ccMv7oKwz6ysDHBe6" target="_blank" rel="noopener noreferrer" style="color:${DEEP}">こちらのGoogleフォーム</a>からお願いします。</p>`
);

writeStaticPage(
  'privacy',
  'プライバシーポリシー',
  `${SITE_NAME}のプライバシーポリシー。Cookie・アクセス解析・広告の使用について。`,
  `${sectionH2('アクセス解析')}
  <p>本サイトでは、サイトの利用状況を把握するために Google Analytics を使用しています。Cookie を利用して匿名のトラフィックデータを収集します。収集される情報は匿名で、個人を特定するものではありません。</p>
  ${sectionH2('広告について')}
  <p>本サイトでは Google AdSense などの第三者配信の広告サービスを利用することがあります。広告配信事業者は、ユーザーの興味に応じた広告を表示するために Cookie を使用することがあります。Cookie を無効にする設定や、Google の広告設定により、パーソナライズ広告を無効にできます。</p>
  ${sectionH2('免責事項')}
  <p>本サイトの情報は可能な限り正確を期していますが、その完全性や正確性を保証するものではありません。栽培の日数や温度は目安であり、環境によって変わります。生食のスプラウトには食中毒のリスクがあります。本サイトの情報を利用したことにより生じた損害について、運営者は一切の責任を負いません。</p>`
);

const today = new Date().toISOString().split('T')[0];
type SitemapEntry = { path: string; lastmod: string; changefreq: string; priority: string };
const sitemapEntries: SitemapEntry[] = [
  { path: '/', lastmod: today, changefreq: 'monthly', priority: '1.0' },
  ...articles.map((a) => ({ path: `/${a.id}/`, lastmod: a.updatedAt, changefreq: 'monthly', priority: '0.9' })),
  { path: '/about/', lastmod: today, changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy/', lastmod: today, changefreq: 'yearly', priority: '0.3' },
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
  .map((e) => `  <url>
    <loc>${BASE_URL}${e.path}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`)
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml);
console.log(`✓ Generated sitemap.xml (${sitemapEntries.length} URLs)`);
console.log(`✓ Generated ${generatedCount} static pages`);
console.log('--- Done ---');
