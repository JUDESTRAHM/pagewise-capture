"use strict";
const PRO_ENABLED = false; // Pro features (PDF, annotate, autosave rules) are not shipped yet.
const DEFAULTS = { format: "png", quality: 92, afterCapture: "preview", template: "pagewise-{date}" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function settings() { return Object.assign({}, DEFAULTS, await browser.storage.local.get(DEFAULTS)); }
async function activeTab() { return (await browser.tabs.query({ active: true, currentWindow: true }))[0]; }
async function ensureContent(tabId) {
  await browser.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
}
const toImage = async (dataUrl) => createImageBitmap(await (await fetch(dataUrl)).blob());

async function captureVisible(tab) {
  await ensureContent(tab.id);
  const m = await browser.tabs.sendMessage(tab.id, { type: "measure" });
  const url = await browser.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  return { bitmap: await toImage(url), dpr: m.dpr };
}

async function captureFull(tab) {
  await ensureContent(tab.id);
  const m = await browser.tabs.sendMessage(tab.id, { type: "begin" });
  try {
    const positions = Stitch.planScrollPositions(m.height, m.viewH);
    const tiles = [];
    for (let i = 0; i < positions.length; i++) {
      const r = await browser.tabs.sendMessage(tab.id, { type: "scroll", y: positions[i], settle: i === 0 ? 100 : 200 });
      if (i === 1) await browser.tabs.sendMessage(tab.id, { type: "hideFixed" });
      const url = await browser.tabs.captureVisibleTab(tab.windowId, { format: "png" });
      tiles.push({ y: r.y, bitmap: await toImage(url) });
      if (i === 1) await sleep(50);
    }
    const w = tiles[0].bitmap.width, scalePx = w / m.viewW; // device px per css px
    const fit = Stitch.fitScale(w, Math.round(m.height * scalePx));
    const outW = Math.round(w * fit), outH = Math.round(m.height * scalePx * fit);
    const canvas = new OffscreenCanvas(outW, outH);
    const ctx = canvas.getContext("2d");
    return await draw(canvas, ctx, tiles, m, scalePx, fit);
  } finally {
    await browser.tabs.sendMessage(tab.id, { type: "end" }).catch(() => {});
  }
}

async function draw(canvas, ctx, tiles, m, scalePx, fit) {
  // Re-run placement but keep tile association.
  let covered = 0;
  for (const t of tiles) {
    const top = Math.max(t.y, covered), bottom = Math.min(t.y + m.viewH, m.height);
    if (bottom <= top) continue;
    ctx.drawImage(t.bitmap, 0, (top - t.y) * scalePx, t.bitmap.width, (bottom - top) * scalePx,
      0, top * scalePx * fit, t.bitmap.width * fit, (bottom - top) * scalePx * fit);
    covered = bottom;
  }
  return { canvas };
}

async function captureSelection(tab) {
  await ensureContent(tab.id);
  const r = await browser.tabs.sendMessage(tab.id, { type: "select" });
  if (!r) return null;
  const m = await browser.tabs.sendMessage(tab.id, { type: "measure" });
  const url = await browser.tabs.captureVisibleTab(tab.windowId, { format: "png", rect: { x: r.x + m.scrollX, y: r.y + m.scrollY, width: r.w, height: r.h }, scale: m.dpr });
  return { bitmap: await toImage(url) };
}

async function toBlob(res, s) {
  let canvas = res.canvas;
  if (!canvas) { canvas = new OffscreenCanvas(res.bitmap.width, res.bitmap.height); canvas.getContext("2d").drawImage(res.bitmap, 0, 0); }
  const jpg = s.format === "jpg";
  if (jpg) { // flatten transparency onto white for JPEG
    const c2 = new OffscreenCanvas(canvas.width, canvas.height), x = c2.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, c2.width, c2.height); x.drawImage(canvas, 0, 0); canvas = c2;
  }
  return canvas.convertToBlob({ type: jpg ? "image/jpeg" : "image/png", quality: s.quality / 100 });
}

function openDb() {
  return new Promise((res, rej) => {
    const q = indexedDB.open("pagewise", 1);
    q.onupgradeneeded = () => q.result.createObjectStore("shots");
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
  });
}
async function putShot(blob, name) {
  const db = await openDb();
  await new Promise((res, rej) => { const t = db.transaction("shots", "readwrite"); t.objectStore("shots").put({ blob, name }, "last"); t.oncomplete = res; t.onerror = () => rej(t.error); });
  db.close();
}

async function run(mode, tabArg) {
  const tab = tabArg || await activeTab();
  if (!tab) return;
  const s = await settings();
  try {
    const res = mode === "full" ? await captureFull(tab) : mode === "selection" ? await captureSelection(tab) : await captureVisible(tab);
    if (!res) return;
    const blob = await toBlob(res, s);
    const name = Stitch.filename(s.template, new Date(), s.format);
    if (s.afterCapture === "save") {
      const url = URL.createObjectURL(blob);
      await browser.downloads.download({ url, filename: name, saveAs: false });
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else {
      await putShot(blob, name);
      await browser.tabs.create({ url: browser.runtime.getURL("result.html"), index: tab.index + 1 });
    }
  } catch (e) {
    console.error("Pagewise capture failed", e);
    await browser.tabs.create({ url: browser.runtime.getURL("result.html") + "#error=" + encodeURIComponent(String(e && e.message || e)) });
  }
}

browser.commands.onCommand.addListener((c) => {
  if (c === "capture-full") run("full"); else if (c === "capture-visible") run("visible"); else if (c === "capture-selection") run("selection");
});
browser.runtime.onMessage.addListener((m) => { if (m && m.type === "capture") { run(m.mode); return Promise.resolve(true); } });
