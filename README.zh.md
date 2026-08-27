# MD·PRESS — Markdown 编辑器

[English](./README.md) | 简体中文

![Live](https://img.shields.io/badge/live-GitHub_Pages-d52b1e?link=https://petrel2015.github.io/markdown-press/)
![Pure Frontend](https://img.shields.io/badge/pure_frontend-no_backend-111111)
![Zero Build](https://img.shields.io/badge/zero_build-open_index.html-111111)
![Offline](https://img.shields.io/badge/offline-vendored_libs-111111)
![Diagrams](https://img.shields.io/badge/diagrams-mermaid-d52b1e)
![i18n](https://img.shields.io/badge/i18n-EN_%7C_%E4%B8%AD%E6%96%87-111111)

MD·PRESS 是一个纯浏览器本地的 Markdown 编辑器与预览器，承袭瑞士 / 德式排版
传统：纸白、墨黑、发丝线、一抹红，无渐变、无阴影。

多数 Markdown 工具要么把文档锁进云端账号，要么用工具栏和界面杂讯淹没书写
本身。MD·PRESS 反其道而行：一个随处可开的 HTML 文件，一处安静的分屏视图——
左侧书写，右侧阅读——以及能直接交给他人的导出（A4 PDF、手机长图）。没有
账号、没有服务器、没有构建步骤，你的文字永远不离开浏览器。

> 🤖 AI 助手与智能体：如需结构化、机器友好的项目说明，请阅读
> [README_FOR_AI.md](./README_FOR_AI.md)（英文）。

**在线体验：<https://petrel2015.github.io/markdown-press/>**

页面加载后完全离线可用，无需注册。

## 导出

| 导出 | 目标 | 格式 | 说明 |
|------|------|------|------|
| 打印 | A4 | PDF | 走浏览器打印对话框（"存储为 PDF"），文字矢量可选，SVG 图表原生打印 |
| 长图 | 手机（390px × 2 = 780px） | PNG | 整页长图，适合手机屏幕查看 |
| 图片 | A4（794px × 2 = 1588px） | PNG | PDF 的图片替代方案 |
| 下载 | — | `.md` | 原始源文件；`打开 .md` 可将本地文件载回 |

![MD·PRESS 桌面分屏视图——左侧编辑，右侧渲染预览](docs/img/desktop-overview-zh.webp)

## 功能

- **不打扰的分屏视图** —— 编辑与预览并排；分割条可拖拽（25%–75%，双击
  复位），编辑 / 分屏 / 预览三种模式随时切换。比例滚动同步让两窗格保持
  联动，可在预览栏头部开关。
  → 用法：[使用说明 · 书写](docs/zh/usage.md#书写) —— 设计细节：
  [功能设计/分屏编辑布局](docs/zh/features/split-editor-layout.md)
- **Mermaid 图表与优雅降级** —— ` ```mermaid ` 围栏实时渲染为 SVG；语法
  错误时回退显示原码与红色提示，不会破坏整页。3.3 MB 的 mermaid 库按需
  懒加载一次，文档里没有图表就完全不加载。
  → [使用说明 · 图表](docs/zh/usage.md#图表) ·
  [功能设计/Mermaid 图表](docs/zh/features/mermaid-diagrams.md)

  ![预览窗格中渲染完成的 Mermaid 流程图](docs/img/mermaid-diagram-en.webp)

- **四条导出路径** —— 经打印对话框的 A4 PDF（矢量可选文字）、手机长图
  PNG、A4 宽度 PNG，以及纯 `.md` 的下载 / 打开。导出文件名跟随文档名；
  图表与代码在四条路径下均可保留。
  → [使用说明 · 导出](docs/zh/usage.md#导出) ·
  [功能设计/导出管线](docs/zh/features/export-pipeline.md)

  ![导出菜单与三个导出目标](docs/img/export-menu-en.webp)

- **中英文界面** —— 顶部 EN / 中文 切换；默认跟随浏览器语言，选择会被
  记住。首启动示例文档同样本地化。
  → [使用说明 · 语言](docs/zh/usage.md#语言) ·
  [功能设计/中英文界面](docs/zh/features/bilingual-interface.md)
- **自适应** —— 桌面分屏；平板分屏或单栏；手机收起为 编辑 / 预览 标签
  （768px 以下隐藏分屏选项）。
  → [使用说明 · 手机上](docs/zh/usage.md#手机上)

  ![手机布局与 编辑 / 预览 标签](docs/img/mobile-tabs-zh.webp)

- **自动保存** —— 文档、文件名、语言、视图模式与分屏比例持久化到
  `localStorage`，刷新不丢失，也不会被同步到任何地方。
  → [使用说明 · 自动保存与存储](docs/zh/usage.md#自动保存与存储) ·
  [隐私](docs/zh/privacy.md)
- **状态栏** —— 光标行列、按中文字数统计的词数、字符数、行数、保存状态
- **首启动示例文档**，涵盖标题、列表、表格、代码与 Mermaid 流程图，
  所有功能一眼即达

## 快速开始

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

> **注意** —— 图表需要页面经 `http(s)` 访问。直接以 `file://` 打开
> `index.html` 时，编辑、预览与导出照常可用，但 Mermaid 围栏有意保持
> 原码不渲染（见[故障排查](docs/zh/troubleshooting.md#图表显示为源码)）。

所有第三方库以固定版本 vendored 在 `vendor/` 下 —— 页面运行时对第三方
主机零请求（[详情](docs/zh/privacy.md#网络行为)）。

## 基本用法

- 左侧输入，右侧阅读；停止输入约 400ms 后自动保存。
- `打开 .md` 接受 `.md`、`.markdown` 与 `.txt`；文件名将作为所有导出的
  基础名。
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

完整操作指南：[docs/zh/usage.md](docs/zh/usage.md)。

## 技术栈

- 原生 HTML / CSS / JavaScript（ES5 风格 IIFE）—— 无框架、无构建
- [CodeMirror 5.65.16](https://codemirror.net/5/) 编辑器
- [marked 12.0.2](https://marked.js.org/) + [highlight.js 11.9.0](https://highlightjs.org/) 渲染
- [mermaid 10.9.3](https://mermaid.js.org/) 图表（懒加载）
- [html-to-image 1.11](https://github.com/bubkoo/html-to-image) PNG 导出
- [jsdom 30](https://github.com/jsdom/jsdom) 测试

五个运行时库全部 vendored 于 `vendor/` —— 版本号核对自 bundle 内容本身，
而非仅凭包名。

## 架构概要

六个小 IIFE 模块挂在单一 `MD` 命名空间下：`i18n` → `markdown` → `editor` →
`layout` → `export` → `app`。渲染流为 `CodeMirror → 防抖(300ms) →
marked.parse → 预览 innerHTML → mermaid.render`，由后者把围栏占位替换为
SVG。启动分容错阶段执行；监听器就位前到达的点击会被捕获并回放一次，不再
静默丢失。可选 vendor 库均有守卫，整个应用在没有 CodeMirror / mermaid /
html-to-image 的 jsdom 环境中同样可以启动——测试套件正是这样驱动的。

→ 完整模块图、状态模型与管线：[docs/zh/architecture.md](docs/zh/architecture.md)

## 文档

| 文档（中文） | Document (EN) | 内容 |
|--------------|---------------|------|
| [docs/zh/index](docs/zh/index.md) | [docs/en/index](docs/en/index.md) | 文档索引 |
| [使用](docs/zh/usage.md) | [usage](docs/en/usage.md) | 分步操作、导出、错误行为 |
| [开发](docs/zh/development.md) | [development](docs/en/development.md) | 环境、命令、测试、目录结构 |
| [架构](docs/zh/architecture.md) | [architecture](docs/en/architecture.md) | 模块、渲染管线、状态模型 |
| [部署](docs/zh/deployment.md) | [deployment](docs/en/deployment.md) | GitHub Pages 托管、子路径验证 |
| [故障排查](docs/zh/troubleshooting.md) | [troubleshooting](docs/en/troubleshooting.md) | 症状 → 原因 → 修复 表 |
| [隐私](docs/zh/privacy.md) | [privacy](docs/en/privacy.md) | 存储键位、网络行为、逐条核实的事实 |
| [常见问题](docs/zh/faq.md) | [faq](docs/en/faq.md) | 范围与边界类问题 |
| [功能设计索引](docs/zh/features/index.md) | [features index](docs/en/features/index.md) | 按大功能组织的设计文档 |

## 兼容性

项目不带任何构建目标与 polyfill；只使用广泛支持的 DOM API（pointer
事件、`matchMedia`、`Blob`/`URL.createObjectURL`、CSS 自定义属性），面向
当前常青浏览器。逻辑套件已在 jsdom 下验证，界面已在 headless Chromium 下
验证；尚未跑过正式的多浏览器矩阵。

## 更新日志

见 [CHANGELOG.zh.md](CHANGELOG.zh.md)。仓库尚无 Git Tag 与 GitHub Release；
更新日志以汇总版本 1.0.0（首次发布于 2026-08-22）记录当前完整能力集，
待维护者打出首个 Tag 后再行拆分。

## 参与贡献

欢迎 Issue 与 Pull Request。目前暂无正式的贡献流程；请保持 PR 小巧，并在
描述中说明你改动了对用户可见的行为。提交 PR 前请先运行测试：

```sh
cd test && npm install && npm test
```

## 许可证说明

⚠️ 本仓库**尚未**附带 LICENSE 文件。在补充之前，代码默认按著作权法归作者
所有——你可以阅读代码，但复用、修改与再分发的条款尚未正式授予。（维护者
备注：选择许可证只能由项目所有者决定。）

## 请我喝杯咖啡

**请我喝杯咖啡 ￥4.9** ☕

<table>
  <tr>
    <td align="center"><img src="docs/donate/alipay-qr.png" width="200" alt="支付宝收款码"><br>支付宝</td>
    <td align="center"><img src="docs/donate/wechat-qr.png" width="200" alt="微信收款码"><br>微信</td>
  </tr>
</table>
