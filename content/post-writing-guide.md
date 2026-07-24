# AshNarrative post writing guide

Use this as a quick reference when adding or editing posts in `content/`.

## 1. Where posts live

Each section has an `index.txt` and one `.txt` file per post.

```text
content/
  lab-notes/
    index.txt
    my-post.txt
  projects/
    index.txt
    my-project.txt
  musings/
    index.txt
    my-thought.txt
```

Add the post filename **without** `.txt` to that section's `index.txt`:

```text
my-project
another-project
```

## 2. Frontmatter

Every post starts with metadata between `---` lines:

```yaml
---
title: 8086 Assembly Programming
date: 2026-07-24
tags: [asm, 8086]
excerpt: A short sentence shown on listing cards.
cover: content/gallery/upload/example.png
---
```

Notes:

- `title` is shown at the top of the post.
- `date` should use `YYYY-MM-DD`.
- `tags` can be written as `[tag one, tag two]` or `tag one, tag two`.
- `excerpt` is optional but recommended for post cards.
- `cover` is optional.

## 3. Content blocks

After the frontmatter, write the post as blocks. A block starts with a marker like `[text]` or `[ascii]`.

### Text

```text
[text]
This is a normal paragraph.

Blank lines create another paragraph inside the same text block.
Inline formatting supports **bold**, *italic*, `inline code`, and [links](https://example.com).
```

### Headings

```text
[heading]
My section title

[heading]
### Smaller heading
```

Use `[heading]` for section titles. Add `##` or `###` if you want to control heading size.

### ASCII art and diagrams

Use `[ascii]` for tables, circuit drawings, terminal layouts, memory maps, and anything where spaces must line up.

```text
[ascii]
+-------+------+
| Box 0 | 0101 |
+-------+------+
| Box 1 | 1110 |
+-------+------+
```

Tips for clean ASCII:

- Put the whole drawing in **one** `[ascii]` block.
- Do **not** put `[text]` before every line of the drawing.
- Use spaces, not proportional alignment in normal text.
- Very wide diagrams are okay; the site will keep the spacing and allow horizontal scrolling.
- `[diagram]` also works as an alias for `[ascii]`.

### Code

Use `[code]` for source code snippets.

```text
[code]
MOV AX, 0001h
INT 21h
```

### LaTeX / math

```text
[latex]
V = I R
```

Inline math can also be written in text blocks with `$V = IR$`.

### Images

```text
[image]
src: content/gallery/upload/example.png
alt: Short description of the image
caption: Optional caption shown below the image
```

### Quotes

```text
[quote]
A short quote or note can go here.
```

### Lists

```text
[list]
- First item
- Second item
- Third item
```

Numbered lists work too:

```text
[list]
1. First step
2. Second step
3. Third step
```

### Divider

```text
[divider]
```

## 4. Minimal post template

Copy this when making a new post:

```text
---
title: My New Post
date: 2026-07-24
tags: [tag]
excerpt: One sentence summary.
---

[text]
Opening paragraph.

[heading]
First section

[text]
More writing here.

[ascii]
+-----+
| art |
+-----+
```
