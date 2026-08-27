# Feature Documentation

Design documents for MD·PRESS's major features — the decisions behind them,
their exact behavior, and their limits. 中文设计文档见
[中文索引](../../zh/features/index.md)。

| Feature | Introduced | Status | Description |
|---------|------------|--------|-------------|
| [Mermaid Diagrams](./mermaid-diagrams.md) | 1.0.0 | Stable | Lazy-loaded mermaid rendering with per-diagram error fallback |
| [Export Pipeline](./export-pipeline.md) | 1.0.0 | Stable | A4 PDF via print, phone/A4 PNG at 2×, `.md` download/open |
| [Split-Editor Layout](./split-editor-layout.md) | 1.0.0 | Stable | Edit/Split/Preview modes, divider, phone coercion, scroll sync |
| [Bilingual Interface](./bilingual-interface.md) | 1.0.0 | Stable | EN/中文 UI with detection, persistence, localized sample doc |

> All four features shipped with the initial public release. The repository
> has no Git tags yet, so "Introduced 1.0.0" follows the summary-version
> strategy documented in the [CHANGELOG](../../../CHANGELOG.md): the complete
> capability set at first publication (2026-08-22) is recorded once as
> version 1.0.0.
