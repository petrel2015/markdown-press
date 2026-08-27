# 架构

MD·PRESS 的构建方式：模块、管线、状态与降级路径。English:
[architecture](../en/architecture.md)。

## 高层形态

```
┌─────────────────────────── index.html ───────────────────────────┐
│  内联 head 脚本：md-booting 标记 + 启动前点击队列                  │
│                                                                  │
│  ┌───────────── workspace ─────────────┐                         │
│  │ pane-editor            pane-preview │   <body data-mode>      │
│  │ CodeMirror  │ 300ms 防抖 │  预览 innerHTML + mermaid SVG     │
│  └─────────────────────────────────────┘                         │
│  状态栏 · 导出菜单 · 隐藏文件输入                                  │
│  #print-root（打印克隆）   #png-root（离屏栅格目标）               │
└──────────────────────────────────────────────────────────────────┘
        │ 全部状态经 localStorage            永远无服务器
        ▼
  mdpress-doc / mdpress-name / mdpress-lang / mdpress-mode / mdpress-split
```

六个 IIFE 模块挂在单一全局 `MD` 命名空间下。加载顺序即依赖顺序：
`i18n` → `markdown` → `editor` → `layout` → `export` → `app`。没有任何
模块系统——脚本就是普通 `<script>` 标签，可选 vendor 库在调用点做特性
检测，从不假设存在。

## 模块职责

| 模块 | 文件 | 职责 |
|------|------|------|
| `MD.i18n` | `js/i18n.js` | 中英文字典；检测（已存选择 → 浏览器语言 → `en`）；应用 `data-i18n` / `data-i18n-aria-label` 属性；持久化 `mdpress-lang` |
| `MD.markdown` | `js/markdown.js` | marked 12 实例与自定义代码渲染器；highlight.js 集成；Mermaid 围栏识别、库的懒注入、图表渲染；`escapeHtml`、`countWords` |
| `MD.editor` | `js/editor.js` | CodeMirror 5 封装（markdown 模式、活动行、列表续行）；格式化命令；CodeMirror 缺席时回退为 textarea 垫片 |
| `MD.layout` | `js/layout.js` | `<body data-mode>` 上的视图模式；分割条拖拽/键盘/双击；`matchMedia` 手机强制；比例式双向滚动同步 |
| `MD.exporter` | `js/export.js` | 打印克隆管线；PNG 离屏栅格；`.md` 下载；带校验的文件打开；文件名辅助函数 |
| `MD.app` | `js/app.js` | 启动编排；渲染/保存防抖；状态栏；导出菜单；语言切换接线；示例文档 |

## 渲染管线

```
CodeMirror change
  └─ 防抖 300ms → MD.markdown.render(source)
       ├─ marked.parse：GFM → HTML
       │    └─ 自定义代码渲染器：
       │         · ```mermaid → <div class="mermaid-block"
       │            data-src="encodeURIComponent(code)"><pre>原码</pre></div>
       │         · 其他围栏 → hljs.highlight / highlightAuto / 转义
       └─ preview.innerHTML = html
            └─ MD.markdown.renderDiagrams(preview)
                 ├─ 无待处理 .mermaid-block → resolve(0)
                 ├─ ensureMermaid()：已加载？/ 注入
                 │    vendor/mermaid.min.js 一次（仅 http/https）
                 └─ 逐块 mermaid.render(id, code)
                      ├─ 成功 → innerHTML = svg（移除 height 属性）
                      └─ 失败 → 红色标签 + 原码，data-done="error"
```

自动保存走独立的 400ms 防抖，监听同一批 change 事件；页面卸载时再保存
一次。

## 启动序列

1. 内联 head 脚本（先于任何 vendor 库运行）标记
   `<html class="md-booting">`——CSS 据此调暗控件——并按 id 捕获按钮
   `click`（12 条容量的环形缓冲）。
2. `DOMContentLoaded` → `MD.app.boot()` 清除启动标记，运行三个相互容错
   隔离的 `try` 块（i18n+编辑器；layout；exporter+接线+菜单）。抛错会被
   记录并以状态栏提示呈现；其余阶段照常执行。
3. boot 完成后，最近一条时间戳在 15 秒内的排队点击被回放一次——慢速
   连接下启动前的点击不再丢失。
4. `beforeunload` 与 `resize` 监听最后注册。

## 状态模型

| 状态 | 位置 | 键 / 位置 |
|------|------|-----------|
| 文档文本 | `localStorage` | `mdpress-doc` |
| 文档名 | `localStorage` | `mdpress-name` |
| 界面语言 | `localStorage` | `mdpress-lang` |
| 视图模式 | `localStorage` + `<body data-mode>` | `mdpress-mode` |
| 分屏比例 | `localStorage` + CSS `--split` | `mdpress-split` |
| 瞬时 UI（提示） | 仅内存 | — |

每处 `localStorage` 访问都有 `try/catch` 包裹：存储被封锁时应用以默认值
与内存状态运行，不持久化任何内容。

生效的视图模式为 `effectiveMode(requested, isPhone)`：768px 以下请求的
`split` 变为 `edit`；非法值回退 `split`。存储的是原始选择，因此放大
窗口后分屏会恢复。

## 图表懒加载

`ensureMermaid()` 在页面协议非 `http(s)` 时拒绝注入库（这正是 `file://`
下保留原码的原因），并接受测试开关 `MD_ALLOW_LAZY = false`。注入只发生
一次；加载失败会重置 promise，使后续渲染可重试。

## 导出管线

- **打印（A4 PDF）**——将 `#preview` 的 HTML 克隆进 `#print-root`，把
  `document.title` 换成文档名（它成为建议的 PDF 文件名），
  `requestAnimationFrame` → `window.print()`。`afterprint` 还原标题并
  清空容器；60s 定时器在 `afterprint` 不触发时做同样的事。
  `css/print.css`（`@page` A4、防截断块）为克隆内容提供样式。
- **PNG**——`#png-root`（隐藏，固定为规格宽度）接收源文本的一次全新
  `marked.parse`；图表在其中重新渲染；等待每个 `<img>`（每张上限 4s）；
  `htmlToImage.toPng` 以 `pixelRatio: 2` 在白底上栅格化；data URL 以
  `<名称>-phone.png` / `<名称>-a4.png` 下载。
- **.md**——`Blob` + object URL + `a[download]`；URL 在 1s 后回收。
- **打开**——隐藏的 `<input type="file">` 按扩展名过滤；内容经
  `FileReader` 读取后走与 `新建` 相同的 `replaceDocument` 路径。

## 响应式策略

`matchMedia('(max-width: 767px)')` 的 change 事件与 `window.resize` 都会
重新应用生效模式；CSS 手机规则是事件失效时的兜底。CodeMirror 在其窗格
`display:none` 期间测量会失准，因此模式切换、分割条释放与 resize 都会
调度 `editor.refresh()`。

## 可测试性设计

整个应用可以在没有任何 vendor 库的情况下启动：CodeMirror 回退为 textarea
垫片；`highlight.js`/`html-to-image` 缺席走守卫分支；mermaid 缺席时原码
保持可见。这正是 `test/logic.test.js` 能在 jsdom（设 `MD_ALLOW_LAZY=false`）
中驱动真实页面、并端到端演练每条管线的原因。
