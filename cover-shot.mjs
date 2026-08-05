import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await p.goto("file://" + process.cwd() + "/cover-slides.html", { waitUntil: "networkidle" });
await p.waitForTimeout(1800); // webfonts + iconify
const s = await p.$$("section");
for (let i = 0; i < s.length; i++) await s[i].screenshot({ path: `cover-${i + 1}.png` });
console.log("shot", s.length, "covers");
await b.close();
