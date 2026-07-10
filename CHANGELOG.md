# Changelog

## 2026-07-11 - SEO P0 Meta/Title/Redirect Fix
- 修复 PageSeo.es metaDescription 脏前缀 `Description：`
- 补齐 3 篇西语博客缺失 metaDescription
- 缩短过长 Title/metaTitle
- proxy.ts: `/es/*` 默认 307 改为 301 永久重定向
- 生产已验证并通过 DataForSEO 复检 P0 PASS
- 同步自生产 /var/www/igortv（不含 .env / dev.db / node_modules / .next / uploads）

