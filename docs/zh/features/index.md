# 功能设计文档

MD·PRESS 主要功能的设计文档——背后的决策、精确行为与边界限制。英文设计
文档见 [English index](../../en/features/index.md)。

| 功能 | 引入版本 | 状态 | 描述 |
|------|----------|------|------|
| [Mermaid 图表](./mermaid-diagrams.md) | 1.0.0 | Stable | 懒加载的 mermaid 渲染，逐图表错误回退 |
| [导出管线](./export-pipeline.md) | 1.0.0 | Stable | 打印对话框 A4 PDF、手机/A4 PNG（2×）、`.md` 下载/打开 |
| [分屏编辑布局](./split-editor-layout.md) | 1.0.0 | Stable | 编辑/分屏/预览模式、分割条、手机强制、滚动同步 |
| [中英文界面](./bilingual-interface.md) | 1.0.0 | Stable | 中/英文 UI，语言检测、持久化、本地化示例文档 |

> 四个功能均随首次公开发布上线。仓库尚无 Git Tag，因此「引入版本 1.0.0」
> 遵循 [CHANGELOG.zh.md](../../../CHANGELOG.zh.md) 记录的汇总版本策略：首次
> 发布（2026-08-22）时的完整能力集整体记为 1.0.0。
