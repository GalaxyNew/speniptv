const fs = require('fs');
const path = require('path');

const htmlPath = 'F:\\数据\\IPTV-西班牙\\IPTV_Basemg_sp\\iptv-smarters.html';
const destJsonPath = path.resolve(__dirname, '..', 'scripts', 'smarters-post.json');

if (!fs.existsSync(htmlPath)) {
  console.error(`Source HTML file not found: ${htmlPath}`);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

// 1. Extract the highlight-card and the article content
// We look for the start of the highlight-card and get everything inside article-content up to the end of the article.
const startIndex = html.indexOf('<div class="highlight-card mb-8">');
const endIndex = html.indexOf('</article>');

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not locate article bounds in HTML file.');
  process.exit(1);
}

let articleHtml = html.substring(startIndex, endIndex);

// Remove wrapping closing divs from the end of articleHtml if any (e.g. </div></div> before </article>)
// Let's trim trailing whitespace and closing tags
articleHtml = articleHtml.trim();
if (articleHtml.endsWith('</div>\n                </div>')) {
  articleHtml = articleHtml.substring(0, articleHtml.length - 28);
} else if (articleHtml.endsWith('</div>\n            </div>')) {
  articleHtml = articleHtml.substring(0, articleHtml.length - 27);
} else if (articleHtml.endsWith('</div>\n        </div>')) {
  articleHtml = articleHtml.substring(0, articleHtml.length - 25);
}

// 2. Prepend custom CSS styles for the step cards, grids and callouts
const customStyle = `<style>
.step-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
  margin: 1.5rem 0 2rem;
}
@media (min-width: 768px) {
  .step-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.step-card {
  border-radius: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(30, 41, 59, 0.3);
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.step-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(34, 211, 238, 0.3);
}
.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, #22d3ee 0%, #a855f7 100%);
  color: #fff;
  font-weight: 800;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}
.step-note {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.85rem;
  background: rgba(34, 211, 238, 0.08);
  border: 1px solid rgba(34, 211, 238, 0.2);
  color: #c1e8ff;
  font-size: 0.9rem;
}
.callout {
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 2rem 0;
  border: 1px solid rgba(34, 211, 238, 0.2);
  background: rgba(30, 41, 59, 0.4);
}
.callout-note {
  border-color: rgba(168, 85, 247, 0.2);
  background: rgba(168, 85, 247, 0.04);
}
.callout h4 {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #22d3ee;
}
.highlight-card {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}
.highlight-card h3 {
  margin-top: 0 !important;
  color: #f1f5f9;
}
</style>
`;

articleHtml = customStyle + articleHtml;

// 3. Prepend / to relative images
articleHtml = articleHtml.replace(/src="static\/smart\//g, 'src="/static/smart/');
articleHtml = articleHtml.replace(/srcset="static\/smart\//g, 'srcset="/static/smart/');
articleHtml = articleHtml.replace(/href="blog\\guias\\/g, 'href="/es/blog/');
articleHtml = articleHtml.replace(/href="blog\\consejos\\/g, 'href="/es/blog/');

// Remove specific links as per user request (keeping the text)
articleHtml = articleHtml.replace(/<a[^>]*>([\s\r\n]*reproductor IPTV[\s\r\n]*)<\/a>/gi, '$1');
articleHtml = articleHtml.replace(/<a[^>]*>([\s\r\n]*tus suscripciones IPTV[\s\r\n]*)<\/a>/gi, '$1');
articleHtml = articleHtml.replace(/<a[^>]*>([\s\r\n]*Smart IPTV\.?[\s\r\n]*)<\/a>/gi, '$1');
articleHtml = articleHtml.replace(/<a[^>]*>([\s\r\n]*listas M3U[\s\r\n]*)<\/a>/gi, '$1');
articleHtml = articleHtml.replace(/<a[^>]*>([\s\r\n]*cómo instalar apps externas en FireStick con Downloader\.?[\s\r\n]*)<\/a>/gi, '$1');
articleHtml = articleHtml.replace(/<a[^>]*>([\s\r\n]*guía paso a paso para habilitarlas\.?[\s\r\n]*)<\/a>/gi, '$1');

// Change the "IPTV España" link to https://igoriptv2.com/
articleHtml = articleHtml.replace(/<a[^>]*href="https:\/\/igortv456\.com"[^>]*>([\s\r\n]*IPTV España[\s\r\n]*)<\/a>/gi, '<a href="https://igoriptv2.com/" style="color: orange;">$1</a>');

// Change 2025 to 2026 for safety tips and install date
articleHtml = articleHtml.replace(/Consejos de seguridad para usar apps IPTV en 2025/gi, 'Consejos de seguridad para usar apps IPTV en 2026');
articleHtml = articleHtml.replace(/01\/10\/2025/g, '01/10/2026');
articleHtml = articleHtml.replace(/Oct_01_2025/g, 'Oct_01_2026');

// Change setup guide button link temporarily to homepage
articleHtml = articleHtml.replace(/href="iptv-smarters-setup\.html"/g, 'href="https://igoriptv2.com/"');

// Remove srcset and sizes to avoid loading non-existent responsive images
articleHtml = articleHtml.replace(/\s+srcset="[^"]*"/gi, '');
articleHtml = articleHtml.replace(/\s+sizes="[^"]*"/gi, '');

// 4. Convert FAQ accordions to native <details> and <summary> tags
// We look for each accordian-row, extract the question and answer, and map them to details/summary
const faqRegex = /<div class="accordian-row">[\s\S]*?<div class="accordion-toggle">[\s\S]*?<button>([\s\S]*?)<svg[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<div class="accordion-content">([\s\S]*?)<\/div>[\s\S]*?<\/div>/g;

articleHtml = articleHtml.replace(faqRegex, (match, question, answer) => {
  const cleanQuestion = question.trim();
  const cleanAnswer = answer.trim();
  
  return `<details class="accordian-row" style="margin-bottom:1rem; border:1px solid rgba(148,163,184,0.16); background:rgba(30,41,59,0.3); border-radius:0.9rem; overflow:hidden;">
  <summary style="font-weight:600; padding:1rem 1.25rem; color:#e2e8f0; cursor:pointer; list-style:none; outline:none;">
    ${cleanQuestion}
  </summary>
  <div style="padding:1rem 1.25rem; color:#cbd5e1; border-top:1px solid rgba(148,163,184,0.08);">
    ${cleanAnswer}
  </div>
</details>`;
});

// 5. Structure post data
const postData = {
  title: 'IPTV Smarters Pro para FireStick: cómo instalar y usar (Guía 2026)',
  excerpt: 'Aprende a descargar, instalar y configurar IPTV Smarters Pro en Fire TV, dispositivos Android e iOS con instrucciones paso a paso.',
  category: 'guias',
  metaTitle: 'IPTV Smarters Pro para FireStick: instalar y usar (Guía 2026)',
  metaDescription: 'Aprende a descargar, instalar y configurar IPTV Smarters Pro en Fire TV, Android TV y iOS con nuestra guía paso a paso y consejos de seguridad.',
  keywords: 'IPTV Smarters Pro, FireStick IPTV, IPTV España, IPTV Android, tutorial IPTV',
  content: articleHtml
};

fs.writeFileSync(destJsonPath, JSON.stringify(postData, null, 2), 'utf8');
console.log('Successfully prepared blog post data and saved to scripts/smarters-post.json');
