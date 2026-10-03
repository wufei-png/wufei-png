# Profile 改造：决策与实施计划

确认日期：2026-09-30。状态：已授权实施。

本计划针对 `wufei-png/wufei-png` 的 GitHub Profile。目标是帮助开源用户快速判断项目解决什么问题、从哪里开始使用，同时提供工程能力的公开证据。计划可以独立阅读；实施不依赖原评估报告或此前聊天。

## 已确认的决策

| 决策 | 最终选择 | 理由与边界 |
| --- | --- | --- |
| 第一受众 | 开源用户与协作者，兼顾工程招聘者与技术负责人 | 项目先说明用户任务和使用入口，再说明工程证据。 |
| 主展示 | Skills → DocMate → AgentRepoRouter → AskAny | 分别对应可复用工作流、文档问答与修复、仓库路由、完整 RAG 应用；不按 stars 或提交数量排序。 |
| 次级展示 | Reviewworthy、Git Evidence、ARC-Bench、review-agent-flow | 保持短描述；展示已有实质工作，并明确早期、实验性或试运行边界。 |
| 退出首页 | AI-Codereview-Gitlab-Opencode | 内容重叠且需要解释上游演进关系；移出 Profile 不代表归档或否定项目。 |
| 语言 | 英文主体，一句简短中文定位 | 不逐段双语，不重复堆叠定位和领域标签。 |
| 视觉 | 文字优先，保留一处静态 evidence trail 辅助图 | 深浅色两份 SVG 是同一逻辑图；图中没有独有信息。删除 system map 和动态统计。 |
| 方法图语义 | Define scope → Inspect context → Act within authority → Check and record | 结果可以是 passed、failed 或 unverified；不默认所有行动最终 VERIFIED，也不暗示项目共享一个 runtime。 |
| 联系方式 | 仅现有公开 Gmail | 统计卡片中的附加联系渠道随卡片退役；不增加新的身份信息。 |
| 外部贡献和研究 | 保留四组已合并上游贡献及两项研究背景 | 不新增作者角色、compiler ownership、部署或生产成熟度声明。研究放在作品之后。 |
| 内容维护 | 短治理文档、公开证据登记、离线检查器、PR/push 只读 CI | 外部链接在发布验收和季度人工复核时检查；不增加月度巡检或自动改写。 |
| 交付方式 | 按阶段验证并生成本地提交 | 2026-09-30 用户已授权直接实施全部阶段，取消生成独立提示词。发布操作需要后续明确指令。 |

## 对评估建议的取舍

输入评估是 `20-wufei-png-profile.md`，其 Profile 基线为 `a06d17455de86f0285a18ce448f5c0ef79c230e5`。实施前核对远端，将本地快进到 `8e1c3905b21aa7022f9fff6280f717afaa2693a4`；差异只有统计卡片刷新。后续维护应从执行时当前仓库状态开始，不机械回退到评估基线。

- **采纳，P0**：压缩首屏、排列主项目、明确状态、去掉低信息量动态统计和自动写仓库 workflow。
- **调整，P1**：保留一张可选辅助图；不因文字优先而要求删除全部视觉。四个主项目是此次内容预算，不是永久不可变的规则。
- **重新判断，P1**：review-agent-flow 的旧 canary 已不是唯一证据。当前公开 README 记载新的 exact-SHA canary，但仍为试运行 no-go，因此带边界进入次级展示。
- **轻量采纳，P1**：登记公开声明的来源并检查一致性。存在测试、eval 案例或运行契约，不等于本轮执行过这些检查，也不等于真实 provider 或生产部署验证。
- **不采纳**：固定从旧 SHA 开始、把招聘当第一受众、全部删除 SVG、月度外链巡检、锁死全部章节顺序或文案风格。
- **不声称**：离线脚本能证明文字真实、自动识别所有私有信息或阻止成熟度语义漂移。公开性和声明强度仍需人工核对。

## 已核对的公开证据

下表是 2026-09-30 使用 GitHub API 读取的公开默认分支快照。URL 固定到核对时 revision；项目入口仍链接仓库当前首页。实施者应读取来源中的当前边界，不能把目标设计当现有功能。

| 项目 | 公开快照 | Profile 声明范围 |
| --- | --- | --- |
| Skills | [README](https://github.com/wufei-png/skills/blob/21889b7276c152d237082000da42a18bd1354920/README.md) | 可安装的决策、review、分阶段交付和本地会话恢复 skills；验证文档明确区分确定性检查与 AI/provider eval。 |
| DocMate | [README](https://github.com/wufei-png/DocMate/blob/a42db79b40d09543b672381b5e8ad8818bf31767/README.md) | 文档 QA、代码核对、隔离文档修复；ask/auto/off 模式。存在 golden eval 案例，不宣称本轮跑过 provider eval。 |
| AgentRepoRouter | [README](https://github.com/wufei-png/AgentRepoRouter/blob/9330684324c6cb0f684ecdecb95e9d7c2877eaa8/README.md) | 多 agent host 的可安装仓库路由 skill，保留各 coding CLI 的原生约定。 |
| AskAny | [README](https://github.com/wufei-png/AskAny/blob/62bb85b9456e73712b525434012fcd8c0aa7196c/README.md) | 中文优化的 RAG 服务；FAQ 主 ingestion 插入块禁用，CODE route 未实现；本地检查不证明 live provider/Postgres。 |
| Reviewworthy | [README](https://github.com/wufei-png/reviewworthy/blob/61b83d3449aaeb566eb4e0a9865b19022ce9855d/README.md) | Contributor-side evidence workflow；early open-source foundation。 |
| Git Evidence | [README](https://github.com/wufei-png/git-evidence/blob/cb3c57bd1541f5cd823e79ecab569947fc2e450d/README.md) | Source-linked activity reports；implementation / contract hardening，live providers experimental，没有 production-complete 声明。 |
| ARC-Bench | [README](https://github.com/wufei-png/arc-bench/blob/d0b7a2180db8e8acca459eb2b4abb1c8939b0ec9/README.md) | Generator-agnostic requirement-to-application benchmark 和 Playwright 行为检查；不宣称拥有引用的 ARC compiler。 |
| review-agent-flow | [README](https://github.com/wufei-png/review-agent-flow/blob/90c7c08f262df10f411f77e86c5f1ff696ffa520/README.md) | Program-owned GitLab review publication；新 canary 取得部分收据，commit 写后恢复未完成，有限生产试运行 no-go。 |

现有 YOLO-World #174/#211/#216/#297、TorchEEG #106/#107/#108、sk2torch #2、gitlab-mcp #345 均通过 GitHub API 核对作者为 `wufei-png` 且 `merged_at` 非空。证据登记应保留具体 PR URL 和合并日期，不用 closed 状态推断 merged。

研究保留现有 OakInk arXiv 和 ICASSP DOI 入口；不宣称论文页面已独立证明 GitHub 身份关联，不增加 first/lead author 等个人贡献强度。

## 实施契约

使用已安装的 `implement-in-stages`；其公开来源为 [Skill](https://github.com/wufei-png/skills/blob/21889b7276c152d237082000da42a18bd1354920/skills/engineering/implement-in-stages/SKILL.md)。每阶段只依赖前序阶段，交付独立可检查结果，显式暂存相关路径，检查 staged diff，检查通过后提交。无关预存修改不能进入提交。

新会话先检查当前 `AGENTS.md`、分支、tracked/untracked/ignored 状态和本计划的完成记录；若文件已变，依据当前证据更新未完成部分。保留已完成工作。不需要原报告、其他本地仓库或私有凭据才能运行本项目的离线检查。

### 阶段 1：决策与计划

- 文件：本文件。
- 交付：记录已批准的目标、来源、阶段边界和验收；依赖：无。
- 检查：逐项与用户选择对账，`git diff --check`，检查 staged diff。
- 提交：`docs: record profile refresh decisions and implementation plan`。

### 阶段 2：README 与旧资产清理（阶段组一）

- 文件：`README.md`、`assets/system-map-{light,dark}.svg`、`assets/profile-summary-{light,dark}.svg`、`.github/workflows/update-profile-summary.yml`。
- 依赖：阶段 1。
- 交付：一个角色句、一句简短中文定位、作品与联系导航；四个主项目按确认顺序，四个次级项目附状态；保留四组 merged upstream contributions、两项 research background、纯文本方法论和单一联系入口。
- 删除 system map 和统计引用、四个对应资产与周度自动写仓库 workflow。先移除旧 evidence trail 引用，保留这两个文件供下一阶段重画，避免阶段间出现错误的 VERIFIED 语义。
- 验收：所有核心信息为 Markdown；无 retired asset/service 的 README 引用；项目措辞与上述公开来源一致；状态可见，所有当前本地引用存在。
- 检查：`git diff --check`；逐项人工对账；检查 README 首屏能回答角色、用户任务、开始使用的位置。
- 提交：`docs: make profile entries useful and retire dynamic statistics`。

### 阶段 3：静态辅助图（阶段组一）

- 文件：`assets/evidence-trail-{light,dark}.svg`、`README.md`。
- 依赖：阶段 2。
- 交付：一处辅助图，只放在方法论文字之后；两种主题内容相同；四个步骤与文字一致，结果明确包含 passed/failed/unverified。
- 布局：窄幅竖向流程，建议 360px 固有宽度、字体至少 14px，README 显示宽度不放大且窄屏可缩小。无动画、脚本、外部资源或嵌入 HTML。SVG 有 title/desc，HTML image 有 alt。
- 验收：375px 和桌面宽度可读；深浅色可读；禁图后必要信息完整；不默认成功、不暗示一体化 runtime。
- 检查：标准库 XML 解析；主题文本对账；渲染检查；`git diff --check`。图像呈现变更不为坐标或颜色写镜像测试。
- 提交：`docs: add a compact static evidence trail`。

### 阶段 4：治理与公开证据登记（阶段组二）

- 文件：`docs/portfolio-governance.md`、`docs/evidence-register.json`。
- 依赖：阶段 3 的最终内容集合。
- 交付：短治理规则与一份机器可读登记，避免手写 Markdown 表和 JSON 两个权威源。
- 治理：入选/降级/退出条件，状态含义，证据强度，季度人工复核，单一公共联系地址，自动化权限边界。stars、计数、provider-free fixture 或目标设计都不能升级成熟度。
- 登记结构：`version`、`verified_on`、`public_contacts`、`entries`。每条包括唯一 `id`、`category`（selected/secondary/upstream/research）、`name`、`url`、`claim`、`visibility: public`、`status_note`（如适用）、非空 `evidence`。证据有 `url`、`kind`；merged PR 另有 `merged_at`。来源 URL 固定到核对时 revision 或具体 PR/论文。
- 登记覆盖 README 所有项目、上游 PR 和论文，不存私有信息，不将人工查阅日期写成真实运行日期。对验证失败或仅自述的来源说明限制。
- 检查：`python3 -m json.tool docs/evidence-register.json`；逐条与 README 和公共来源对账；`git diff --check`。
- 提交：`docs: define profile governance and public evidence`。

### 阶段 5：确定性离线检查（阶段组二）

- 文件：`scripts/validate_profile.py`、`tests/test_validate_profile.py`；必要时加入 Python 缓存忽略规则及治理文档的运行说明。
- 依赖：阶段 4。
- 交付：仅 Python 标准库，命令 `python3 scripts/validate_profile.py`；不联网、不需要 GitHub token；错误非零退出并指出文件/条目。
- 契约：登记结构和唯一性；README 展示集合与 category 一致；外部作品链接有登记；需状态的条目就近有登记的状态文字；所有 Markdown/HTML 相对文件链接存在且不越出仓库；本地 fragment 可定位；联系方式在公共 allowlist；README 没有退役引用；登记只允许 public 和 HTTPS 来源。
- 不锁死所有标题顺序，不验证完整文案的逐字相等；不声称保证语义真实、public 可访问、PR 实时状态或全面隐私检测。历史评估取舍中的退役名称不作为运行时违规。
- 测试覆盖：合法文档；相对文件及 fragment 错误；HTML src/srcset；目录越界；登记缺失/重复/类别错位；成熟度遗漏；未知外部作品 URL；非允许联系地址；private/non-HTTPS 来源；retired 引用；非法登记产生清楚错误。fixture 使用当前公开作品集合或匿名例子，不包含私有资产。
- 检查：`python3 -m unittest discover -s tests -v`；`python3 scripts/validate_profile.py`；`git diff --check`。
- 提交：`test: validate public profile evidence and links offline`。

### 阶段 6：只读 CI 与全局验收（阶段组三）

- 文件：`.github/workflows/validate-profile.yml`；必要的已验证展示微调；本计划完成记录。
- 依赖：阶段 5。
- 交付：PR/push to main 运行离线测试和 validator；`permissions: contents: read`，checkout 使用核对过的完整 SHA、关闭 credential persistence；不配置 schedule，不调用 commit/push 或公开写入 API。
- 依赖尽量只用官方 checkout 和 runner 已有 Python；核对 action SHA 所属仓库。可用 actionlint 校验 workflow，工具不可用时说明实际校验方法与局限。
- 全局验收：全套离线检查；从实施基线起的 `git diff --check`；完整 staged/committed diff；首屏和禁图内容；375px/桌面/深浅色辅助图；所有公开入口；上游 merged 和 research 声明边界；索引和工作树状态。
- 本地 GitHub Markdown API 渲染或本地浏览器预览不能冒充已发布 Profile 的完整平台验收；远端 Actions 和发布后 GitHub Profile 呈现只能在授权发布后实证。将待验证项明确留在完成记录。
- 提交：`ci: check profile without repository writes`。

## 完成记录

| 阶段 | 状态 | 验证记录 |
| --- | --- | --- |
| 1 | 完成 | 已核对用户决策、公开仓库快照和 9 个 merged PR；已检查并提交计划。 |
| 2 | 完成 | 人工逐项对账，主展示顺序与状态正确；退役引用、资产与更新 workflow 一并移除；`git diff --check` 通过。 |
| 3 | 完成 | XML 解析、静态内容、主题文字一致性通过；GitHub Markdown API 渲染通过；本地 Chrome 375px 深浅色均无横向溢出，辅助图与桌面布局已检查。预览使用本地样式，不等于已发布 GitHub Profile 验收。 |
| 4 | 完成 | 登记覆盖 8 个作品、4 组贡献、2 项研究；9 个 merged PR 有作者和合并日期；Crossref 已核对 ICASSP 标题/年份/作者，IEEE 页面返回 202 的限制已记录。JSON 解析及人工对账通过。 |
| 5 | 完成 | 19 个契约测试通过，离线 validator 通过；包含 CLI 非零退出、非法登记/URL 处理、状态就近绑定、外部条目登记、路径/fragment/HTML 链接及越界检查。仅使用 Python 标准库。 |
| 6 | 本地完成 | 19 个测试、离线 validator、actionlint 1.7.12 和基线至最终 diff whitespace 检查通过；官方 checkout SHA 已核对归属，actionlint archive 已核对 SHA-256。GitHub Markdown API 渲染、本地 Chrome 窄屏/桌面/主题/禁图和首个键盘导航入口通过。未发布，远端 Actions 与真实 GitHub Profile 验收待发布后确认。 |

实施在 `codex/profile-refresh-2026-09-30` 分支完成。阶段 1–5 的提交依次为 `589c850`、`5c9f65c`、`3a34cf5`、`817b5e4`、`99a9c16`；阶段 6 为本记录所在的 `ci: check profile without repository writes` 提交。所有实现阶段均已完成，不需要独立提示词。

发布后再确认实际 GitHub Profile 的 picture 主题选择、375px 展示与 Actions 运行结果。发布前，远端原统计 workflow 仍以默认分支内容为准；本地删除尚未改变线上执行。这是发布后的验证边界，不是本地实现缺项。论文 DOI 的出版商页面本轮返回 202，已用 Crossref 核对元数据并在登记中保留限制。

## 长期维护依据

- [GitHub secure use](https://docs.github.com/en/actions/reference/security/secure-use)：最小 token 权限、核对来源后使用完整 action SHA。
- [GitHub scheduled workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)：公共仓库 60 天无活动会停用定时任务；本方案选择人工季度复核，不添加定时巡检。

## 2026-10-03 视觉修正

用户复核合并后的 Profile，确认恢复居中首屏和桌面横向方法图，并授权实现后提交、推送到 `main`。本节取代阶段 2 的首屏排版和阶段 3 的固定竖向布局；此前完成记录仍是 2026-09-30 的验证快照。

- 保留现有简介、作品顺序、使用入口、成熟度说明、上游贡献及研究内容。标题、两句定位与导航居中，英文定位适度加粗。
- 保留一处静态辅助图：桌面使用 840×300 横向节点；800px 及以下视口使用 360×434 竖向版本。四份 SVG 分别覆盖两种布局和深浅主题，步骤、说明及结果一致。
- 恢复轻量点阵、连线、青色流程节点和琥珀色记录节点；三种结果并列，不默认成功。正文继续提供完整方法论，图片有 title、desc 和 alt。
- 保留能力地图、动态统计卡片及定时写入 workflow 的退役结果。
- 现有链接与联系信息测试改用仍为 Markdown 的 Contact 标题作为插入位置，原有验证断言不变。

本地验收：19 个契约测试和离线 validator 通过；GitHub Markdown API 保留 align、picture、media 与 srcset；本地 Chrome 检查 375px、800px、801px 和 1280px 的图片选择与横向溢出，四份 SVG 的文字边界与视觉均已检查。预览样式不等于真实 GitHub Profile；推送后还需检查线上首屏、响应式图片选择和对应提交的 Actions 结果。
