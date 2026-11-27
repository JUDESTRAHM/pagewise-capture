// Injected on demand (activeTab). Measures, scrolls and draws the selection overlay.
(function () {
  if (window.__pwcInstalled) return;
  window.__pwcInstalled = true;
  let saved = null, hidden = [];

  function measure() {
    const de = document.documentElement, b = document.body;
    return {
      width: Math.max(de.scrollWidth, b ? b.scrollWidth : 0, de.clientWidth),
      height: Math.max(de.scrollHeight, b ? b.scrollHeight : 0, de.clientHeight),
      viewW: window.innerWidth, viewH: window.innerHeight,
      dpr: window.devicePixelRatio || 1, scrollX: window.scrollX, scrollY: window.scrollY
    };
  }
  function hideFixed() {
    hidden = [];
    for (const el of document.querySelectorAll("*")) {
      const pos = getComputedStyle(el).position;
      if (pos === "fixed" || pos === "sticky") {
        hidden.push([el, el.style.getPropertyValue("visibility"), el.style.getPropertyPriority("visibility")]);
        el.style.setProperty("visibility", "hidden", "important");
      }
    }
  }
  function restoreFixed() {
    for (const [el, v, p] of hidden) { if (v) el.style.setProperty("visibility", v, p); else el.style.removeProperty("visibility"); }
    hidden = [];
  }
  function selectRegion() {
    return new Promise((resolve) => {
      const o = document.createElement("div");
      o.style.cssText = "position:fixed;inset:0;z-index:2147483647;cursor:crosshair;background:rgba(0,0,0,.25)";
      const box = document.createElement("div");
      box.style.cssText = "position:fixed;border:2px dashed #fff;outline:1px solid #000;display:none;pointer-events:none";
      o.appendChild(box); document.documentElement.appendChild(o);
      let sx, sy, rect = null;
      const done = (r) => { window.removeEventListener("keydown", key, true); o.remove(); resolve(r); };
      const key = (e) => { if (e.key === "Escape") { e.preventDefault(); done(null); } };
      window.addEventListener("keydown", key, true);
      o.addEventListener("mousedown", (e) => { sx = e.clientX; sy = e.clientY; box.style.display = "block"; e.preventDefault(); });
      o.addEventListener("mousemove", (e) => {
        if (sx === undefined) return;
        rect = { x: Math.min(sx, e.clientX), y: Math.min(sy, e.clientY), w: Math.abs(e.clientX - sx), h: Math.abs(e.clientY - sy) };
        Object.assign(box.style, { left: rect.x + "px", top: rect.y + "px", width: rect.w + "px", height: rect.h + "px" });
      });
      o.addEventListener("mouseup", () => {
        if (rect && rect.w > 4 && rect.h > 4) { o.style.display = "none"; setTimeout(() => done(rect), 120); } else done(null);
      });
    });
  }

  browser.runtime.onMessage.addListener((m) => {
    switch (m.type) {
      case "measure": return Promise.resolve(measure());
      case "begin": saved = { x: window.scrollX, y: window.scrollY, sb: document.documentElement.style.scrollBehavior };
        document.documentElement.style.scrollBehavior = "auto"; return Promise.resolve(measure());
      case "scroll": window.scrollTo(saved ? saved.x : 0, m.y);
        return new Promise((r) => setTimeout(() => r({ y: window.scrollY }), m.settle || 150));
      case "hideFixed": hideFixed(); return Promise.resolve(true);
      case "end": restoreFixed();
        if (saved) { window.scrollTo(saved.x, saved.y); document.documentElement.style.scrollBehavior = saved.sb; saved = null; }
        return Promise.resolve(true);
      case "select": return selectRegion();
    }
  });
})();
