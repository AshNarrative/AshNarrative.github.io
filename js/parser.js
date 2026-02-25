/**
 * parser.js — Parses .txt content files into structured data
 *
 * File format:
 * ---
 * title: Post Title
 * date: 2024-01-15
 * tags: circuits, resistors
 * excerpt: A brief description
 * cover: images/photo.jpg
 * ---
 *
 * [text]
 * Paragraph of text. Supports **bold** and *italic*.
 *
 * [heading] My Section Title
 *
 * [latex]
 * V = IR
 *
 * [image]
 * src: images/circuit.jpg
 * caption: My circuit
 *
 * [code]
 * console.log("hello");
 *
 * [quote]
 * "Great Scott!" - Doc Brown
 *
 * [list]
 * - Item one
 * - Item two
 *
 * [divider]
 */

const ContentParser = (() => {
  'use strict';

  /**
   * Parse the frontmatter between --- delimiters
   */
  function parseFrontmatter(raw) {
    const meta = {};
    const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!fmMatch) return { meta, bodyRaw: raw };

    const fmBlock = fmMatch[1];
    const bodyRaw = raw.slice(fmMatch[0].length).trim();

    for (const line of fmBlock.split('\n')) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim().toLowerCase();
      let value = line.slice(idx + 1).trim();

      if (key === 'tags') {
        value = value.split(',').map(t => t.trim()).filter(Boolean);
      }
      meta[key] = value;
    }

    return { meta, bodyRaw };
  }

  /**
   * Parse body content into an array of typed blocks
   */
  function parseBody(bodyRaw) {
    const blocks = [];
    if (!bodyRaw) return blocks;

    // Split on block markers: [type] or [type] inline-content
    const parts = bodyRaw.split(/^\[(\w+)\]\s*(.*)?$/m);

    // parts[0] = text before first marker (if any)
    // then groups of 3: [matchedType, inlineContent, blockBody]
    if (parts[0] && parts[0].trim()) {
      blocks.push({ type: 'text', content: parts[0].trim() });
    }

    for (let i = 1; i < parts.length; i += 3) {
      const type = parts[i];
      const inline = (parts[i + 1] || '').trim();
      const body = (parts[i + 2] || '').trim();
      const content = inline ? (body ? inline + '\n' + body : inline) : body;

      blocks.push({ type, content });
    }

    return blocks;
  }

  /**
   * Parse an image block's key:value lines
   */
  function parseImageBlock(content) {
    const result = { src: '', caption: '', alt: '' };
    for (const line of content.split('\n')) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim().toLowerCase();
      const val = line.slice(idx + 1).trim();
      if (key === 'src') result.src = val;
      else if (key === 'caption') result.caption = val;
      else if (key === 'alt') result.alt = val;
    }
    if (!result.alt) result.alt = result.caption || 'image';
    return result;
  }

  /**
   * Format inline text: **bold**, *italic*, `code`, [links](url)
   */
  function formatInline(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  /**
   * Parse a list block into HTML
   */
  function parseListBlock(content) {
    const lines = content.split('\n').filter(l => l.trim());
    const ordered = /^\d+[\.\)]/.test(lines[0]);
    const tag = ordered ? 'ol' : 'ul';
    const items = lines.map(l => {
      const text = l.replace(/^[-*]\s*/, '').replace(/^\d+[\.\)]\s*/, '');
      return `<li>${formatInline(text)}</li>`;
    }).join('');
    return `<${tag}>${items}</${tag}>`;
  }

  /**
   * Parse an index.txt file that lists available posts
   * Format: one filename per line (without .txt extension)
   */
  function parseIndex(raw) {
    return raw.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  }

  /**
   * Full parse: returns { meta, blocks }
   */
  function parse(raw) {
    const { meta, bodyRaw } = parseFrontmatter(raw);
    const blocks = parseBody(bodyRaw);
    return { meta, blocks };
  }

  return {
    parse,
    parseFrontmatter,
    parseBody,
    parseImageBlock,
    parseListBlock,
    formatInline,
    parseIndex
  };
})();
