const assert = require("assert"); const S = require("../lib/stitch.js");
assert.deepStrictEqual(S.planScrollPositions(500, 800), [0]);
assert.deepStrictEqual(S.planScrollPositions(800, 800), [0]);
assert.deepStrictEqual(S.planScrollPositions(2000, 800), [0, 800, 1200]);
assert.deepStrictEqual(S.planScrollPositions(1600, 800), [0, 800]);
// coverage: placements must cover [0,total) exactly once
for (const [tot, v] of [[2000,800],[1601,800],[9999,733],[801,800]]) {
  const tiles = S.planScrollPositions(tot, v).map((y) => ({ y }));
  const ops = S.placeTiles(tiles, v, tot); let c = 0;
  for (const o of ops) { assert.strictEqual(o.dy, c); assert(o.sy >= 0 && o.sy + o.h <= v); c += o.h; }
  assert.strictEqual(c, tot);
}
// page clamped scroll (actual y differs from planned)
{ const ops = S.placeTiles([{y:0},{y:800},{y:1000}], 800, 1800); assert.strictEqual(ops.reduce((a,o)=>a+o.h,0), 1800); }
assert.strictEqual(S.fitScale(1000, 5000), 1);
assert(S.fitScale(1000, 100000) < 1 && 100000 * S.fitScale(1000, 100000) <= S.MAX_DIM + 1);
assert(S.fitScale(5000, 50000) * 5000 * S.fitScale(5000, 50000) * 50000 <= S.MAX_AREA * 1.001);
assert.strictEqual(S.filename("a/b-{date}", new Date(2026,10,27,5,6,7), "png"), "a_b-2026-11-27_05-06-07.png");
console.log("stitch tests ok");
