// Pure helpers for full-page stitching. No browser APIs. MIT.
(function (root) {
  const MAX_DIM = 32767;           // conservative canvas edge limit
  const MAX_AREA = 200 * 1000000;  // conservative canvas area limit (px)

  // Scroll positions (CSS px) needed to cover totalH with viewports of viewH.
  // The final tile is aligned to the bottom so it never scrolls past the end.
  function planScrollPositions(totalH, viewH) {
    if (!(viewH > 0)) throw new Error("viewH must be > 0");
    if (totalH <= viewH) return [0];
    const out = [];
    let y = 0;
    while (y + viewH < totalH) { out.push(y); y += viewH; }
    out.push(totalH - viewH);
    return out;
  }

  // Output scale (<=1 multiplier on device pixels) so the canvas stays in limits.
  function fitScale(widthPx, heightPx) {
    let s = 1;
    if (widthPx > MAX_DIM) s = Math.min(s, MAX_DIM / widthPx);
    if (heightPx > MAX_DIM) s = Math.min(s, MAX_DIM / heightPx);
    if (widthPx * heightPx * s * s > MAX_AREA) s = Math.min(s, Math.sqrt(MAX_AREA / (widthPx * heightPx)));
    return s;
  }

  // Given tiles [{y: actualScrollY}], return draw ops {dy, sy, h} in CSS px so
  // overlap between consecutive tiles is not drawn twice.
  function placeTiles(tiles, viewH, totalH) {
    const ops = [];
    let covered = 0;
    for (const t of tiles) {
      const top = Math.max(t.y, covered);
      const bottom = Math.min(t.y + viewH, totalH);
      if (bottom <= top) continue;
      ops.push({ dy: top, sy: top - t.y, h: bottom - top });
      covered = bottom;
    }
    return ops;
  }

  function filename(template, now, ext) {
    const p = (n) => String(n).padStart(2, "0");
    const d = now;
    const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
    const base = (template || "pagewise-{date}").replace(/\{date\}/g, stamp).replace(/[\\/:*?"<>|]/g, "_");
    return `${base}.${ext}`;
  }

  const api = { planScrollPositions, fitScale, placeTiles, filename, MAX_DIM, MAX_AREA };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Stitch = api;
})(typeof self !== "undefined" ? self : this);
