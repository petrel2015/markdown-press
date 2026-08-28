#!/usr/bin/env node
// research-report-style · favicon 产出与预览（本项目适配版）
// 用法: node tools/favicon-preview.mjs [favicon.svg] [outdir]
// 产出: favicon-16.png / favicon-32.png / apple-touch-icon-180.png
//       favicon-preview.png（亮暗双底 × 16/32 实尺寸对照，供挤眼测试）
// 与技能原版 scripts/favicon-preview.mjs 的差异：
//   1. Playwright 从本目录 tools/node_modules 解析（PW_DIR 可覆盖）；
//   2. 栅格化页面注入 vendored Spectral-Bold（base64 @font-face），
//      使 PNG 与浏览器内 SVG 渲染的字体一致。
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname, resolve } from "path";
import { pathToFileURL, fileURLToPath } from "url";

const [, , input = "favicon.svg", outdir = dirname(resolve(input))] = process.argv;
const ROOT = dirname(fileURLToPath(import.meta.url));   // tools/
const PW_DIR = process.env.PW_DIR || join(ROOT, "node_modules");
const svg = readFileSync(resolve(input), "utf8");
mkdirSync(outdir, { recursive: true });

// vendored Spectral-Bold as an inline @font-face for faithful rasterisation
const fontB64 = readFileSync(join(ROOT, "..", "fonts", "Spectral-Bold.ttf")).toString("base64");
const FONT_STYLE = `<style>@font-face{font-family:Spectral;src:url(data:font/ttf;base64,${fontB64}) format("truetype");font-weight:700;font-style:normal;}</style>`;

const { chromium } = await import(pathToFileURL(join(PW_DIR, "playwright", "index.mjs")).href);
const browser = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage();

async function raster(size, file) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<head>${FONT_STYLE}</head><body style="margin:0"><div style="width:${size}px;height:${size}px">${svg
      .replace("<svg ", `<svg width="${size}" height="${size}" `)}</div></body>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(60);
  await page.screenshot({ path: join(outdir, file), clip: { x: 0, y: 0, width: size, height: size } });
}
await raster(16, "favicon-16.png");
await raster(32, "favicon-32.png");
await raster(180, "apple-touch-icon-180.png");

// 亮暗双底实尺寸对照图（挤眼测试用）
await page.setViewportSize({ width: 420, height: 240 });
await page.setContent(`<head>${FONT_STYLE}</head><body style="margin:0;font:11px monospace">
  <div style="background:#ffffff;padding:22px;display:flex;gap:26px;align-items:center">
    <b style="color:#241f35">LIGHT</b>
    <img src="data:image/png;base64,${await b64("favicon-16.png")}" width="16" height="16">
    <img src="data:image/png;base64,${await b64("favicon-32.png")}" width="32" height="32">
    <span style="color:#8b8698">16 / 32 实尺寸</span></div>
  <div style="background:#1f1f23;padding:22px;display:flex;gap:26px;align-items:center">
    <b style="color:#e8e8e8">DARK</b>
    <img src="data:image/png;base64,${await b64("favicon-16.png")}" width="16" height="16">
    <img src="data:image/png;base64,${await b64("favicon-32.png")}" width="32" height="32">
    <span style="color:#8b8698">16 / 32 实尺寸</span></div></body>`);
await page.screenshot({ path: join(outdir, "favicon-preview.png") });

async function b64(f) { return readFileSync(join(outdir, f)).toString("base64"); }
writeFileSync(join(outdir, "_favicon_master.svg"), svg);   // 留档母版
await browser.close();
console.log("done →", outdir);
