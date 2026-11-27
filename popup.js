for (const b of document.querySelectorAll("button")) b.onclick = async () => { await browser.runtime.sendMessage({ type: "capture", mode: b.dataset.m }); window.close(); };
document.getElementById("opt").onclick = (e) => { e.preventDefault(); browser.runtime.openOptionsPage(); window.close(); };
