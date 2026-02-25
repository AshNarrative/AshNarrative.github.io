/**
 * renderer.js — Renders parsed blocks into HTML
 */

const ContentRenderer = (() => {
  'use strict';

  /**
   * Render a text block: split into paragraphs, apply inline formatting
   */
  function renderText(content) {
    const paragraphs = content.split(/\n\n+/).filter(Boolean);
    const html = paragraphs.map(p => {
      const formatted = ContentParser.formatInline(p.replace(/\n/g, ' '));
      return `<p>${formatted}</p>`;
    }).join('');
    return `<div class="block block-text">${html}</div>`;
  }

  /**
   * Render a LaTeX block using KaTeX
   */
  function renderLatex(content) {
    const id = 'latex-' + Math.random().toString(36).slice(2, 9);
    // We'll render after DOM insertion via renderMathInElement
    return `<div class="block block-latex" id="${id}">${escapeHtml(content)}</div>`;
  }

  /**
   * Render an image block
   */
  function renderImage(content) {
    const img = ContentParser.parseImageBlock(content);
    let html = `<div class="block block-image">`;
    html += `<img src="${escapeAttr(img.src)}" alt="${escapeAttr(img.alt)}" loading="lazy">`;
    if (img.caption) {
      html += `<div class="caption">${escapeHtml(img.caption)}</div>`;
    }
    html += `</div>`;
    return html;
  }

  /**
   * Render a code block
   */
  function renderCode(content) {
    return `<div class="block block-code"><pre>${escapeHtml(content)}</pre></div>`;
  }

  /**
   * Render a quote block
   */
  function renderQuote(content) {
    const formatted = ContentParser.formatInline(content.replace(/\n/g, '<br>'));
    return `<div class="block block-quote">${formatted}</div>`;
  }

  /**
   * Render a heading block
   */
  function renderHeading(content) {
    // Default to h2, support ## and ### prefixes
    let level = 2;
    let text = content;
    const match = content.match(/^(#{2,3})\s*(.*)/);
    if (match) {
      level = match[1].length;
      text = match[2];
    }
    const cls = `h${level}`;
    const tag = `h${level}`;
    return `<${tag} class="block block-heading ${cls}">${ContentParser.formatInline(text)}</${tag}>`;
  }

  /**
   * Render a list block
   */
  function renderList(content) {
    return `<div class="block block-list">${ContentParser.parseListBlock(content)}</div>`;
  }

  /**
   * Render a divider
   */
  function renderDivider() {
    return `<hr class="block block-divider">`;
  }

  /**
   * Render all blocks to HTML string
   */
  function renderBlocks(blocks) {
    return blocks.map(block => {
      switch (block.type) {
        case 'text':    return renderText(block.content);
        case 'latex':   return renderLatex(block.content);
        case 'image':   return renderImage(block.content);
        case 'code':    return renderCode(block.content);
        case 'quote':   return renderQuote(block.content);
        case 'heading': return renderHeading(block.content);
        case 'list':    return renderList(block.content);
        case 'divider': return renderDivider();
        default:        return renderText(block.content);
      }
    }).join('\n');
  }

  /**
   * After inserting rendered HTML, call this to activate KaTeX
   */
  function activateLatex(container) {
    if (typeof renderMathInElement !== 'undefined') {
      renderMathInElement(container, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    }
    // Also render standalone latex blocks
    container.querySelectorAll('.block-latex').forEach(el => {
      if (typeof katex !== 'undefined' && !el.querySelector('.katex')) {
        try {
          const raw = el.textContent.trim();
          katex.render(raw, el, { displayMode: true, throwOnError: false });
        } catch (e) {
          // Leave text as-is if KaTeX fails
        }
      }
    });
  }

  // Helpers
  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return {
    renderBlocks,
    activateLatex,
    renderText,
    renderLatex,
    renderImage,
    renderCode,
    renderQuote,
    renderHeading,
    renderList,
    renderDivider
  };
})();
