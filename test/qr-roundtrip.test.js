/* QR 回环测试（buy-me-coffee 技能资产，适配本项目路径）
   用页面同款绘制算法渲染二维码位图 → jsQR 解码 → 与支付链接逐字一致，
   并输出 PNG 样张供人工扫码验收。运行：node qr-roundtrip.test.js */

const fs = require('fs');
const path = require('path');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');

// 本项目 vendored 的 QR 库（与页面 lazy-load 的是同一份文件）
const qrcode = require('../vendor/qrcode-generator.js');

// 与 js/donation.js 相同的绘制参数
const QR_DISPLAY_SIZE = 220;
const QR_ECC = 'M';
const QR_QUIET_MODULES = 4;

const EXPECTED = {
  alipay: 'https://qr.alipay.com/fkx16432isyyhmx9ttwpi79',
  wechat: 'wxp://f2f1fJpOcJc7F-MSeLMxALhc6tWu-oohtxueHRbCe98bMy2AmDunimuOJFv-8bjobLBM'
};

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
}

function renderToPixels(content, scaleBoost) {
  const qr = qrcode(0, QR_ECC);
  qr.addData(content);
  qr.make();
  const modules = qr.getModuleCount();
  const total = modules + QR_QUIET_MODULES * 2;
  const px = Math.max(1, Math.floor(QR_DISPLAY_SIZE / total)) * (scaleBoost || 4);
  const size = px * total;
  const png = new PNG({ width: size, height: size });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 255; png.data[i + 1] = 255; png.data[i + 2] = 255; png.data[i + 3] = 255;
  }
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (!qr.isDark(row, col)) continue;
      const x0 = (col + QR_QUIET_MODULES) * px;
      const y0 = (row + QR_QUIET_MODULES) * px;
      for (let dy = 0; dy < px; dy++) {
        for (let dx = 0; dx < px; dx++) {
          const idx = (size * (y0 + dy) + (x0 + dx)) * 4;
          png.data[idx] = 17; png.data[idx + 1] = 17; png.data[idx + 2] = 17;
        }
      }
    }
  }
  return { png, modules, total };
}

console.log('QR 回环验证（页面同款算法 + jsQR 解码）');
for (const [channel, content] of Object.entries(EXPECTED)) {
  console.log('— ' + channel);
  const { png, modules, total } = renderToPixels(content);
  check('编码成功且自动选型 (' + modules + ' modules)', modules >= 21 && modules <= 177);
  check('静区 ≥ 4 modules (total ' + total + ')', total - modules >= QR_QUIET_MODULES * 2);
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  check('jsQR 解码成功', !!decoded);
  check('解码内容逐字一致', !!decoded && decoded.data === content);

  const sample = renderToPixels(content, 6);
  fs.writeFileSync(path.join(__dirname, 'qr-sample-' + channel + '.png'), PNG.sync.write(sample.png));
}

console.log('\n样张: qr-sample-alipay.png / qr-sample-wechat.png（可人工扫码验收）');
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
