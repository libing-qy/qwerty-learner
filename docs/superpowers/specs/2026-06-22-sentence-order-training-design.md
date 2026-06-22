# 连词成句训练设计说明

## 1. 背景与目标

当前项目的核心训练路径是“按章节进行单词输入训练”，并在章节完成后展示结果页。新需求是在**不改变章节完成语义**的前提下，为章节增加“连词成句”训练：用户先完成本章单词训练，再自动进入本章句子训练，只有在**单词与句子都完成后**，才算该章节真正完成。

本设计目标如下：

1. 尽量复用现有 `Typing` 页面、计时器、章节推进、结果页与配置体系。
2. 新增的“连词成句”训练保持与现有单词训练一致的交互节奏：输入、即时判定、错误重输、完成后推进。
3. 将句子训练设计为章节附加资源，不污染现有单词词典结构。
4. 对无句子资源的章节保持完全兼容，行为与当前版本一致。

## 2. 需求范围

本设计覆盖以下范围：

1. 章节末尾自动追加连词成句训练。
2. 用户通过**纯键盘**按正确顺序输入句中单词。
3. 系统展示打乱后的单词顺序作为提示，但不提供点击或拖拽交互。
4. 单词训练完成后，若本章存在句子资源，则自动进入句子训练。
5. 章节完成定义保持为：本章所有单词与句子均完成后，才进入结果页。
6. 结果页展示章节级结果，并追加句子训练摘要。

本设计暂不覆盖：

1. 拖拽排序。
2. 句子错题本与智能复习。
3. AI 生成句子。
4. 多语言复杂分词规则。
5. 句子训练与“默写模式”的联动配置。

## 3. 设计约束与原则

### 3.1 不改变章节完成语义

现有 `isFinished` 语义保持不变，仍然只表示“整章完成”。

- 单词训练完成后，如果存在句子训练，不进入结果页。
- 句子训练完成后，才设置章节完成。
- 结果页继续只在整章完成后展示。

### 3.2 尽量贴近现有训练逻辑

现有单词训练节奏为：

1. 用户输入。
2. 系统即时判断正误。
3. 输入错误则重输当前目标。
4. 输入正确则推进到下一目标。

句子训练保持同样节奏，只把目标粒度从“一个单词”切换为“句子中的下一个 token”。

### 3.3 低侵入扩展

- 保留现有 `Typing` 页面作为统一训练页。
- 保留现有章节、计时、结果页逻辑。
- 新增句子数据、句子状态和句子组件，不强行改造现有 `WordComponent` 为双模式组件。

## 4. 架构方案

### 4.1 总体流程

章节运行流程调整为：

1. 进入章节，加载本章单词列表与本章句子列表。
2. 用户完成本章单词训练。
3. 若本章存在句子资源，则自动切换到“连词成句”训练。
4. 用户完成本章全部句子训练。
5. 章节结束，展示统一结果页。

若本章没有句子资源，则在单词训练结束后直接完成章节。

### 4.2 当前训练内容标识

新增章节内部运行态，用于表示当前训练内容：

- `trainingMode: 'word' | 'sentence-order'`

它只表示**当前在练什么**，不表示章节是否完成。

### 4.3 句子资源作为章节附加数据

现有词典文件继续只负责单词训练。句子训练资源单独维护，与词典按 `dictId + chapter` 建立关联。

这样可以保证：

- 现有词库结构不被污染。
- 句子训练可逐词库、逐章节增量补充。
- 没有句子数据的章节不受影响。

## 5. 数据结构设计

### 5.1 新增句子类型

建议在 [src/typings/index.ts](src/typings/index.ts) 中新增：

- `SentenceItem`
  - `id`: 句子唯一标识
  - `text`: 原句
  - `tokens`: 正确顺序的 token 列表
  - `trans`: 句意或提示文本
  - `chapter`: 所属章节
  - `sourceDictId`: 所属词库 id

说明：

- 首版不在运行时做复杂切词，直接依赖数据中的 `tokens`。
- `tokens` 为判题基准。
- `text` 用于展示原句或调试，不直接参与首版判题。

### 5.2 新增句子训练日志类型

建议新增：

- `SentenceInputLog`
  - `index`: 当前句在章节句子列表中的索引
  - `correctCount`: 正确输入 token 数
  - `wrongCount`: 错误提交次数
  - `wrongTokens`: 错误输入过的 token 列表

首版保持轻量，先满足章节结果统计与基础调试需求。

### 5.3 句子资源组织

建议使用独立资源目录，例如：

- `public/sentences/<dict-id>.json`

或在资源层对句子数据建立统一映射，再由运行时按章节筛选。

首版要求：

- 句子资源能按 `dictId` 和 `chapter` 返回本章句子列表。
- 若未找到资源或该章无句子，返回空列表。

## 6. 状态与 reducer 设计

### 6.1 顶层状态新增

在 [src/pages/Typing/store/type.ts](src/pages/Typing/store/type.ts) 中，建议在现有 `TypingState` 上新增：

- `trainingMode: 'word' | 'sentence-order'`
- `sentenceData`

其中：

- `isFinished` 继续表示章节是否完成。
- `trainingMode` 只表示当前训练内容。

### 6.2 `sentenceData` 建议字段

建议新增结构：

- `sentences: SentenceItem[]`
- `index: number`：当前第几句
- `tokenIndex: number`：当前句应输入的第几个 token
- `inputToken: string`：用户当前正在输入的 token
- `sentenceCount: number`：已完成句数
- `correctCount: number`：句子训练中正确 token 数
- `wrongCount: number`：句子训练中错误提交次数
- `userInputLogs: SentenceInputLog[]`

说明：

- `chapterData` 保留服务于单词训练。
- `sentenceData` 平行服务于句子训练。
- 公共章节状态如 `isTyping`、`timerData`、`isFinished`、`isShowSkip` 继续共用。

### 6.3 新增 reducer action

建议在 [src/pages/Typing/store/index.ts](src/pages/Typing/store/index.ts) 中新增：

- `SETUP_SENTENCES`
- `SWITCH_TO_SENTENCE_MODE`
- `UPDATE_SENTENCE_INPUT`
- `REPORT_CORRECT_TOKEN`
- `REPORT_WRONG_TOKEN`
- `RESET_CURRENT_TOKEN`
- `NEXT_SENTENCE`
- `FINISH_SENTENCE_TRAINING`

### 6.4 关键状态流转

#### 单词训练完成时

- 若当前章节存在句子资源：
  - 不触发 `FINISH_CHAPTER`
  - 触发 `SWITCH_TO_SENTENCE_MODE`
- 若当前章节不存在句子资源：
  - 正常触发 `FINISH_CHAPTER`

#### 句子训练进行时

- 用户键入字符，更新 `inputToken`
- 用户按空格提交当前 token
- 系统将其与 `sentences[index].tokens[tokenIndex]` 对比
- 若正确：
  - `correctCount += 1`
  - `tokenIndex += 1`
  - 清空 `inputToken`
- 若错误：
  - `wrongCount += 1`
  - 记录错误 token
  - 清空 `inputToken`
  - 已完成 token 保留

#### 当前句完成时

- 若当前句所有 token 已完成：
  - `sentenceCount += 1`
  - 进入下一句
- 若当前句为最后一句：
  - 触发 `FINISH_CHAPTER`

### 6.5 Skip 行为

章节级 `Skip` 按钮可继续复用，但在句子模式下语义调整为：

- 跳过当前整句
- 进入下一句
- 若已是最后一句，则完成章节

## 7. 页面与组件设计

### 7.1 页面级分流

保留 [src/pages/Typing/index.tsx](src/pages/Typing/index.tsx) 作为统一训练入口与页面壳子。

保留现有：

- 章节初始化
- 开始/暂停控制
- 计时器
- 章节完成判断
- 结果页展示

实际训练内容在组件层按 `trainingMode` 分流。

### 7.2 训练内容组件拆分

现有单词链路继续使用：

- [src/pages/Typing/components/WordPanel/index.tsx](src/pages/Typing/components/WordPanel/index.tsx)
- [src/pages/Typing/components/WordPanel/components/Word/index.tsx](src/pages/Typing/components/WordPanel/components/Word/index.tsx)

建议新增句子训练组件：

- `src/pages/Typing/components/SentencePanel/index.tsx`
- `src/pages/Typing/components/SentencePanel/components/SentenceInput.tsx`
- `src/pages/Typing/components/SentencePanel/components/SentencePrompt.tsx`
- `src/pages/Typing/components/SentencePanel/components/ScrambledTokens.tsx`

### 7.3 组件职责

#### `SentencePanel`

负责：

- 读取当前句子
- 连接 reducer
- 管理当前句完成与下一句切换
- 处理跳过当前句等章节内动作

#### `SentencePrompt`

负责：

- 展示句意/提示
- 展示句子训练进度
- 展示必要的辅助信息

#### `ScrambledTokens`

负责：

- 展示打乱后的 token 列表
- 仅作视觉提示
- 不支持点击与拖拽

#### `SentenceInput`

负责：

- 捕获纯键盘输入
- 以空格提交当前 token
- 展示已完成 token、当前输入 token、错误反馈

### 7.4 页面切换点

建议在 [src/pages/Typing/components/WordPanel/index.tsx](src/pages/Typing/components/WordPanel/index.tsx) 这一层进行训练内容分流：

- `trainingMode === 'word'`：保留现有单词训练内容
- `trainingMode === 'sentence-order'`：渲染 `SentencePanel`

这样能最大限度复用现有页面骨架，同时避免在底层单词组件中引入大量模式分支。

## 8. 交互与判题规则

### 8.1 输入方式

用户通过键盘输入句中单词顺序。

- 字符输入进入当前 `inputToken`
- 按空格提交当前 token
- 不提供鼠标点击单词拼句
- 不提供拖拽排序

### 8.2 视觉提示

每句展示：

- 中文释义或提示文本
- 打乱后的 token 列表
- 当前已完成 token 区域
- 当前正在输入的 token

首版不显示完整正确句，以保持训练强度。

### 8.3 判题策略

首版建议规则：

- 忽略大小写
- 自动去除首尾空格
- 连续空格不计入内容
- 标点严格按照 `tokens` 比对

判题仅在提交 token 时发生，不做逐字符实时判对错。

### 8.4 正确输入反馈

当用户提交 token 且与目标 token 匹配时：

- 锁定该 token 为已完成
- 清空 `inputToken`
- 推进到下一个 token
- 播放正确反馈音效（可复用现有提示音能力）

### 8.5 错误输入反馈

当用户提交 token 错误时：

- 播放错误音效
- 记录当前错误
- 清空当前 `inputToken`
- 已完成 token 保留
- 不回退前面已完成内容

此策略与现有单词训练“错了重输当前目标”的体验保持一致。

### 8.6 句子完成推进

- 当前句所有 token 完成后，自动进入下一句
- 最后一句完成后，章节整体完成并进入结果页

## 9. 结果页与统计设计

### 9.1 结果页触发时机

保留 [src/pages/Typing/components/ResultScreen/index.tsx](src/pages/Typing/components/ResultScreen/index.tsx) 作为统一章节结果页。

触发条件保持为：

- 本章单词训练完成
- 且本章句子训练完成（若存在）

### 9.2 章节结果展示

结果页保留现有单词训练统计，并追加“连词成句训练”摘要区块。

建议首版展示：

- 句子总数
- 已完成句数
- token 正确数
- token 错误数
- 句子训练正确率

### 9.3 正确率口径

首版推荐按 token 统计，保持与当前输入训练的粒度一致：

$$
accuracy = \frac{correctTokenCount}{correctTokenCount + wrongTokenCount} \times 100\%
$$

如无句子资源，则不展示句子训练摘要。

## 10. 错误处理与兼容性

### 10.1 无句子资源兼容

若当前词库或章节没有句子资源：

- `sentenceData.sentences` 为空
- 单词训练完成后直接结束章节
- 结果页表现与当前版本一致

### 10.2 数据异常处理

若句子资源存在但格式不合法：

- 运行时应跳过无效句子
- 若最终无有效句子，则按“无句子资源”处理
- 不应阻塞章节单词训练

### 10.3 输入边界

首版需要明确处理：

- 连续按空格时不重复提交空 token
- `Backspace` 仅删除当前输入 token 中的字符
- 当前 token 为空时按空格无效果

## 11. 测试策略

### 11.1 单元测试重点

建议优先覆盖 reducer 与句子判题逻辑：

1. 句子列表初始化成功。
2. 无句子列表时不切到句子模式。
3. 单词训练结束后有句子时切到 `sentence-order`。
4. 正确 token 提交后推进到下一个 token。
5. 错误 token 提交后清空当前输入并记录错误。
6. 当前句完成后切换到下一句。
7. 最后一句完成后章节完成。
8. 跳过当前句时正确进入下一句或完成章节。

### 11.2 集成测试重点

若补充端到端测试，建议覆盖主链路：

1. 进入章节。
2. 完成单词训练。
3. 自动切换到句子训练。
4. 完成句子输入。
5. 展示统一章节结果页。

## 12. 预计改动边界

优先涉及的文件范围：

- [src/typings/index.ts](src/typings/index.ts)
- [src/store/index.ts](src/store/index.ts)（如需要增加句子训练配置）
- [src/pages/Typing/index.tsx](src/pages/Typing/index.tsx)
- [src/pages/Typing/store/type.ts](src/pages/Typing/store/type.ts)
- [src/pages/Typing/store/index.ts](src/pages/Typing/store/index.ts)
- [src/pages/Typing/components/WordPanel/index.tsx](src/pages/Typing/components/WordPanel/index.tsx)
- [src/pages/Typing/components/ResultScreen/index.tsx](src/pages/Typing/components/ResultScreen/index.tsx)
- `src/pages/Typing/components/SentencePanel/*`
- `src/resources/*` 或 `public/sentences/*`

## 13. 最终建议

推荐以“**统一 Typing 页面 + 章节内自动切换到句子训练 + 统一结果页**”的方式实现。

该方案满足以下目标：

1. 与现有训练流程最接近。
2. 不改变章节完成语义。
3. 对旧章节与无句子资源场景完全兼容。
4. 新增逻辑边界清晰，适合后续继续扩展句子训练、句子复习与句子统计能力。
