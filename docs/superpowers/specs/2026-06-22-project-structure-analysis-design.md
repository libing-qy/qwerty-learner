# Qwerty Learner 项目结构分析设计说明（10 分钟可读版）

## 1. 背景与目标

本次输出聚焦于**整体架构总览**，并补充**核心模块数据流**。目标是让读者在约 10 分钟内建立对仓库的可操作认知：知道系统按什么层次组织、主链路如何流转、从哪里开始阅读代码。

## 2. 分析范围

本说明覆盖以下范围：

1. 入口与路由分层（`src/index.tsx`）
2. 页面与业务分层（`src/pages/*`）
3. 状态与持久化分层（`src/store/*`、`src/utils/db/*`）
4. 资源与构建/桌面容器分层（`src/resources/*`、`vite.config.ts`、`src-tauri/*`）
5. 练习主流程的数据流（选词库→训练→记录→分析）

不展开内容：

1. 逐文件 API 级讲解
2. 功能重构方案与实现计划

## 3. 分层架构设计

### 3.1 入口与路由层

- `src/index.tsx` 是运行时入口，负责：
  - 应用挂载与全局样式加载
  - 桌面/移动端分流
  - 页面路由组织（Typing / Gallery / Analysis / ErrorBook / FriendLinks / Mobile）

该层的核心职责是把用户导向正确页面，不承载复杂业务规则。

### 3.2 页面与业务层

- `src/pages/Typing/*`：主训练引擎（输入交互、计时、章节推进、结果页）
- `src/pages/Gallery*/*`：词库浏览与复习相关入口
- `src/pages/Analysis/*`：练习统计可视化
- `src/pages/ErrorBook/*`：错题查看与处理
- `src/pages/Mobile/*`：移动端页面

该层负责“用户可见功能”，通过 hooks 与 store 组合业务，不直接管理底层存储细节。

### 3.3 状态与数据层

- `src/store/index.ts`（Jotai）维护全局状态：
  - 当前词库、当前章节
  - 发音/随机/显示等配置
  - 复习模式状态
- `src/utils/db/*`（Dexie + IndexedDB）维护本地持久化：
  - `wordRecords`：单词级练习记录
  - `chapterRecords`：章节级结果记录
  - `reviewRecords`：复习进度记录

该层是“会话与历史记录中枢”，为页面层提供稳定状态与可追溯数据。

### 3.4 资源与基础设施层

- `src/resources/dictionary.ts`：词库元数据索引（id、分类、URL、长度等）
- `public/dicts/*`：词典数据源（JSON）
- `vite.config.ts`：构建输出、别名、插件配置
- `src-tauri/*`：桌面端容器（Web 前端外壳）

该层负责“内容来源 + 运行基础设施”，与页面业务解耦。

## 4. 核心数据流（主链路）

主链路定义为：

1. **上下文选择**：用户选择词库与章节（`currentDictIdAtom` + `currentChapterAtom`）
2. **词表加载**：`useWordList` 通过 SWR + `wordListFetcher` 拉取词库并按章节切片
3. **训练推进**：Typing reducer 驱动当前词、输入状态、计时、完成态
4. **记录写入**：训练过程写入 `wordRecords`，章节完成写入 `chapterRecords`
5. **统计读取**：Analysis 从 `wordRecords` 聚合热力图、WPM、正确率、按键错误排行

结论：项目采用“**前端本地闭环**”的数据路径（读取词库→交互训练→本地存储→本地分析）。

## 5. 错误处理与边界行为（结构视角）

- 词库 id 非法时回退默认词库（`cet4`）
- 章节越界时回到第 0 章
- 单词翻译字段（`trans`）在读取阶段做兜底归一化，避免渲染异常
- 数据库写入异常在当前实现中打印错误并继续流程

## 6. 测试与质量现状（结构视角）

- `tests/e2e/*` 提供 Playwright 端到端测试目录
- `package.json` 中 `test:e2e` 为有效测试入口；`test` 脚本当前为占位输出
- `lint` 使用 ESLint，`build` 使用 Vite

## 7. 推荐阅读路径（10 分钟）

1. `src/index.tsx`：入口与路由分流
2. `src/pages/Typing/index.tsx` + `Typing/hooks/useWordList.ts`：主训练流程
3. `src/store/index.ts`：全局状态模型
4. `src/utils/db/index.ts` + `record.ts`：本地持久化模型
5. `src/pages/Analysis/index.tsx` + `hooks/useWordStats.ts`：统计消费口径
6. `src/resources/dictionary.ts`：词库资源组织
7. `src-tauri/*`：桌面容器边界

## 8. 本次输出产物

- 文档：`docs/superpowers/specs/2026-06-22-project-structure-analysis-design.md`
- 目标：作为后续“实现计划（writing-plans）”的输入基线
