# AshNarrative.github.io

## External dependency resilience

This site depends on:

- KaTeX CDN assets (`katex.min.css`, `katex.min.js`, `auto-render.min.js`)
- Utterances guestbook script (`https://utteranc.es/client.js`)

### Implemented safeguards

- KaTeX version is pinned to `0.16.9` in `index.html`.
- If KaTeX CDN fails, the site attempts a local fallback from `vendor/katex/`.
- Guestbook now has a timeout/error fallback message with a direct link to GitHub issues.
- A scheduled GitHub Actions workflow (`.github/workflows/dependency-monitor.yml`) checks external endpoints daily.

### Optional: add SRI hashes for KaTeX

You can add `integrity="sha384-..."` attributes to the KaTeX `<link>`/`<script>` tags in `index.html`.
Because SRI values must match the exact bytes served by your chosen CDN URL/version, generate them with:

```bash
curl -sL "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" \
  | openssl dgst -sha384 -binary \
  | openssl base64 -A
```

Then set:

```html
integrity="sha384-<base64-value>"
crossorigin="anonymous"
```

Repeat for:

- `dist/katex.min.css`
- `dist/katex.min.js`
- `dist/contrib/auto-render.min.js`
