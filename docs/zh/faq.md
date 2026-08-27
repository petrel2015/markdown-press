# 常见问题

范围与边界类问题的简短回答，深入细节就地链接。English: [faq](../en/faq.md)。

## 我的文字会离开电脑吗？

不会。应用没有后端；文档保存在浏览器的 `localStorage` 中，所有导出均在
本地生成。唯一的网络流量是浏览器取回应用自身的文件（外加首次使用图表时
对 mermaid 库的一次同源加载）。见[隐私](./privacy.md)。

## 为什么我的 Mermaid 图表不渲染？

两个常见原因：

1. 经 `file://` 打开了 `index.html`——懒加载器有意要求 `http(s)`。
   伺服该目录（`python3 -m http.server 8765`）后图表即可出现。见
   [故障排查](./troubleshooting.md#图表显示为源码)。
2. 图表语法非法——此时会按设计显示红色"图表语法错误"标签与原码。

## 文档保存在哪里？会丢吗？

只在 `localStorage` 中，按浏览器、按站点隔离。没有服务器、没有同步、
没有历史。清除站点数据——或点击 `新建` 并确认——都会抹掉它。重要的
内容请用 `下载 .md`。见[使用说明 · 自动保存与存储](./usage.md#自动保存与存储)。

## 为什么 PDF 导出打开的是打印对话框，而不是直接存文件？

设计如此：打印管线让文字保持矢量、可选，这是栅格化导出做不到的，并且
分页交给浏览器自己的"存储为 PDF"处理。目标选择**存储为 PDF** 即可。见
[功能设计/导出管线](./features/export-pipeline.md)。

## PNG 导出能包含图片吗？

本地图片与 data-URI 图片可以。被 CORS 拦截的远程图片无法栅格化，会从
PNG 导出中省略；PDF/打印不受影响。见
[故障排查](./troubleshooting.md#远程图片未出现在-png-导出中)。

## 支持哪种 Markdown 方言？

经 marked 12 的 GitHub Flavored Markdown——表格、任务列表、删除线、
围栏代码。Mermaid 图表用 ` ```mermaid ` 围栏。见
[功能设计/Mermaid 图表](./features/mermaid-diagrams.md)。

## 离线能用吗？

能，加载之后即可。所有库都 vendored 在仓库内，没有 CDN 请求。注意这不
是可安装的离线应用（没有 service worker / PWA）——含义是"页面保持
可用"，不是"安装后离线启动"。

## 有暗色模式或自定义主题吗？

没有——瑞士设计体系（纸白、墨色、一抹红）是刻意固定的。令牌位于
`css/style.css` 顶部，mermaid 主题位于 `js/markdown.js`，想改外观可以
自行 fork。

## 手机上能用吗？

能。768px 以下应用收起为 编辑 / 预览 标签。手机上可以书写、导出、切换
语言；分屏是桌面/平板布局。见[使用说明 · 手机上](./usage.md#手机上)。

## 能多人协作或跨设备同步吗？

不能。没有账号体系、没有同步、没有协作——这是刻意的非目标（见
[功能设计/分屏编辑布局](./features/split-editor-layout.md) 的 Non-Goals
与 [README_FOR_AI](../../README_FOR_AI.md)）。文档请以 `.md` 文件传递。

## 能打开 `.txt` 文件吗？

能——`打开 .md` 接受 `.md`、`.markdown` 与 `.txt`；内容一律按 Markdown
处理。

## 代码有许可证吗？能复用吗？

仓库尚未附带 LICENSE 文件，因此复用权利尚未正式授予。见
[README 的许可证说明](../../README.zh.md#许可证说明)。
