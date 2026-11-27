const $ = (i) => document.getElementById(i);
const m = /#error=(.*)/.exec(location.hash);
if (m) { $("err").textContent = "Capture failed: " + decodeURIComponent(m[1]); $("save").hidden = $("copy").hidden = true; }
else {
  const q = indexedDB.open("pagewise", 1);
  q.onsuccess = () => {
    const g = q.result.transaction("shots").objectStore("shots").get("last");
    g.onsuccess = () => {
      const { blob, name } = g.result || {};
      if (!blob) { $("err").textContent = "Nothing to show."; return; }
      const url = URL.createObjectURL(blob); $("img").src = url;
      $("save").onclick = () => browser.downloads.download({ url, filename: name, saveAs: false }).then(() => ($("msg").textContent = "Saved to Downloads."));
      $("copy").onclick = async () => {
        try {
          let b = blob;
          if (b.type !== "image/png") { const bm = await createImageBitmap(b), c = new OffscreenCanvas(bm.width, bm.height); c.getContext("2d").drawImage(bm, 0, 0); b = await c.convertToBlob({ type: "image/png" }); }
          await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]); $("msg").textContent = "Copied.";
        } catch (e) { $("msg").textContent = "Copy failed: " + e.message; }
      };
    };
  };
}
