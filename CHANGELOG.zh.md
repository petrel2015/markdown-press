# 更新日志

MD·PRESS 所有值得注意的用户可见变化记录于此文件。格式基于
[Keep a Changelog](https://keepachangelog.com/)；本项目尚未按发布分配
语义化版本。

English version in [CHANGELOG.md](CHANGELOG.md)。

> **版本说明** —— 截至 2026-08-27，本仓库**没有 Git Tag**（已核对
> `git tag`）、**没有 GitHub Release**（已核对 `gh release list`）、也
> **没有** 带版本号字段的根 `package.json`。为避免虚构 0.x 历史，当前完整
> 能力集以汇总版本 **1.0.0** 记录一次，日期取 GitHub Pages 首次公开部署日
> （2026-08-22）。更细粒度的历史见
> [Git 提交记录](https://github.com/petrel2015/markdown-press/commits/main)。
> 维护者打出首个 Tag 之后，后续变化将进入 `[Unreleased]` 并按真实版本拆分。

## [Unreleased]

暂无。

## [1.0.0] - 2026-08-22

首次发布于 GitHub Pages
（https://petrel2015.github.io/markdown-press/）。本条目汇总线上站点的
完整能力集（含截至 2026-08-27 落地的打磨）。

### 新增

- 分屏 Markdown 编辑器：编辑 / 分屏 / 预览 三种模式，分割条可拖拽
  （25%–75%，双击复位，聚焦后方向键微调），比例式双向滚动同步，可在
  预览栏头部开关。
- Markdown 渲染管线：marked 12（GFM）+ highlight.js 11 语法高亮（单色
  色板）；停止输入 300ms 后重新渲染。
- Mermaid 图表支持：` ```mermaid ` 围栏渲染为 SVG（strict 安全级别，
  中性主题对齐设计体系）；非法图表回退为红色错误标签 + 原码；3.3 MB 的
  mermaid bundle 首次使用时懒加载一次，页面加载不再预载。
- 导出路径：
  - 经浏览器打印对话框的 A4 PDF（矢量可选文字；打印样式尽量让标题不与
    后文跨页分离，代码块、表格与图表避免截断）；
  - 手机长图 PNG（逻辑宽 390px，2× 输出 780px）；
  - A4 宽度 PNG（逻辑宽 794px，2× 输出 1588px）；
  - `.md` 源文件下载，以及 `.md` / `.markdown` / `.txt` 打开，载入的
    文件名成为导出基础名。
- 中英文界面（English / 简体中文）：跟随浏览器语言检测、顶栏手动切换、
  选择持久化，界面文案、ARIA 标签、页面标题与首启动示例文档全部本地化。
- 自动保存：文档内容、文件名、语言、视图模式与分屏比例持久化到
  `localStorage`（停止输入约 400ms 后以及页面卸载时）。
- 自适应布局：桌面分屏，平板单栏或分屏，手机（768px 以下）收起为
  编辑 / 预览 标签并隐藏分屏选项。
- 状态栏：光标位置、按中文字数统计的词数、字符数、行数、保存状态与
  瞬时提示（导出中 / 已导出 / 失败）。
- 格式化工具栏（加粗、斜体、代码、链接、列表、Mermaid 片段）与快捷键
  `Cmd/Ctrl+B`、`Cmd/Ctrl+I`、`Cmd/Ctrl+K`、`Enter` 列表续行。
- 瑞士设计体系：纸白、墨黑、发丝线、唯一红色点缀（`#d52b1e`）、Helvetica
  系统字体栈；无渐变、无阴影、无圆角。
- 启动容错：页面内联脚本标记启动阶段并捕获监听器就位前到达的点击；
  boot 分容错阶段执行，回放最近一次被捕获的点击而非任其丢失；某阶段
  失败时状态栏出现提示。
- jsdom 逻辑测试套件，通过 DOM API 驱动真实 `index.html`
  （65 条断言，覆盖 i18n、渲染、降级路径、视图模式、分屏钳制、导出
  尺寸与文件名规则、打印构建、文件打开/拒绝、状态栏）。

[Unreleased]: https://github.com/petrel2015/markdown-press/compare/main
[1.0.0]: https://github.com/petrel2015/markdown-press/tree/main
