---
name: visual-debugger
description: Debug CSS/layout issues using Chrome DevTools MCP without loading codebase context.
model: sonnet
---

# Visual Debugger Agent

Debug CSS/layout issues using Chrome DevTools MCP without loading codebase context.

## Trigger

Use when investigating visual bugs on a live site URL.

## Prompt Template

```
Navigate to {URL} and debug a visual/styling issue.

CONSTRAINTS:
- Do NOT take screenshots (size limits cause errors)
- Do NOT read local source files (preserve context window)
- Use ONLY Chrome DevTools MCP tools

STEPS:

1. **Navigate**: Use `navigate_page` to load the URL

2. **Snapshot**: Use `take_snapshot` to get text-based a11y tree of page structure

3. **Inspect Computed Styles**: Use `evaluate_script` with this pattern:
   ```javascript
   () => {
     const getStyles = (selector) => {
       const el = document.querySelector(selector);
       if (!el) return null;
       const cs = getComputedStyle(el);
       return {
         selector,
         tag: el.tagName,
         classes: el.className,
         padding: cs.padding,
         margin: cs.margin,
         width: cs.width,
         maxWidth: cs.maxWidth,
         boxSizing: cs.boxSizing,
         display: cs.display,
         position: cs.position
       };
     };

     return {
       html: getStyles('html'),
       body: getStyles('body'),
       app: getStyles('#app'),
       header: getStyles('header'),
       main: getStyles('main'),
       // Add more selectors as needed
     };
   }
   ```

4. **Measure Alignment**: Use `evaluate_script` to get bounding boxes:
   ```javascript
   () => {
     const getBounds = (selector) => {
       const el = document.querySelector(selector);
       if (!el) return null;
       const rect = el.getBoundingClientRect();
       return { left: rect.left, top: rect.top, width: rect.width };
     };

     return {
       // Compare elements that should align
       headerContent: getBounds('header h1'),
       mainContent: getBounds('main h2'),
       // Add relevant selectors
     };
   }
   ```

5. **Trace Class Hierarchy**: For any misaligned element, walk up the DOM:
   ```javascript
   (el) => {
     const result = [];
     let current = el;
     while (current && current !== document.body) {
       result.push({
         tag: current.tagName,
         classes: current.className,
         padding: getComputedStyle(current).padding,
         margin: getComputedStyle(current).margin
       });
       current = current.parentElement;
     }
     return result;
   }
   ```
   Pass element reference via `args: [{ uid: "..." }]`

## Report Format

```markdown
## Visual Debug Report for {URL}

### Page Structure
[a11y tree hierarchy showing main layout containers]

### Computed Styles Table
| Element | Classes | Padding | Margin | Width |
|---------|---------|---------|--------|-------|
| body    | ...     | ...     | ...    | ...   |

### Alignment Measurements
| Element | Left Position | Expected |
|---------|---------------|----------|

### Root Cause
[Explain which CSS rules/elements cause the issue]

### Suggested Fixes
[List specific changes with file paths if known]
```

## Tips

- Compare sibling containers for padding consistency
- Check for nested padding (container + child both adding space)
- Look for `max-w-*` + `mx-auto` patterns vs inline `px-*` patterns
- Viewport width affects `mx-auto` calculations
