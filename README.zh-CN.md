# MD·PRESS — Markdown 编辑器

[English](README.md) | [中文](README.zh-CN.md)

![Live](https://img.shields.io/badge/live-GitHub_Pages-d52b1e?link=https://petrel2015.github.io/markdown-press/)
![Pure Frontend](https://img.shields.io/badge/pure_frontend-no_backend-111111)
![Zero Build](https://img.shields.io/badge/zero_build-open_index.html-111111)
![Offline](https://img.shields.io/badge/offline-vendored_libs-111111)
![Diagrams](https://img.shields.io/badge/diagrams-mermaid-d52b1e)
![i18n](https://img.shields.io/badge/i18n-EN_%7C_%E4%B8%AD%E6%96%87-111111)

MD·PRESS 是一个纯浏览器本地的 Markdown 编辑器与预览器，承袭瑞士 / 德式排版传统：
纸白、墨黑、发丝线、一抹红，无渐变、无阴影。

> 💡 **核心目标** —— 左侧书写，右侧阅读，完成后导出。一切都在浏览器本地完成，
> 不向任何地方发送数据。

**在线体验：<https://petrel2015.github.io/markdown-press/>**

## 导出

| 导出 | 目标 | 格式 | 说明 |
|------|------|------|------|
| 打印 | A4 | PDF | 走浏览器打印对话框（"存储为 PDF"），文字矢量可选，SVG 图表原生打印 |
| 长图 | 手机（390px × 2 = 780px） | PNG | 整页长图，适合手机屏幕查看 |
| 图片 | A4（794px × 2 = 1588px） | PNG | PDF 的图片替代方案 |
| 下载 | — | `.md` | 原始源文件；`打开 .md` 可将本地文件载回 |

## 功能

- **分屏视图** —— 编辑与预览并排；分割条可拖拽（25%–75%，双击复位），
  编辑 / 分屏 / 预览三种模式随时切换
- **比例滚动同步**，两窗格联动，可在预览栏头部开关
- **Mermaid 图表** —— ` ```mermaid ` 围栏实时渲染；语法错误时回退显示
  原码与红色提示，不会破坏整页
- **语法高亮** —— 编辑器内（CodeMirror markdown 模式）与渲染预览内
  （highlight.js，单色色板 + 一处红色点缀）双端高亮
- **中英文界面** —— 顶部 EN / 中文 切换；默认跟随浏览器语言，选择会被记住
- **自适应** —— 桌面分屏；平板分屏或单栏；手机收起为 编辑 / 预览 标签
  （768px 以下隐藏分屏选项）
- **自动保存** —— 文档、文件名、语言、视图模式与分屏比例持久化到
  `localStorage`，刷新不丢失
- **状态栏** —— 光标行列、按中文字数统计的词数、字符数、行数、保存状态
- **首启动示例文档**，涵盖标题、列表、表格、代码与 Mermaid 流程图，
  所有功能一眼即达

## 运行

无构建步骤、无需安装依赖：

```sh
open index.html        # macOS
xdg-open index.html    # Linux
```

或用任意静态服务器：

```sh
python3 -m http.server 8765
# → http://localhost:8765/
```

所有第三方库以固定版本 vendored 在 `vendor/` 下 —— 页面完全离线可用，
零运行时网络请求。

## 使用说明

- 停止输入约 400ms 后自动保存，状态栏显示保存时间；`新建` 需确认后清空文档。
- `打开 .md` 接受 `.md`、`.markdown` 与 `.txt`；文件名将作为所有导出的基础名。
- A4 PDF 导出会打开打印对话框 —— 目标选择"存储为 PDF"即可。标题不会与
  后文跨页分离；代码块、表格与图表尽量避免跨页截断。

### 快捷键

| 快捷键 | 动作 |
|--------|------|
| `Cmd/Ctrl + B` | 加粗 |
| `Cmd/Ctrl + I` | 斜体 |
| `Cmd/Ctrl + K` | 插入链接 |
| `Enter`（列表内） | 续行列表 |
| `←` / `→`（聚焦分割条） | 调整分屏比例 |
| 双击分割条 | 复位 50 / 50 |

## 开发

### 项目结构

```
markdown-press/
├── index.html            页面骨架
├── css/
│   ├── style.css         设计令牌 + 应用外壳（瑞士体系）
│   ├── editor.css        CodeMirror 皮肤
│   ├── preview.css       渲染文档排版 + 高亮色板
│   └── print.css         A4 打印样式（@page 规则）
├── js/
│   ├── i18n.js           中英文字典、检测与持久化
│   ├── markdown.js       marked + highlight.js + mermaid 管线
│   ├── editor.js         CodeMirror 封装 + 格式化命令
│   ├── layout.js         视图模式、分割条、响应式强制、滚动同步
│   ├── export.js         打印 / PNG / .md 输入输出
│   └── app.js            装配、自动保存、状态栏、示例文档
├── vendor/               固定版本第三方库（离线）
└── test/
    ├── package.json      jsdom
    └── logic.test.js     DOM 驱动的逻辑测试
```

### 运行测试

```sh
cd test
npm install
node logic.test.js
```

测试套件将真实 `index.html` 载入 jsdom，通过 DOM API 驱动，覆盖：
语言检测与切换、渲染管线、Mermaid 围栏识别与降级、视图模式与手机强制单栏、
分屏比例钳制、导出尺寸与文件名校验、打印容器构建、文件打开/拒绝、状态栏统计。

### 架构说明

- **渲染流** —— `CodeMirror → 防抖(300ms) → marked.parse → 预览 innerHTML
  → mermaid.render 将围栏占位替换为 SVG`。Mermaid 源码以 URI 编码存于
  `data-src`；若 mermaid 库缺失，原码保持可见作为优雅降级。
- **图表懒加载** —— 3.3MB 的 mermaid 不再随页面预载，而是文档出现首个
  ```` ```mermaid ```` 围栏时按需注入一次；慢速网络下编辑器可交互时间提前约 88%。
- **启动容错** —— 页面内联脚本在应用装配期间将控件置为半透明的"启动中"
  状态，并捕获监听器就位前到达的点击；装配完成后回放最近一次点击，
  不再静默丢失。boot 分段隔离执行，单一环节故障不会拖垮其余功能
  （失败时状态栏会提示）。
- **导出管线** —— 打印将实时预览克隆到 `#print-root` 后调用
  `window.print()`；PNG 在离屏隐藏容器中按目标宽度重建、重渲图表、等待
  图片，再以 2 倍像素比经 html-to-image 栅格化并触发下载。
- **布局** —— 视图模式表达在 `<body data-mode>` 上，由 CSS 按断点决定
  窗格可见性；JavaScript 在 768px 以下经 `matchMedia` + resize 监听将
  `split → edit` 强制转换，CSS 手机规则是事件失效时的兜底。
- **模块模式** —— 每个模块都是挂在单一 `MD` 命名空间下的 IIFE，可选
  vendor 库均有守卫，整个应用在没有 CodeMirror / mermaid / html-to-image
  的 jsdom 环境中同样可以启动。

### 设计体系

令牌位于 `css/style.css`：墨 `#111111`、纸 `#ffffff`、发丝线 `#e4e4e4`、
唯一红色点缀 `#d52b1e`、Helvetica 系统字体栈、`01 —` 编号分节标签、
大字距全大写微标签。无渐变、无阴影、无圆角 —— 层级只来自字重、
线条与留白。

## 技术栈

- 原生 HTML / CSS / JavaScript（ES5 风格 IIFE）—— 无框架、无构建
- [CodeMirror 5.65](https://codemirror.net/) 编辑器
- [marked 12](https://marked.js.org/) + [highlight.js 11](https://highlightjs.org/) 渲染
- [mermaid 10](https://mermaid.js.org/) 图表
- [html-to-image 1.11](https://github.com/bubkoo/html-to-image) PNG 导出
- [jsdom](https://github.com/jsdom/jsdom) 测试

## 注意与限制

- ⚠️ 被 CORS 拦截的远程图片无法进入 PNG 导出；本地与 data-URI 图片不受影响。
- A4 PDF 有意走浏览器打印对话框 —— 这能保住矢量可选文字，是栅格化方案
  做不到的。

## 请我喝杯咖啡

**请我喝杯咖啡 ￥4.9** ☕

<table>
  <tr>
    <td align="center"><img src="docs/donate/alipay-qr.png" width="200" alt="支付宝收款码"><br>支付宝</td>
    <td align="center"><img src="docs/donate/wechat-qr.png" width="200" alt="微信收款码"><br>微信</td>
  </tr>
</table>
