# Pagewise Capture: Full Page Screenshot

A small Firefox extension that captures the visible area, the whole page, or a region you drag out. Save as PNG or JPG, or copy to the clipboard. No shutter sound, no account, no tracking.

## Features
- Visible area, full page (scroll and stitch, fixed headers hidden after the first tile), selected area
- PNG or JPG download, copy to clipboard from the preview tab
- Optional "save immediately" mode with a file name template
- Keyboard shortcuts: Alt+Shift+F (full page), Alt+Shift+V (visible), Alt+Shift+S (selection), Alt+Shift+P (popup). Rebind in about:addons.
- Very tall pages are scaled down to stay inside browser canvas limits

## Known limits
- Selection works inside the visible part of the page.
- Pages that scroll inside an inner container (not the window) capture only the window scroll.
- Lazy-loaded content that loads on scroll is captured as it appears; very slow pages may show gaps.
- Not yet tested in a live Firefox by the author at v1.0.0 (lint and unit tests only). Please open an issue if something fails.
- PDF export, annotation and autosave rules are planned but not included (stubbed off).

## Privacy
Everything runs on your device. The extension makes no network requests, sends nothing anywhere, and stores only your settings in local extension storage. Permissions: activeTab (capture the tab you invoke it on), scripting (measure and scroll that tab), downloads (save files), storage (settings), clipboardWrite (copy).

## Develop
```
npm test        # unit tests for stitching logic (node)
npx web-ext lint
npx web-ext build
```
MIT licensed.
