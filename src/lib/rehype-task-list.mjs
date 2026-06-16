/**
 * Clean up GFM task-list items.
 *
 * GFM renders `- [ ] todo` (with a nested list) as roughly:
 *   <li><input> · " " · "todo" · "\n" · <ul>…</ul> · "\n"</li>
 * i.e. a stray separator space after the checkbox plus newline whitespace nodes
 * around the nested list. This plugin drops those whitespace-only text nodes at
 * the edges / next to the checkbox / next to a nested list, so the markup is
 * tight: <li><input>todo<ul>…</ul></li>. The checkbox→label gap is CSS margin.
 *
 * Whitespace-only nodes *between inline content* are left alone so inline
 * spacing (e.g. `todo **bold** x`) is never collapsed.
 */
export function rehypeTrimTaskListLabels() {
  const isWs = (c) => c.type === 'text' && c.value.trim() === ''
  const isList = (c) => c?.type === 'element' && (c.tagName === 'ul' || c.tagName === 'ol')
  const isInput = (c) => c?.type === 'element' && c.tagName === 'input'

  return (tree) => {
    const walk = (node) => {
      const cls = node?.properties?.className
      if (Array.isArray(cls) && cls.includes('task-list-item') && Array.isArray(node.children)) {
        const ch = node.children
        node.children = ch.filter((c, i) => {
          if (!isWs(c)) return true
          const atEdge = i === 0 || i === ch.length - 1
          return !(atEdge || isInput(ch[i - 1]) || isList(ch[i - 1]) || isList(ch[i + 1]))
        })
        const firstText = node.children.find((c) => c.type === 'text')
        if (firstText) firstText.value = firstText.value.replace(/^[ \t]+/, '')
      }
      if (Array.isArray(node.children)) node.children.forEach(walk)
    }
    walk(tree)
  }
}
