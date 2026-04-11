import type { UiLanguage } from "@/lib/types";

export const WORKSPACE_COPY = {
  en: {
    navAriaLabel: "Main navigation",
    brandTagline: "One question, two sides, visible evidence.",
    workspaceLabel: "Workspace",
    workspaceDescription:
      "Global preferences and debate sessions stay aligned across the workspace.",
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
      processing: "Processing...",
      unsupportedMessage:
        "This browser does not support directory access, so local folder selection is unavailable.",
      permissionMessage:
        "If permission expires, choose the same folder again or switch to a new save location.",
      feedback: "Folder authorization was not updated; the existing setting is still kept."
    }
  },
  "zh-CN": {
    navAriaLabel: "主导航",
    brandTagline: "一个问题，正反两面，证据可见",
    workspaceLabel: "Workspace",
    workspaceDescription:
      "全局偏好与辩论会话在同一工作区内保持一致。",
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
          "集中管理既往问题、模型选择、双方角色设定与会话状态，让重新查看和复盘成为标准流程。"
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
      processing: "处理中...",
      unsupportedMessage:
        "当前浏览器不支持目录访问 API，无法选择本地文件夹。",
      permissionMessage:
        "如果目录权限失效，可以重新选择同一目录或切换到新的保存位置。",
      feedback: "目录授权未更新，当前仍保留原有设置。"
    }
  }
} as const;

export function getWorkspaceCopy(language: UiLanguage) {
  return WORKSPACE_COPY[language];
}
