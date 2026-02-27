/**
 * app.js — Main application: routing, content loading, UI logic
 */

(function () {
  'use strict';

  const contentEl = document.getElementById('content');
  const navLinks = document.querySelectorAll('.nav-link');

  // Pagination configuration
  const POSTS_PER_PAGE = 4;

  // Guestbook provider toggle
  // Change this to 'utterances' to switch back to the previous GitHub-Issues guestbook.
  const GUESTBOOK_PROVIDER = 'atabook';

  // Section configuration
  const sections = {
    'lab-notes': {
      title: 'Lab Notes',
      desc: 'Electrical engineering concepts, circuit analysis, and technical deep-dives.',
      icon: '&gt;&gt;'
    },
    'projects': {
      title: 'Projects',
      desc: 'Hands-on builds, schematics, and engineering experiments.',
      icon: '[+]'
    },
    'musings': {
      title: 'Musings',
      desc: 'Thoughts on shows, quotes, ideas, and everything in between.',
      icon: '...'
    },
    'gallery': {
      title: 'Gallery',
      desc: 'Memorable moments and images worth sharing.',
      icon: '[*]'
    }
  };

  // ── Routing ───────────────────────────────────────────────
  function getRoute() {
    const raw = window.location.hash.slice(1) || 'home';
    const [path, query] = raw.split('?');
    const parts = path.split('/');
    let page = 1;
    if (query) {
      const params = new URLSearchParams(query);
      page = parseInt(params.get('page'), 10) || 1;
    }
    return { section: parts[0], slug: parts[1] || null, page: page };
  }

  function navigate() {
    const route = getRoute();

    // Update active nav
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === route.section);
    });

    if (route.section === 'home') {
      renderHome();
    } else if (route.section === 'guestbook') {
      renderGuestbook();
    } else if (route.section === 'about') {
      renderAbout();
    } else if (route.section === 'gallery') {
      renderGallery();
    } else if (route.section === 'webring') {
      renderWebring();
    } else if (route.slug) {
      renderPost(route.section, route.slug);
    } else if (sections[route.section]) {
      renderSection(route.section, route.page);
    } else {
      renderHome();
    }
  }

  window.addEventListener('hashchange', navigate);
  window.addEventListener('DOMContentLoaded', () => {
    renderFooterLastUpdated();
    navigate();
  });

  // ── Home ──────────────────────────────────────────────────
  async function renderHome() {
    let html = `
      <div class="home-section">
        <h2 class="welcome-title">Welcome to AshNarrative</h2>
        <p class="welcome-text">
          A personal space for electrical engineering notes, project logs,
          random musings about shows and life, and a gallery of memorable moments.
        </p>
        <div class="home-grid">`;

    for (const [key, sec] of Object.entries(sections)) {
      html += `
          <div class="home-card" onclick="location.hash='${key}'">
            <div class="card-icon">${sec.icon}</div>
            <h3>${sec.title}</h3>
            <p>${sec.desc}</p>
          </div>`;
    }

    html += `
        </div>
      </div>`;

    contentEl.innerHTML = html;

    // Load recent posts from content sections
    try {
      const postSections = ['lab-notes', 'projects', 'musings'];
      const allPosts = [];

      await Promise.all(postSections.map(async (section) => {
        try {
          const indexRaw = await fetchContent(`content/${section}/index.txt`);
          const slugs = ContentParser.parseIndex(indexRaw).slice(0, 2);

          await Promise.all(slugs.map(async (slug) => {
            try {
              const raw = await fetchContent(`content/${section}/${slug}.txt`);
              const { meta } = ContentParser.parseFrontmatter(raw);
              allPosts.push({ section, slug, meta });
            } catch { /* skip individual post failures */ }
          }));
        } catch { /* skip section failures */ }
      }));

      if (allPosts.length === 0) return;

      // Sort by date descending, take top 5
      allPosts.sort((a, b) => {
        const da = a.meta.date || '';
        const db = b.meta.date || '';
        return db.localeCompare(da);
      });
      const recent = allPosts.slice(0, 5);

      let recentHtml = `
      <div class="recent-posts">
        <div class="section-header">
          <h2>Latest from the Workbench</h2>
        </div>
        <div class="post-list">`;

      for (const post of recent) {
        const m = post.meta;
        const sectionTitle = sections[post.section] ? sections[post.section].title : post.section;
        recentHtml += `
          <div class="post-card" onclick="location.hash='${post.section}/${post.slug}'">
            <div class="post-title">${escapeHtml(m.title || post.slug)}</div>
            <div class="post-date">${escapeHtml(m.date || '')}${sectionTitle ? ' · ' + escapeHtml(sectionTitle) : ''}</div>
            ${m.excerpt ? `<div class="post-excerpt">${escapeHtml(m.excerpt)}</div>` : ''}
            ${m.tags ? `<div class="post-tags">${m.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
          </div>`;
      }

      recentHtml += `
        </div>
      </div>`;

      contentEl.innerHTML += recentHtml;
    } catch { /* fail silently if recent posts can't be loaded */ }
  }

  // ── About ─────────────────────────────────────────────────
  function renderAbout() {
    contentEl.innerHTML = `
      <div class="post-view">
        <div class="post-header">
          <h1>About the Author</h1>
        </div>
        <div class="post-body">
          <div class="block block-text">
            <p>
              Welcome to AshNarrative — a personal corner of the internet dedicated to
              electrical engineering, tinkering with circuits, and documenting the journey
              from curious student to practicing engineer.
            </p>
            <p>
              This site serves as a digital workbench: part lab notebook, part project log,
              and part creative outlet. Here you'll find deep-dives into circuit theory,
              hands-on build logs, and the occasional musing about shows, life, and everything
              in between.
            </p>
          </div>
          <div class="block block-heading h2">Contact</div>
          <div class="block block-text">
            <p>Feel free to reach out or follow along:</p>
          </div>
          <div class="block block-list">
            <ul>
              <li><a href="#">GitHub</a></li>
              <li><a href="#">Email</a></li>
              <li><a href="#">LinkedIn</a></li>
            </ul>
          </div>
        </div>
      </div>`;
  }

  // ── Webring ───────────────────────────────────────────────
  function renderWebring() {
    const links = [
      { href: 'https://hackaday.com', img: 'img/webring/solder-club.svg', alt: 'Solder Club button' },
      { href: 'https://www.righto.com', img: 'img/webring/analog-garden.svg', alt: 'Analog Garden button' },
      { href: 'https://www.6502.org', img: 'img/webring/tube-lab.svg', alt: 'Tube Lab button' },
      { href: 'https://www.sparkfun.com', img: 'img/webring/pixel-bench.svg', alt: 'Pixel Bench button' },
      { href: 'https://www.adafruit.com', img: 'img/webring/oscillo-town.svg', alt: 'Oscillo Town button' },
      { href: 'https://www.kohacraft.com', img: 'img/webring/retro-cad.svg', alt: 'Retro CAD button' },
      { href: 'https://www.allaboutcircuits.com', img: 'img/webring/ham-shack.svg', alt: 'Ham Shack button' },
      { href: 'https://webring.xxiivv.com', img: 'img/webring/maker-orbit.svg', alt: 'Maker Orbit button' },
      { href: 'https://xkcd.com', img: 'content/gallery/upload/StormBackground.gif', alt: 'Animated storm button' }
    ];

    const badges = links.map(link => `
      <a class="webring-tile" href="${link.href}" target="_blank" rel="noopener noreferrer">
        <img src="${link.img}" alt="${link.alt}" width="88" height="31" loading="lazy">
      </a>`).join('');

    contentEl.innerHTML = `
      <section class="webring-page">
        <header class="webring-hero">
          <h2>Webring / Neighbors</h2>
          <p>A tiny-button wall of electronics blogs, retro computing sites, and fun corners of the indie web.</p>
          <div class="webring-grid">${badges}</div>
          <div class="webring-actions">
            <a class="webring-action" href="https://webring.xxiivv.com/#random" target="_blank" rel="noopener noreferrer">Random Site</a>
            <a class="webring-action" href="https://webring.xxiivv.com" target="_blank" rel="noopener noreferrer">Main Ring</a>
          </div>
          <p class="webring-note">Want to swap badges? Drop a note in the guestbook and I can add your 88x31 button here.</p>
        </header>
      </section>`;
  }

  // ── Guestbook ──────────────────────────────────────────────
  function renderGuestbook() {
    const usingAtabook = GUESTBOOK_PROVIDER === 'atabook';
    const providerLabel = usingAtabook ? 'atabook.org' : 'Utterances';

    contentEl.innerHTML = `
      <div class="post-view">
        <div class="section-header">
          <h2>[#] Guestbook</h2>
          <p>Leave a message, share a thought, or just say hello.</p>
        </div>
        <div class="guestbook-intro block block-text">
          <p>
            Welcome to the guestbook! This space is currently powered by
            <a href="${usingAtabook ? 'https://www.atabook.org/' : 'https://utteranc.es/'}" target="_blank" rel="noopener noreferrer">${providerLabel}</a>.
            ${usingAtabook
              ? 'You can sign directly in the embedded guestbook below.'
              : 'Sign in with your GitHub account to leave a message.'}
          </p>
        </div>
        <div class="guestbook-comments" id="guestbook-comments">
          <!-- Guestbook widget injected here -->
        </div>
      </div>`;

    if (usingAtabook) {
      renderAtabookGuestbook();
      return;
    }

    renderUtterancesGuestbook();
  }

  function renderUtterancesGuestbook() {
    // Inject Utterances script into the fresh container
    const container = document.getElementById('guestbook-comments');
    container.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.setAttribute('repo', 'AshNarrative/AshNarrative.github.io');
    script.setAttribute('issue-term', 'Guestbook');
    script.setAttribute('label', 'guestbook');
    script.setAttribute('theme', 'github-light');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    const fallbackHtml = `
      <div class="dependency-notice">
        Guestbook comments are temporarily unavailable.
        You can still leave a note directly on GitHub:
        <a href="https://github.com/AshNarrative/AshNarrative.github.io/issues" target="_blank" rel="noopener noreferrer">open issues</a>.
      </div>`;

    let settled = false;
    const fallbackTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      container.innerHTML = fallbackHtml;
    }, 6000);

    script.addEventListener('load', () => {
      settled = true;
      clearTimeout(fallbackTimer);
    });

    script.addEventListener('error', () => {
      if (settled) return;
      settled = true;
      clearTimeout(fallbackTimer);
      container.innerHTML = fallbackHtml;
    });

    container.appendChild(script);
  }

  function renderAtabookGuestbook() {
    const container = document.getElementById('guestbook-comments');
    container.innerHTML = '';

    const frame = document.createElement('iframe');
    frame.src = 'https://ashnarrative.atabook.org/';
    frame.className = 'guestbook-frame';
    frame.loading = 'lazy';
    frame.title = 'Ash Narrative Atabook Guestbook';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';

    const fallbackHtml = `
      <div class="dependency-notice">
        The embedded Atabook guestbook could not be loaded here.
        You can still use it directly at
        <a href="https://ashnarrative.atabook.org/" target="_blank" rel="noopener noreferrer">ashnarrative.atabook.org</a>.
      </div>`;

    frame.addEventListener('error', () => {
      container.innerHTML = fallbackHtml;
    });

    container.appendChild(frame);
  }

  // ── Section List ──────────────────────────────────────────
  async function renderSection(section, page) {
    const info = sections[section];
    contentEl.innerHTML = `<div class="loading">Loading ${info.title}...</div>`;

    try {
      const indexRaw = await fetchContent(`content/${section}/index.txt`);
      const slugs = ContentParser.parseIndex(indexRaw);

      if (slugs.length === 0) {
        contentEl.innerHTML = `
          <div class="section-header">
            <h2>${info.icon} ${info.title}</h2>
            <p>${info.desc}</p>
          </div>
          <div class="empty-state">No posts yet. Add .txt files to content/${section}/ to get started.</div>`;
        return;
      }

      // Load all post metadata
      const posts = await Promise.all(slugs.map(async slug => {
        try {
          const raw = await fetchContent(`content/${section}/${slug}.txt`);
          const { meta } = ContentParser.parseFrontmatter(raw);
          return { slug, meta };
        } catch {
          return null;
        }
      }));

      const validPosts = posts.filter(Boolean);

      // Pagination
      const totalPosts = validPosts.length;
      const totalPages = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE));
      const currentPage = Math.min(page, totalPages);
      const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
      const pagePosts = validPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

      let html = `
        <div class="section-header">
          <h2>${info.icon} ${info.title}</h2>
          <p>${info.desc}</p>
        </div>
        <div class="post-list">`;

      for (const post of pagePosts) {
        const m = post.meta;
        html += `
          <div class="post-card" onclick="location.hash='${section}/${post.slug}'">
            <div class="post-title">${escapeHtml(m.title || post.slug)}</div>
            <div class="post-date">${escapeHtml(m.date || '')}</div>
            ${m.excerpt ? `<div class="post-excerpt">${escapeHtml(m.excerpt)}</div>` : ''}
            ${m.tags ? `<div class="post-tags">${m.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
          </div>`;
      }

      html += `</div>`;

      if (totalPages > 1) {
        html += renderPagination(section, currentPage, totalPages);
      }

      contentEl.innerHTML = html;

    } catch (e) {
      contentEl.innerHTML = `
        <div class="section-header">
          <h2>${info.icon} ${info.title}</h2>
          <p>${info.desc}</p>
        </div>
        <div class="empty-state">No posts yet. Create content/${section}/index.txt to get started.</div>`;
    }
  }

  // ── Pagination Renderer ──────────────────────────────────
  function renderPagination(section, currentPage, totalPages) {
    let html = '<nav class="pagination">';

    if (currentPage > 1) {
      html += `<a href="#${section}?page=${currentPage - 1}" class="pagination-link pagination-prev">← Previous</a>`;
    } else {
      html += `<span class="pagination-link pagination-prev disabled">← Previous</span>`;
    }

    html += '<span class="pagination-numbers">';
    for (let i = 1; i <= totalPages; i++) {
      if (i === currentPage) {
        html += `<span class="pagination-link active">${i}</span>`;
      } else {
        html += `<a href="#${section}?page=${i}" class="pagination-link">${i}</a>`;
      }
    }
    html += '</span>';

    if (currentPage < totalPages) {
      html += `<a href="#${section}?page=${currentPage + 1}" class="pagination-link pagination-next">Next →</a>`;
    } else {
      html += `<span class="pagination-link pagination-next disabled">Next →</span>`;
    }

    html += '</nav>';
    return html;
  }

  // ── Single Post ───────────────────────────────────────────
  async function renderPost(section, slug) {
    const info = sections[section];
    contentEl.innerHTML = `<div class="loading">Loading post...</div>`;

    try {
      const raw = await fetchContent(`content/${section}/${slug}.txt`);
      const { meta, blocks } = ContentParser.parse(raw);

      let html = `
        <div class="post-view">
          <a href="#${section}" class="back-link">← Back to ${info.title}</a>
          <div class="post-header">
            <h1>${escapeHtml(meta.title || slug)}</h1>
            <div class="post-meta">
              ${meta.date ? `<span>${escapeHtml(meta.date)}</span>` : ''}
              ${meta.tags ? ` · ${meta.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ')}` : ''}
            </div>
          </div>
          <div class="post-body">
            ${ContentRenderer.renderBlocks(blocks)}
          </div>
        </div>`;

      contentEl.innerHTML = html;

      // Activate KaTeX on rendered content
      ContentRenderer.activateLatex(contentEl);
      if (window.__depStatus && window.__depStatus.katexCdnFailed) {
        renderDependencyNotice('Math rendering CDN failed. Using local fallback mode.');
      }

    } catch (e) {
      contentEl.innerHTML = `
        <div class="post-view">
          <a href="#${section}" class="back-link">← Back to ${info.title}</a>
          <div class="empty-state">Post not found: ${escapeHtml(slug)}</div>
        </div>`;
    }
  }

  // ── Gallery ───────────────────────────────────────────────
  async function renderGallery() {
    const info = sections['gallery'];
    contentEl.innerHTML = `<div class="loading">Loading gallery...</div>`;

    try {
      const raw = await fetchContent('content/gallery/index.txt');
      const { meta, blocks } = ContentParser.parse(raw);

      // Gallery index.txt uses [image] blocks
      const images = blocks
        .filter(b => b.type === 'image')
        .map(b => ContentParser.parseImageBlock(b.content));

      if (images.length === 0) {
        contentEl.innerHTML = `
          <div class="section-header">
            <h2>${info.icon} ${info.title}</h2>
            <p>${info.desc}</p>
          </div>
          <div class="empty-state">No images yet. Add [image] blocks to content/gallery/index.txt.</div>`;
        return;
      }

      let html = `
        <div class="section-header">
          <h2>${info.icon} ${info.title}</h2>
          <p>${meta.description || info.desc}</p>
        </div>
        <div class="gallery-grid">`;

      images.forEach((img, i) => {
        html += `
          <div class="gallery-item" onclick="openLightbox(${i})">
            <img src="${escapeAttr(img.src)}" alt="${escapeAttr(img.alt)}" loading="lazy">
            ${img.caption ? `<div class="gallery-caption">${escapeHtml(img.caption)}</div>` : ''}
          </div>`;
      });

      html += `</div>`;
      contentEl.innerHTML = html;

      // Store images for lightbox
      window._galleryImages = images;

    } catch {
      contentEl.innerHTML = `
        <div class="section-header">
          <h2>${info.icon} ${info.title}</h2>
          <p>${info.desc}</p>
        </div>
        <div class="empty-state">No gallery yet. Create content/gallery/index.txt to get started.</div>`;
    }
  }

  // ── Lightbox ──────────────────────────────────────────────
  window.openLightbox = function (index) {
    const images = window._galleryImages;
    if (!images || !images[index]) return;
    const img = images[index];

    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <button class="lightbox-close" onclick="this.parentElement.remove()">&times;</button>
      <img src="${escapeAttr(img.src)}" alt="${escapeAttr(img.alt)}">
      ${img.caption ? `<div class="lightbox-caption">${escapeHtml(img.caption)}</div>` : ''}`;
    lb.addEventListener('click', e => {
      if (e.target === lb) lb.remove();
    });
    document.body.appendChild(lb);
  };

  // ── Helpers ───────────────────────────────────────────────

  function renderDependencyNotice(message) {
    const existing = contentEl.querySelector('.dependency-notice');
    if (existing) return;
    const notice = document.createElement('div');
    notice.className = 'dependency-notice';
    notice.textContent = message;
    contentEl.prepend(notice);
  }

  function renderFooterLastUpdated() {
    const el = document.getElementById('footer-last-updated');
    if (!el) return;

    const source = document.lastModified;
    const dt = source ? new Date(source) : new Date();
    if (Number.isNaN(dt.getTime())) {
      el.textContent = 'Unknown';
      return;
    }

    el.textContent = dt.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  async function fetchContent(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
    return await res.text();
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

})();
