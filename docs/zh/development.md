# 开发

环境、命令（以下每条命令均实际执行并记录结果）、测试套件与项目结构。
English: [development](../en/development.md)。

## 环境要求

- 一个浏览器——应用本身只需要这个。不安装任何运行时依赖，没有构建
  步骤。
- 仅测试套件需要：Node.js。jsdom 30 声明
  `engines: ^22.22.2 || ^24.15.0 || >=26.0.0`；下方验证运行于
  Node v22.22.3。
- 本地伺服需要任意静态文件服务器（下文给出一种；项目不内置）。

## 命令

| 命令 | 用途 | 已验证结果 |
|------|------|------------|
| `cd test && npm install` | 安装测试套件的 jsdom | 干净安装，0 漏洞 |
| `cd test && npm test` | 运行逻辑套件（`node logic.test.js`） | **65 通过，0 失败**（2026-08-27） |
| `python3 -m http.server 8765` | 在 `http://localhost:8765/` 伺服应用 | `index.html` 返回 HTTP 200 |
| `open index.html` / `xdg-open index.html` | 无服务器直接打开 | 标准平台命令；除 Mermaid 渲染外一切可用（需 `http(s)`，见[使用说明](./usage.md#图表)） |

仓库**没有构建命令**（站点原样发布）、**没有 lint 配置**——无命令可跑，
也无 lint 结果可报。

## 测试

`test/logic.test.js` 将真实 `index.html` 载入 jsdom，注入 marked 与六个
应用模块，通过 DOM API 驱动页面——无 GUI。可选 vendor 库（CodeMirror、
highlight.js、mermaid、html-to-image）刻意缺席，从而让受测的正是它们
带守卫的降级路径。覆盖分组：

| 分组 | 断言内容 |
|------|----------|
| T0 初始状态 | 默认语言检测、分屏模式、示例文档渲染与持久化 |
| T1 渲染管线 | GFM 输出、Mermaid 围栏 → 携带编码源码的占位块、HTML 转义、围栏识别、CJK 字数统计 |
| T2 视图模式 | 模式切换与持久化、手机强制（分屏 → 编辑）、非法模式回退 |
| T3 分屏比例 | 钳制边界（25/75）、比例设置 |
| T4 导出纯函数 | PNG 尺寸（780/1588px）、文件名校验、`.md` 后缀补全、文件名净化 |
| T5 打印导出 | 打印容器取自预览、标题切换与还原、容器清理 |
| T6 语言切换 | 字典切换、持久化、示例文档本地化 |
| T7 打开 .md | 按扩展名接受/拒绝、编辑器与预览更新、文档名与自动保存联动 |
| T8 PNG 降级 | 缺失 html-to-image → 失败提示及保存标签恢复 |
| T9 状态栏 | 位置、词数、字符数、行数 |
| T10 mermaid 降级 | 缺失 mermaid → 安全跳过、原码回退保留 |

## 项目结构

```
markdown-press/
├── index.html            页面骨架 + 启动期点击捕获脚本
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
├── vendor/               固定版本第三方库（离线，版本见下）
├── test/
│   ├── package.json      jsdom 依赖
│   └── logic.test.js     DOM 驱动的逻辑测试
└── docs/                 本文档 + 赞赏二维码 + 截图
```

Vendored 版本（核对自 bundle 内容，而非仅凭包名）：CodeMirror
**5.65.16**、marked **12.0.2**、highlight.js **11.9.0**、mermaid
**10.9.3**、html-to-image **1.11**（bundle 内容与 1.11.9–1.11.11 完全
一致）。

## 本地开发注意

- **没有任何环境变量**——应用不从环境读取任何配置。唯一可切换的运行时
  开关是 `window.MD_ALLOW_LAZY = false`，测试套件用它禁止 mermaid 懒加载
  注入。
- 修改 `index.html` 的窗格结构或 CSS 布局后无需构建：刷新标签页即可。
  编辑器窗格可见性或宽度变化后 CodeMirror 需要 `refresh()`——应用已在
  模式切换、分割条拖拽结束与窗口 resize 时自动执行。
- 设计体系令牌（墨/纸/发丝线/红、字体）位于 `css/style.css` 顶部；
  mermaid 主题变量位于 `js/markdown.js`（`initMermaid`）。

## 本地验证生产形态

线上站点是仓库根目录以**子路径**（`/markdown-press/`）静态伺服的形态。
本地复现该形态（所有资源引用都是相对路径，因此可验证子路径正确性）：

```sh
python3 -m http.server 8765
# 在 http://localhost:8765/ 以扁平路径伺服仓库根
```

要完全模拟子路径，可从父目录以路径前缀伺服，或使用带 `--prefix` 的静态
服务器；应用已在 `http://127.0.0.1:8766/markdown-press/` 下验证，控制台
零报错（`docs/img/` 中的截图正是这样产生的）。

## 部署

见[部署](./deployment.md)——GitHub Pages，`main` 分支根目录，无 CI 管线。
