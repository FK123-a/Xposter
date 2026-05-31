# Xposter — 多平台内容一键发布

[![Tests](https://img.shields.io/badge/tests-40%20passed-brightgreen)](.)

一次编写 Markdown，自动转换格式并填入知乎、B站、小红书的编辑器——保留用户最终审核权，不自动提交。

## Demo 视频

> demo-video.zip

## 支持平台

| 平台 | 发布方式 | 标题 | 正文 | 状态 |
|------|---------|------|------|------|
| 知乎 | 内容脚本注入 (Draft.js) | fallback input | `.public-DraftEditor-content` paste | ✅ |
| B站 | 内容脚本注入 (TipTap/ProseMirror) | 嵌入正文 `<h1>` | `.ProseMirror` paste | ✅ |
| 小红书 | 内容脚本注入 (TipTap/ProseMirror) | `textarea.d-text[placeholder="输入标题"]` | `.ProseMirror` paste | ✅ |

## 快速开始

```bash
git clone https://github.com/FK123-a/Xposter.git
cd Xposter
npm install
npm run build
```

**加载到 Chrome**:
1. 打开 `chrome://extensions`，开启右上角"开发者模式"
2. 点击"加载已解压的扩展程序"，选择 `.output/chrome-mv3/` 文件夹
3. 点击工具栏 Xposter 图标即可使用

或者启动开发模式（支持热更新）：
```bash
npm run dev
# 加载 .output/chrome-mv3-dev/ 目录
```

## 功能

- **Markdown 编辑器**：CodeMirror 6 驱动，实时预览、自动保存
- **格式自动转换**：Markdown → 各平台 HTML（标题截断、内容限制、标签处理）
- **一键填表**：选择平台 → 点击发布 → 自动打开编辑器页面 → 填入内容
- **模拟模式**：完整走一遍格式转换 + 校验流程，不实际发布
- **用户最终审核**：内容填入后由用户手动点击发布按钮，零自动提交风险
- **可扩展**：接入新平台只需实现两个 TypeScript 接口（约 175 行代码）

## 架构

```
Presentation (React + Zustand)
    → Application (Use cases)
        → Domain (Port 接口)
            ← Infrastructure (Chrome API, HTTP, DOM 自动化)
```

每个平台实现两个接口：
- **IPlatformPublisher** — 传输层（API 或内容脚本注入）
- **IContentAdapter** — Markdown → 平台格式转换

## 技术栈 & 第三方依赖

### 运行时依赖

| 库 | 版本 | 用途 | 原创功能边界 |
|---|------|------|-------------|
| react | ^19.2 | UI 框架 | 组件结构、状态流、交互逻辑 |
| react-dom | ^19.2 | DOM 渲染 | - |
| zustand | ^5.0 | 状态管理 | chrome.storage 持久化中间件 |
| @codemirror/view | ^6.43 | Markdown 编辑器 | CodeMirror 为标准组件，包装逻辑为原创 |
| @codemirror/state | ^6.6 | 编辑器状态 | - |
| @codemirror/lang-markdown | ^6.5 | Markdown 语法高亮 | - |
| @codemirror/commands | ^6.10 | 编辑器快捷键 | - |
| @codemirror/language | ^6.12 | 语言支持 | - |
| markdown-it | ^14.2 | Markdown → HTML 转换 | 平台适配规则（截断、标签、格式调整）为原创 |

### 开发依赖

| 库 | 用途 |
|---|------|
| wxt | 浏览器扩展框架 (Manifest V3) |
| @wxt-dev/module-react | WXT 的 React 集成 |
| typescript | 类型检查 (strict 模式) |
| vitest | 测试框架 |
| @testing-library/react | React 组件测试 |
| jsdom | DOM 模拟 |
| vitest-chrome | Chrome API Mock |

## 原创实现

本项目核心原创实现包括：

1. **双接口平台适配器模式**：`IPlatformPublisher` + `IContentAdapter` 解耦格式转换与发布传输，使新平台接入只需实现两个接口，无需修改核心代码。

2. **跨平台内容适配管线**：针对三个中文平台的不同约束（知乎 100 字标题、B站 250 字正文限制、小红书 20 字标题 + 1000 字正文），实现自动截断和格式调整。

3. **Popup → Background → Content Script 全链路编排**：Popup 发起发布请求 → Background 打开编辑器标签页并等待加载 → 注入 Content Script → DOM 填表 → 结果回传。整个链路带完整的错误处理和日志追踪。

4. **多级 DOM 选择器 fallback 机制**：每个平台的表单元素都有 6-8 个特定选择器 + 通用元素遍历兜底 + 按位置/尺寸筛选，适应页面结构变化。

5. **混合发布策略**：支持模拟模式（仅校验格式）和真实模式（浏览器标签页注入），通过统一的 `IPlatformPublisher.publish()` 接口切换。

6. **可扩展平台注册中心**：组合根模式，平台代码 → 适配器工厂的映射集中在一处，其他所有代码通过接口引用平台。

## 代码来源声明

本仓库所有代码均为 Xposter 项目原创实现。未复制或改编任何第三方代码。采用的算法模式（Clean Architecture 分层、适配器模式、观察者模式检测 DOM 元素、组合根模式）均为通用软件工程实践，不派生自任何特定代码库。

参考以下项目了解平台行为（未复用代码）：
- PostBot (gitcoffee-os/postbot) — 内容脚本注入方案参考
- multi-publisher (npm) — CLI 跨平台发布工作流参考
- COSE (doocs/cose) — 浏览器扩展发布 UX 参考

## 提交记录

开发周期内保持持续提交，commit 历史分布在 `phase/09-polish-store-ready` 分支：

```
9b3cec9 chore: 清除 i18n 中残留的公众号/WeChat 描述
474062a refactor: 回退图片功能，留到下一迭代
ae4464d feat: 三平台全链路一键填表 + 移除公众号
233ab5e feat(infra): 实现知乎一键填表发布
8b40cb3 feat: Phase 9 — 双语本地化、Content Script 覆盖
62f6603 feat: Phase 8 — 发布仪表盘、批量发布、模拟模式
1810503 feat: Phase 5-7 — 知乎、B站、小红书内容格式转换
a0e5e9d feat: Phase 4 — 公众号 API 客户端
```

## License

MIT
