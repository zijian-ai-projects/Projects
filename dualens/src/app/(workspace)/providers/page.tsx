"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { SelectionCardItem } from "@/components/common/selection-card-item";
import { StatusTag } from "@/components/common/status-tag";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSelectableCardGroup } from "@/lib/use-selectable-card-group";

type ProviderId = "deepseek" | "openai" | "gemini" | "doubao";

const providerItems = [
  {
    id: "deepseek",
    name: "DeepSeek",
    configured: true,
    icon: "D",
    apiKeyHint: "在 DeepSeek 控制台创建 API Key，并保持服务端环境变量或加密存储同步。",
    endpoint: "https://api.deepseek.com"
  },
  {
    id: "openai",
    name: "OpenAI",
    configured: false,
    icon: "O",
    apiKeyHint: "使用 OpenAI 平台项目级 API Key，并选择可用于双角色辩论的模型。",
    endpoint: "https://api.openai.com/v1"
  },
  {
    id: "gemini",
    name: "Gemini",
    configured: false,
    icon: "G",
    apiKeyHint: "在 Google AI Studio 或 Vertex AI 中生成对应的访问凭证。",
    endpoint: "https://generativelanguage.googleapis.com"
  },
  {
    id: "doubao",
    name: "豆包",
    configured: false,
    icon: "豆",
    apiKeyHint: "在火山引擎控制台配置推理接入，并准备对应模型与 Endpoint。",
    endpoint: "https://ark.cn-beijing.volces.com/api/v3"
  }
] as const;

export default function ProvidersPage() {
  const [selectedProviderId, setSelectedProviderId] = useState<ProviderId>("deepseek");
  const selectedProvider = providerItems.find((item) => item.id === selectedProviderId) ?? providerItems[0];
  const { getItemProps } = useSelectableCardGroup({
    items: providerItems,
    selectedId: selectedProviderId,
    onSelect: setSelectedProviderId
  });

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title="AI 服务商"
        description="在统一设置中心中维护各模型提供方的 API Key、模型 ID 与 Endpoint。页面先完成正式配置结构，后续再接真实持久化。"
      />
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <SectionCard title="服务商列表" description="左侧用于切换当前正在编辑的服务商。">
          <div role="radiogroup" aria-label="AI 服务商" className="space-y-3">
            {providerItems.map((provider) => {
              const itemProps = getItemProps(provider.id);

              return (
                <SelectionCardItem
                  key={provider.id}
                  name={provider.name}
                  configured={provider.configured}
                  active={provider.id === selectedProviderId}
                  icon={provider.icon}
                  tabIndex={itemProps.tabIndex}
                  onClick={itemProps.onClick}
                  onKeyDown={itemProps.onKeyDown}
                  buttonRef={itemProps.buttonRef}
                />
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          key={selectedProvider.id}
          title={selectedProvider.name}
          description={selectedProvider.apiKeyHint}
          action={
            <StatusTag tone={selectedProvider.configured ? "success" : "neutral"}>
              {selectedProvider.configured ? "已配置" : "未配置"}
            </StatusTag>
          }
        >
          <div className="grid gap-4">
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>API Key</span>
              <Input aria-label="API Key" type="password" defaultValue={selectedProvider.configured ? "sk-live-placeholder" : ""} placeholder="输入或更新当前服务商的 API Key" />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>模型 ID</span>
              <Input aria-label="模型 ID" defaultValue={selectedProvider.id === "deepseek" ? "deepseek-chat" : ""} placeholder="例如 gpt-4.1 / gemini-2.5-pro / doubao-1.5-pro" />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>API Endpoint</span>
              <Input aria-label="API Endpoint" defaultValue={selectedProvider.endpoint} placeholder="输入兼容的 API Endpoint" />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>其他必要参数</span>
              <Input placeholder="例如组织 ID、Project ID、Region 或兼容模式说明" />
            </label>
            <div className="rounded-[22px] border border-black/8 bg-black/[0.02] px-4 py-4 text-sm leading-6 text-app-muted">
              获取 API Key：前往 {selectedProvider.name} 控制台创建访问凭证，再回到这里完成模型与 Endpoint 对齐。
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary">
                重置
              </Button>
              <Button type="button">保存配置</Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
