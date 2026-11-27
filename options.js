const D = { format: "png", quality: 92, afterCapture: "preview", template: "pagewise-{date}" };
const ids = Object.keys(D);
browser.storage.local.get(D).then((v) => { for (const k of ids) document.getElementById(k).value = v[k]; });
for (const k of ids) document.getElementById(k).addEventListener("change", async (e) => {
  let val = e.target.value; if (k === "quality") val = Math.min(100, Math.max(1, +val || 92));
  await browser.storage.local.set({ [k]: val }); document.getElementById("saved").textContent = "Saved.";
});
