const portfolio = "https://wufei-png.github.io/wufei-png/";

// Keep the notes tied to evidence linked from the portfolio.
export const sources = {
  overview: {
    title: "About Wu Fei",
    url: portfolio,
    note: "Wu Fei (Fei Wu in papers; GitHub wufei-png) is an applied AI engineer with a computer vision and EEG background. His portfolio spans research, developer tools, learning tools, creative work, and upstream open-source contributions.",
  },
  oakink: {
    title: "OakInk · CVPR 2022",
    url: "https://arxiv.org/abs/2203.15709",
    note: "OakInk records and describes hand–object interactions, including grasping and object affordances. Lixin Yang is first author and Fei Wu is fourth.",
  },
  eeg2024: {
    title: "EEG emotion recognition · ICASSP 2024",
    url: "https://doi.org/10.1109/ICASSP48485.2024.10446817",
    note: "Fei Wu co-authored an attention-enhanced retentive broad learning study on EEG emotion recognition that aims to generalize across participants.",
  },
  eegDemo: {
    title: "Interactive EEG example",
    url: portfolio + "#eeg-demo",
    note: "The exhibit lets visitors select a time window in a synthetic signal and inspect its frequency spectrum. The waveform is illustrative, not a recording from a study.",
  },
  bibm: {
    title: "Adaptive Spatiotemporal Transformer · BIBM 2025",
    url: "https://doi.org/10.1109/BIBM66473.2025.11356339",
    note: "A short paper co-authored by Fei Wu on an adaptive spatiotemporal transformer for EEG emotion recognition.",
  },
  prcv: {
    title: "EEG Graph Attention Network · PRCV",
    url: "https://doi.org/10.1007/978-981-95-5764-6_32",
    note: "A PRCV 2025 conference paper on graph attention and adaptive spatiotemporal EEG emotion recognition, published in 2026. Fei Wu is a co-author.",
  },
  ifac: {
    title: "Graph-Attentive Kolmogorov-Arnold Networks · IFAC HMS",
    url: "https://doi.org/10.1016/j.ifacol.2025.12.532",
    note: "An IFAC HMS 2025 paper in IFAC-PapersOnLine on interpretable EEG emotion recognition, co-authored by Fei Wu.",
  },
  feishu: {
    title: "Feishu Shadow Agent · Architecture",
    url: "https://github.com/wufei-png/feishu-shadow-agent/blob/main/docs/architecture/current-boundaries.md",
    note: "A local, single-owner Feishu assistant for @mentions and direct messages. In shadow mode uncertain replies are routed for owner approval. Dry-run approvals never authorize production sends; production requires a fresh production approval when approval is required.",
  },
  askany: {
    title: "AskAny · Runtime contract",
    url: "https://github.com/wufei-png/AskAny/blob/main/docs/current-runtime.md",
    note: "Chinese technical FAQ and document retrieval via an OpenAI-compatible API. Model names ending in -deepsearch use a manually orchestrated LangGraph workflow. Other names use a LangChain agent with automatic tool selection. Tool availability depends on configuration.",
  },
  skills: {
    title: "Skills · GitHub",
    url: "https://github.com/wufei-png/skills",
    note: "Reusable AI-agent workflows for decisions, review, and verified delivery. The grilling skill resolves factual questions first and asks about genuine tradeoffs before implementation.",
  },
  dialoglingo: {
    title: "DialogLingo · GitHub",
    url: "https://github.com/wufei-png/DialogLingo",
    note: "Turns AI-agent conversations into editable English workbooks and Anki-ready decks.",
  },
  stickers: {
    title: "Animated Sticker Maker · Workflow",
    url: "https://github.com/wufei-png/animated-sticker-maker#workflow",
    note: "Packages a still reference image and motion brief as a looping transparent WebP sticker, with technical and visual checks before delivery.",
  },
  musicVideo: {
    title: "Xiang Yu and Yu Ji · Watch on Bilibili",
    url: "https://www.bilibili.com/video/BV1mUWa6AEdd/",
    note: "AI MV is a pixel-art music video about Xiang Yu and Yu Ji. Bilibili is the viewing link.",
  },
  musicRepo: {
    title: "AI MV · Production repository",
    url: "https://github.com/wufei-png/ai-mv",
    note: "The GitHub repository is the production workspace behind the music video.",
  },
  torcheeg: {
    title: "TorchEEG · Merged PR #107",
    url: "https://github.com/torcheeg/torcheeg/pull/107",
    note: "Wu Fei contributed this merged PR to TorchEEG. It lets plot_feature_topomap arrange EEG frequency bands into configurable rows and columns. The contribution establishes authorship of the change, not ownership or creation of TorchEEG.",
  },
  yolo: {
    title: "YOLO-World · Merged PR #216",
    url: "https://github.com/AILab-CVC/YOLO-World/pull/216",
    note: "Reworked non-maximum suppression to handle batches of images in the deployment path.",
  },
  openagent: {
    title: "oh-my-openagent · Merged PR #4370",
    url: "https://github.com/code-yeongyu/oh-my-openagent/pull/4370",
    note: "Added both MiniMax Coding Plan providers to the installer and model fallback chains for OpenCode.",
  },
  csbase: {
    title: "CS-Base · Merged PR #281",
    url: "https://github.com/xiaolincoder/CS-Base/pull/281",
    note: "Expanded the MySQL guide on hash-index and B+ tree tradeoffs for equality lookups, ordering, and range queries.",
  },
  gitlab: {
    title: "gitlab-mcp · Merged PR #345",
    url: "https://github.com/zereight/gitlab-mcp/pull/345",
    note: "Added configurable toolsets and filtering for which GitLab tools to expose.",
  },
  musicPr: {
    title: "claude-ai-music-skills · Merged PR #571",
    url: "https://github.com/bitwize-music-studio/claude-ai-music-skills/pull/571",
    note: "Added a Codex plugin manifest using existing skills and the bundled MCP server.",
  },
  allPrs: {
    title: "All public merged external PRs",
    url: "https://github.com/search?q=is%3Apr+is%3Apublic+is%3Amerged+author%3Awufei-png+-user%3Awufei-png&type=pullrequests",
    note: "GitHub search for public merged PRs authored by wufei-png in repositories owned by others. The portfolio exhibits highlight selected examples.",
  },
};
