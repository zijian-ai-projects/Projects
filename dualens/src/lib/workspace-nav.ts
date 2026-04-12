export type WorkspaceNavItem = {
  href: "/app" | "/history" | "/providers" | "/search-engines" | "/settings";
  label: string;
  description: string;
};

export const workspaceNavItems: WorkspaceNavItem[] = [
  {
    href: "/app",
    label: "辩论",
    description: "配置问题、角色与模型"
  },
  {
    href: "/history",
    label: "辩论历史",
    description: "查看既往记录与状态"
  },
  {
    href: "/providers",
    label: "AI 服务商",
    description: "管理模型接入配置"
  },
  {
    href: "/search-engines",
    label: "搜索引擎",
    description: "管理检索引擎与默认选择"
  },
  {
    href: "/settings",
    label: "通用设置",
    description: "调整默认偏好与策略"
  }
];
