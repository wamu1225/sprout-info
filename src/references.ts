// 記事末の「参考にした情報源」。React版（App.tsx）と prerender が共用するSSOT。
// 出典は事実確認に用い、本文は自分の言葉で記述する（逐語転載しない）方針。
// 健康効能はうたわない。特定の生産者・商品を宣伝しない。

export type Reference = { label: string; publisher: string; url: string };

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function referencesHtml(refs?: Reference[]): string {
  if (!refs || refs.length === 0) return '';
  const items = refs.map(r =>
    `<li><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.label)}</a>` +
    `<span class="ref-pub">${esc(r.publisher)}</span></li>`
  ).join('');
  return (
    `<aside class="references" aria-label="参考にした情報源">` +
    `<h2 class="references-h">参考にした情報源</h2>` +
    `<ul class="references-list">${items}</ul>` +
    `<p class="references-note">出典は事実確認のために参照したもので、本文は運営者が自分の言葉でまとめています。栽培の日数や温度は目安で、環境によって変わります。生食のスプラウトは食中毒のリスクがあるため、衛生については公的機関の情報もあわせてご確認ください。</p>` +
    `</aside>`
  );
}
