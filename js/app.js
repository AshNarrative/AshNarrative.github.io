/**
 * app.js — Main application: routing, content loading, UI logic
 */

(function () {
  'use strict';

  const contentEl = document.getElementById('content');
  const navLinks = document.querySelectorAll('.nav-link');

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
    const hash = window.location.hash.slice(1) || 'home';
    const parts = hash.split('/');
    return { section: parts[0], slug: parts[1] || null };
  }

  function navigate() {
    const route = getRoute();

    // Update active nav
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === route.section);
    });

    if (route.section === 'home') {
      renderHome();
    } else if (route.section === 'gallery') {
      renderGallery();
    } else if (route.slug) {
      renderPost(route.section, route.slug);
    } else if (sections[route.section]) {
      renderSection(route.section);
    } else {
      renderHome();
    }
  }

  window.addEventListener('hashchange', navigate);
  window.addEventListener('DOMContentLoaded', navigate);

  // ── Home ──────────────────────────────────────────────────
  function renderHome() {
    let html = `
      <div class="home-section">
        <h2 class="welcome-title">Welcome to Signal &amp; Noise</h2>
        <p class="welcome-text">
          A personal space for electrical engineering notes, project logs,
          random musings about shows and life, and a gallery of memorable moments.
          Everything here is rendered from plain <strong>.txt</strong> files — no backend, no databases,
          just pure HTML, CSS, and JavaScript.
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
  }

  // ── Section List ──────────────────────────────────────────
  async function renderSection(section) {
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

      let html = `
        <div class="section-header">
          <h2>${info.icon} ${info.title}</h2>
          <p>${info.desc}</p>
        </div>
        <div class="post-list">`;

      for (const post of validPosts) {
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
