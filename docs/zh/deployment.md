# 部署

MD·PRESS 如何进入生产环境，以及如何验证一次部署。English:
[deployment](../en/deployment.md)。

## 当前生产配置（2026-08-27 核实）

线上站点 https://petrel2015.github.io/markdown-press/ 由 **GitHub Pages**
伺服：

| 配置 | 值（来自 GitHub Pages API） |
|------|------------------------------|
| 来源 | `main` 分支，根路径（`/`） |
| 构建类型 | `legacy`（分支部署——不涉及 CI workflow） |
| HTTPS | 强制开启 |
| 状态 | `built` |

仓库没有 `.github/workflows/` 目录，也没有构建步骤——部署就是：
**推送到 `main`，Pages 伺服仓库根目录**。

## 为 Fork 启用 Pages

1. 将仓库推送到 GitHub。
2. Settings → Pages → Build and deployment → Source：**Deploy from a
   branch**。
3. 分支：`main`，目录：`/ (root)` → Save。
4. 等待首次构建；URL 显示在同一设置页，形如
   `https://<owner>.github.io/<repo>/`。

## 为什么代码天然适配子路径

GitHub Pages 项目站点在 `/<repo>/` 子路径下伺服，而非域名根。MD·PRESS
正是按这一约束编写的：

- `index.html` 中所有资源引用都是相对路径（`vendor/…`、`css/…`、`js/…`）。
- mermaid 懒加载注入的是相对 URL `vendor/mermaid.min.js`，在任何基础
  路径下都能解析。
- 应用标记中不存在绝对 `/…` 链接。

已在本地以 `/markdown-press/` 前缀伺服仓库、并在 headless Chromium 中
完整走查 UI（控制台零报错）验证了这一点（`docs/img/` 中的截图即来自
该次验证）。

子路径托管在本项目**无需任何配置**——没有基础路径设置、环境变量或构建期
改写，因为没有构建。

## 自定义域名

本项目未配置。GitHub Pages 自定义域名独立于应用代码工作（CNAME 记录 +
仓库设置）；由于所有引用都是相对路径，MD·PRESS 无需任何改动。

## 部署后验证清单

```sh
curl -s -o /dev/null -w "%{http_code}\n" https://<owner>.github.io/<repo>/          # 期望 200
curl -s -o /dev/null -w "%{http_code}\n" https://<owner>.github.io/<repo>/vendor/marked.min.js   # 期望 200
```

然后在浏览器中：

1. 打开站点；示例文档渲染出 Mermaid 流程图（确认懒加载的
   `vendor/mermaid.min.js` 在子路径下可解析）。
2. 切换语言、切换视图模式、执行一次 PNG 导出——每步在部署 URL 下驱动
   不同模块。
3. 检查浏览器控制台：零报错即健康状态。

## 部署不覆盖的内容

- 推送时没有 CI 跑测试。推送前请本地运行
  `cd test && npm install && npm test`（2026-08-27 时 65/65 通过）。
- 不存在 release/tag 自动化；版本口径见
  [CHANGELOG.zh.md](../../CHANGELOG.zh.md) 的版本说明。
