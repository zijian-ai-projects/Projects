import type { UiLanguage } from "@/lib/types";

export const WORKSPACE_COPY = {
  en: {
    navAriaLabel: "Main navigation",
    brandTagline: "One question, two lenses, visible evidence",
    workspaceLabel: "Workspace",
    workspaceDescription:
      "Global preferences and debate sessions stay aligned across the workspace.",
    collapseSidebar: "Collapse menu",
    expandSidebar: "Expand menu",
    nav: {
      debate: {
        label: "Debate",
        description: "Configure question and roles"
      },
      history: {
        label: "Debate history",
        description: "Review records and status"
      },
      providers: {
        label: "AI providers",
        description: "Manage model access"
      },
      searchEngines: {
        label: "Search engines",
        description: "Manage search defaults"
      },
      settings: {
        label: "General settings",
        description: "Adjust workspace preferences"
      }
    },
    pages: {
      debate: {
        title: "Debate",
        description:
          "Frame the decision question and confirm both roles before launching a structured dual-agent debate."
      },
      history: {
        title: "Debate history",
        description:
          "Manage past questions, model choices, role settings, and session status for review."
      },
      providers: {
        title: "AI providers",
        description:
          "Maintain API keys, model IDs, and endpoints for each model provider."
      },
      searchEngines: {
        title: "Search engines",
        description:
          "Configure the default retrieval engine and access parameters for each search service."
      },
      settings: {
        title: "General settings",
        description:
          "Keep global language and local history storage clear, minimal, and predictable."
      }
    },
    settings: {
      languageTitle: "Language",
      languageDescription:
        "Controls workspace copy, new agent responses, and evidence display language. Existing history keeps its original language.",
      currentLanguage: "Current language",
      chinese: "中文",
      english: "English",
      historyTitle: "Debate history folder",
      historyDescription:
        "Each debate record is saved as a separate JSON file in the local folder you choose.",
      historyIntro:
        "Choose a local folder for debate history. Each session will create a unique JSON file with a timestamp and session id for later review.",
      saveRule: "Save rule: one debate record maps to one JSON file.",
      fileRule: "File name: timestamp plus session id to avoid overwrites.",
      handleRule: "The folder handle is stored only in this browser for future writes.",
      currentFolder: "Current folder",
      unselected: "Not selected",
      authorized: "Authorized",
      needsPermission: "Needs permission",
      unsupported: "Not supported",
      chooseFolder: "Choose folder",
      reselectFolder: "Choose again",
      clearFolder: "Clear saved folder",
      processing: "Processing...",
      unsupportedMessage:
        "This browser does not support directory access, so local folder selection is unavailable.",
      permissionMessage:
        "If permission expires, choose the same folder again or switch to a new save location.",
      feedback: "Folder authorization was not updated; the existing setting is still kept."
    },
    history: {
      filterTitle: "Search and filters",
      filterDescription: "Search by question first, then narrow records by status.",
      searchLabel: "Search history",
      searchPlaceholder: "Search question title, model, or style pair",
      statusLabel: "Status",
      allStatus: "All statuses",
      complete: "Completed",
      running: "In progress",
      failed: "Failed",
      modelPrefix: "Model",
      rolePrefix: "Style pair",
      viewDetails: "View details",
      rerun: "Start same debate",
      delete: "Delete",
      confirmDelete: "Confirm delete",
      cancelDelete: "Cancel",
      detailTitle: "Details",
      detailDialogTitle: "Debate details",
      closeDetails: "Close",
      deleteDialogTitle: "Confirm delete",
      deleteDialogDescription: "This will remove the selected debate history file.",
      searchEnginePrefix: "Search engine",
      debateModePrefix: "Debate mode",
      sharedEvidenceMode: "Shared evidence debate",
      privateEvidenceMode: "Private evidence three-round debate",
      evidencePrefix: "Evidence",
      turnPrefix: "Turns",
      roundPrefix: "Round",
      questionPrefix: "Question",
      createdAtPrefix: "Created",
      statusPrefix: "Status",
      evidenceSectionTitle: "Evidence found",
      turnsSectionTitle: "Debate process",
      analysisTitle: "Pre-speech analysis",
      factualIssuesPrefix: "Factual issues",
      logicalIssuesPrefix: "Logical issues",
      valueIssuesPrefix: "Value issues",
      searchFocusPrefix: "Search focus",
      noAnalysisIssues: "None recorded",
      privateEvidenceTitle: "Private evidence",
      evidenceHolderLabels: {
        lumina: "Lumina holds",
        vigila: "Vigila holds",
        both: "Jointly held"
      },
      summarySectionTitle: "Final summary",
      dataPointsTitle: "Data points",
      noEvidence: "No evidence was saved for this record.",
      noTurns: "No debate turns were saved for this record.",
      strongestForPrefix: "Strongest for",
      strongestAgainstPrefix: "Strongest against",
      coreDisagreementPrefix: "Core disagreement",
      keyUncertaintyPrefix: "Key uncertainty",
      nextActionPrefix: "Next action",
      diagnosisPrefix: "Diagnosis"
    },
    providers: {
      listTitle: "Provider list",
      listDescription: "Switch the provider currently being edited.",
      groupLabel: "AI providers",
      apiKey: "API Key",
      apiKeyPlaceholder: "Enter or update the API key for this provider",
      modelId: "Model ID",
      modelIdPlaceholder: "For example gpt-4.1 / gemini-2.5-pro / doubao-1.5-pro",
      endpoint: "API Endpoint",
      endpointPlaceholder: "Enter a compatible API endpoint",
      extra: "Additional parameters",
      extraPlaceholder: "For example organization id, project id, region, or compatibility notes",
      keyHelpPrefix: "Get API key: create credentials in the",
      keyHelpSuffix: "console, then align model and endpoint here.",
      apiLink: "Get API",
      tutorialLink: "View tutorial",
      configured: "Configured",
      unconfigured: "Not configured",
      reset: "Reset",
      save: "Save configuration"
    },
    searchEngines: {
      listTitle: "Search engine list",
      listDescription: "Choose the default retrieval engine.",
      groupLabel: "Search engines",
      apiKey: "API Key",
      apiKeyPlaceholder: "Enter the API key for this search engine",
      engineId: "Engine ID / CX / App ID",
      engineIdPlaceholder: "Enter the engine identifier",
      endpoint: "API Endpoint",
      extra: "Additional parameters",
      extraPlaceholder: "Enter region, market, or extension parameters",
      apiLink: "Get API",
      tutorialLink: "View tutorial",
      configured: "Configured",
      unconfigured: "Not configured",
      reset: "Reset",
      save: "Save configuration"
    }
  },
  "zh-CN": {
    navAriaLabel: "主导航",
    brandTagline: "一个问题，正反两面，证据可见",
    workspaceLabel: "Workspace",
    workspaceDescription:
      "全局偏好与辩论会话在同一工作区内保持一致。",
    collapseSidebar: "收起菜单",
    expandSidebar: "展开菜单",
    nav: {
      debate: {
        label: "辩论",
        description: "配置问题、角色与模型"
      },
      history: {
        label: "辩论历史",
        description: "查看既往记录与状态"
      },
      providers: {
        label: "AI 服务商",
        description: "管理模型接入配置"
      },
      searchEngines: {
        label: "搜索引擎",
        description: "管理检索引擎与默认选择"
      },
      settings: {
        label: "通用设置",
        description: "调整全局偏好与策略"
      }
    },
    pages: {
      debate: {
        title: "辩论",
        description:
          "围绕同一问题确认双方立场与风格后，直接启动正式的双智能体辩论流程。"
      },
      history: {
        title: "辩论历史",
        description:
          "集中管理既往问题、模型选择、双方风格对与会话状态，让重新查看和复盘成为标准流程。"
      },
      providers: {
        title: "AI 服务商",
        description:
          "在统一设置中心中维护各模型提供方的 API Key、模型 ID 与 Endpoint。"
      },
      searchEngines: {
        title: "搜索引擎",
        description:
          "配置默认检索引擎与各引擎的接入参数，保持辩论前的检索环境清晰统一。"
      },
      settings: {
        title: "通用设置",
        description:
          "管理全局语言与辩论历史本地保存目录，让偏好设置清晰、克制、可预期。"
      }
    },
    settings: {
      languageTitle: "语言设置",
      languageDescription:
        "控制工作区界面、新建 agent 发言语言和证据展示语言；已保存历史保持创建时语言不变。",
      currentLanguage: "当前语言",
      chinese: "中文",
      english: "English",
      historyTitle: "辩论历史保存文件夹",
      historyDescription:
        "每一次辩论记录都会单独保存为一个 JSON 文件，并统一写入你选择的本地目录。",
      historyIntro:
        "选择一个本地文件夹作为历史目录。后续每场辩论都会生成一个唯一 JSON 文件，文件名带时间戳与会话标识，便于统一归档与后续读取。",
      saveRule: "保存规则：一条辩论记录对应一个 JSON 文件。",
      fileRule: "文件命名：时间戳 + 会话标识，避免同名覆盖。",
      handleRule: "目录句柄仅保存在当前浏览器本地，用于后续自动写入。",
      currentFolder: "当前文件夹",
      unselected: "未选择",
      authorized: "已授权",
      needsPermission: "需要重新授权",
      unsupported: "当前浏览器不支持",
      chooseFolder: "选择文件夹",
      reselectFolder: "重新选择",
      clearFolder: "清除保存目录",
      processing: "处理中...",
      unsupportedMessage:
        "当前浏览器不支持目录访问 API，无法选择本地文件夹。",
      permissionMessage:
        "如果目录权限失效，可以重新选择同一目录或切换到新的保存位置。",
      feedback: "目录授权未更新，当前仍保留原有设置。"
    },
    history: {
      filterTitle: "检索与筛选",
      filterDescription: "先按问题搜索，再按状态缩小记录范围。",
      searchLabel: "搜索历史",
      searchPlaceholder: "搜索问题标题、模型或风格对",
      statusLabel: "状态",
      allStatus: "全部状态",
      complete: "已完成",
      running: "进行中",
      failed: "失败",
      modelPrefix: "模型",
      rolePrefix: "风格对",
      viewDetails: "查看详情",
      rerun: "重新发起同题辩论",
      delete: "删除",
      confirmDelete: "确认删除",
      cancelDelete: "取消",
      detailTitle: "详情",
      detailDialogTitle: "辩论详情",
      closeDetails: "关闭",
      deleteDialogTitle: "确认删除",
      deleteDialogDescription: "这将删除选中的辩论历史文件。",
      searchEnginePrefix: "搜索引擎",
      debateModePrefix: "辩论模式",
      sharedEvidenceMode: "共证衡辩",
      privateEvidenceMode: "隔证三辩",
      evidencePrefix: "证据",
      turnPrefix: "回合",
      roundPrefix: "第",
      questionPrefix: "问题",
      createdAtPrefix: "创建时间",
      statusPrefix: "状态",
      evidenceSectionTitle: "查找的证据",
      turnsSectionTitle: "辩论过程",
      analysisTitle: "发言前分析",
      factualIssuesPrefix: "事实问题",
      logicalIssuesPrefix: "逻辑问题",
      valueIssuesPrefix: "价值问题",
      searchFocusPrefix: "检索焦点",
      noAnalysisIssues: "未记录",
      privateEvidenceTitle: "私有证据",
      evidenceHolderLabels: {
        lumina: "乾明持有",
        vigila: "坤察持有",
        both: "共同持有"
      },
      summarySectionTitle: "最终总结",
      dataPointsTitle: "数据点",
      noEvidence: "这条记录没有保存证据。",
      noTurns: "这条记录没有保存辩论回合。",
      strongestForPrefix: "最强支持",
      strongestAgainstPrefix: "最强反对",
      coreDisagreementPrefix: "核心分歧",
      keyUncertaintyPrefix: "关键不确定性",
      nextActionPrefix: "下一步",
      diagnosisPrefix: "诊断"
    },
    providers: {
      listTitle: "服务商列表",
      listDescription: "左侧用于切换当前正在编辑的服务商。",
      groupLabel: "AI 服务商",
      apiKey: "API Key",
      apiKeyPlaceholder: "输入或更新当前服务商的 API Key",
      modelId: "模型 ID",
      modelIdPlaceholder: "例如 gpt-4.1 / gemini-2.5-pro / doubao-1.5-pro",
      endpoint: "API Endpoint",
      endpointPlaceholder: "输入兼容的 API Endpoint",
      extra: "其他必要参数",
      extraPlaceholder: "例如组织 ID、Project ID、Region 或兼容模式说明",
      keyHelpPrefix: "获取 API Key：前往",
      keyHelpSuffix: "控制台创建访问凭证，再回到这里完成模型与 Endpoint 对齐。",
      apiLink: "获取 API",
      tutorialLink: "查看教程",
      configured: "已配置",
      unconfigured: "未配置",
      reset: "重置",
      save: "保存配置"
    },
    searchEngines: {
      listTitle: "搜索引擎列表",
      listDescription: "选择当前默认检索引擎。",
      groupLabel: "搜索引擎",
      apiKey: "API Key",
      apiKeyPlaceholder: "输入当前搜索引擎的 API Key",
      engineId: "Engine ID / CX / App ID",
      engineIdPlaceholder: "输入引擎标识",
      endpoint: "API Endpoint",
      extra: "其他必要参数",
      extraPlaceholder: "输入区域、市场或其他扩展参数",
      apiLink: "获取 API",
      tutorialLink: "查看教程",
      configured: "已配置",
      unconfigured: "未配置",
      reset: "重置",
      save: "保存配置"
    }
  }
} as const;

export function getWorkspaceCopy(language: UiLanguage) {
  return WORKSPACE_COPY[language];
}
