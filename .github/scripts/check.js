// Fails the deploy if any page or script has a JavaScript syntax error.
const fs = require("fs");
let bad = 0;
for (const f of ["shared.js", "trivia.js", "sfx.js"]) {
  try { new Function(fs.readFileSync(f, "utf8")); } catch (e) { console.error(f + ": " + e.message); bad++; }
}
for (const f of fs.readdirSync(".").filter((x) => x.endsWith(".html"))) {
  const h = fs.readFileSync(f, "utf8");
  const blocks = [...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  blocks.forEach((b, i) => { try { new Function(b); } catch (e) { console.error(f + " script " + i + ": " + e.message); bad++; } });
}
if (bad) process.exit(1);
console.log("JavaScript OK");
