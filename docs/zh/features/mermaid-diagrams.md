# Mermaid 图表

## 概述

文档中的 ` ```mermaid ` 围栏在预览中渲染为 SVG 图表；mermaid 库仅在首次
需要时加载，任何失败都只局限于单个图表。

## 背景

预览管线建立在 marked + highlight.js 之上。代码围栏要么被语法高亮、要么
被转义——Mermaid 文本否则只会显示为普通代码；而在页面加载时急切运行
mermaid，会让这个「零依赖、秒开」的编辑器为许多文档根本用不到的功能
背上约 3.3 MB。

## 问题

图表是技术文档的核心（架构草图、流程图），但是：(1) 把 mermaid 打进
首屏加载违背「零依赖、即开即用」；(2) 非法图表语法在 mermaid 默认模式下
异步抛错，可能留下损坏的页面或卡死的加载态；(3) 图表必须在导出管线
（打印与 PNG 会在独立容器中重建 DOM）中同样存活。

## 目标

- ` ```mermaid ` 围栏随预览其余部分实时渲染。
- 没有图表的文档为零图表成本。
- 语法错误只影响该图表：标签 + 原码，页面照常工作。
- 图表在打印克隆与 PNG 重建中以相同方式重渲。
- 完全离线可用（vendored bundle）；不依赖 CDN。

## 非目标（Non-Goals）

- 不支持其他图表语言（PlantUML、Graphviz、D2）。
- 不支持图表交互——mermaid 以禁用点击回调的方式运行
  （`securityLevel: 'strict'`）。
- 不做图表编辑器、实时语法检查或错误行号——回退就是通用错误标签加
  原码。
- 不做逐图表主题覆盖；一个对齐设计体系的中性主题应用于所有图表。
- 除 mermaid 会话内的自身行为外，不为渲染结果做跨编辑的 SVG 缓存。

## 方案概览

marked 实例配置了自定义 `code` 渲染器：标记为 `mermaid`（大小写与空白
不敏感）的围栏变为
`<div class="mermaid-block" data-src="encodeURIComponent(code)">`，内含
作为 `<pre class="mermaid-raw">` 的原码——结构上即自带可见回退。每次
渲染后 `renderDiagrams(container)` 遍历待处理块并逐块换成 SVG。
`ensureMermaid()` 只注入一次 `vendor/mermaid.min.js`（相对 URL、同源），
且仅当页面协议为 http(s)；随后以 `startOnLoad: false`、中性主题、strict
安全级别与设计体系主题变量初始化 mermaid。

## 详细行为

- 围栏识别：info 字符串去空白并转小写；只有恰好为 `mermaid` 才走图表
  路径。
- 源码编码：图表代码以 URI 编码存于 `data-src`，渲染时解码，HTML 敏感
  字符因此能完整往返。
- 懒加载：mermaid 已存在时 `ensureMermaid()` 立即 resolve；否则注入一次
  （注入失败会重置 promise，后续渲染可重试）。非 http(s) 页面与测试开关
  （`MD_ALLOW_LAZY = false`）会 reject，块降级为原码。
- 渲染：块逐个渲染。成功时块的 `innerHTML` 变为 SVG（移除 mermaid 的
  `height` 属性，由 CSS `max-width: 100%` 控制缩放）并置
  `data-done="1"`。失败时清除 mermaid 遗留的临时元素，显示本地化的红色
  「图表语法错误」标签与转义后的原码，并置 `data-done="error"`。
- 重渲：只处理没有 `data-done` 的块；正常渲染周期内预览 HTML 整体重建，
  因此所有块天然是新鲜的。
- 导出：PNG 管线在其离屏容器内重新执行 `renderDiagrams`，图表以矢量
  形态按导出分辨率栅格化；打印克隆携带已渲染的 SVG。

## 用户体验

![预览窗格中渲染完成的 Mermaid 流程图](../../img/mermaid-diagram-en.webp)

用户输入 Mermaid 围栏后，在正常的 300ms 渲染防抖内图表即居中出现，配色
对齐文档色板。语法错误时红色标签与原码直接出现在图表应在的位置。

## 兼容性与历史影响

随初始版本发布。本仓库更早的版本在页面启动时急切加载 mermaid。懒加载
改变了启动行为（无图表的文档不再下载 3.3 MB），但不改变任何渲染输出；
mermaid 缺失时的回退行为此前已经存在。除启动更快外，不影响任何历史
行为。

## 数据与隐私影响

唯一的网络影响是首个图表出现时对 `vendor/mermaid.min.js` 的一次同源
请求（文件本身在仓库内）。无外部请求、无新增存储键。mermaid 的 strict
安全级别禁用点击交互并净化标签。

## 性能影响

mermaid bundle 约 3.3 MB（压缩后，vendored）。懒加载意味着无图表文档
完全不用付出该成本；有图表文档每会话支付一次。不发布计时测量数据——
在可复现之前刻意不写数字。

## 当前限制

- `file://` 下图表永不渲染（协议守卫）——显示原码。
- 错误信息是通用的；不透出 mermaid 解析器的诊断细节。
- 超大图表按预览宽度渲染；极宽的图表横向滚动
  （`overflow-x: auto`）。

## 发布信息

引入版本：1.0.0 · 状态：Stable（汇总版本——见
[CHANGELOG.zh.md](../../../CHANGELOG.zh.md) 的版本说明）。

## 相关文档

- [使用说明 · 图表](../usage.md#图表)
- [架构 · 渲染管线](../architecture.md#渲染管线)
- [故障排查 · 图表显示为源码](../troubleshooting.md#图表显示为源码)
- [导出管线](./export-pipeline.md)——图表如何在导出中存活

## 功能变更记录

### 1.0.0

- 初始行为：围栏识别、同源懒加载、strict 安全级别、逐图表错误回退、
  导出重渲。
