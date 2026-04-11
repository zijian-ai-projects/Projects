"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { SelectionCardItem } from "@/components/common/selection-card-item";
import { StatusTag } from "@/components/common/status-tag";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppPreferences } from "@/lib/app-preferences";
import { useSelectableCardGroup } from "@/lib/use-selectable-card-group";
import { getWorkspaceCopy } from "@/lib/workspace-copy";

type ProviderId = "deepseek" | "openai" | "gemini" | "doubao";

const providerItems = [
  {
    id: "deepseek",
    name: "DeepSeek",
    configured: true,
    icon: "D",
    apiKeyHint: {
      en: "Create an API key in the DeepSeek console and keep server environment variables or encrypted storage aligned.",
      "zh-CN": "在 DeepSeek 控制台创建 API Key，并保持服务端环境变量或加密存储同步。"
    },
    endpoint: "https://api.deepseek.com"
  },
  {
    id: "openai",
    name: "OpenAI",
    configured: false,
    icon: "O",
    apiKeyHint: {
      en: "Use an OpenAI project API key and choose a model suitable for dual-role debate.",
      "zh-CN": "使用 OpenAI 平台项目级 API Key，并选择可用于双角色辩论的模型。"
    },
    endpoint: "https://api.openai.com/v1"
  },
  {
    id: "gemini",
    name: "Gemini",
    configured: false,
    icon: "G",
    apiKeyHint: {
      en: "Generate credentials in Google AI Studio or Vertex AI.",
      "zh-CN": "在 Google AI Studio 或 Vertex AI 中生成对应的访问凭证。"
    },
    endpoint: "https://generativelanguage.googleapis.com"
  },
  {
    id: "doubao",
    name: "豆包",
    configured: false,
    icon: "豆",
    apiKeyHint: {
      en: "Configure inference access in Volcengine and prepare the matching model and endpoint.",
      "zh-CN": "在火山引擎控制台配置推理接入，并准备对应模型与 Endpoint。"
    },
    endpoint: "https://ark.cn-beijing.volces.com/api/v3"
  }
] as const;

export default function ProvidersPage() {
  const { language } = useAppPreferences();
  const [selectedProviderId, setSelectedProviderId] = useState<ProviderId>("deepseek");
  const selectedProvider = providerItems.find((item) => item.id === selectedProviderId) ?? providerItems[0];
  const copy = getWorkspaceCopy(language);
  const providerCopy = copy.providers;
  const { getItemProps } = useSelectableCardGroup({
    items: providerItems,
    selectedId: selectedProviderId,
    onSelect: setSelectedProviderId
  });

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title={copy.pages.providers.title}
        description={copy.pages.providers.description}
      />
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <SectionCard title={providerCopy.listTitle} description={providerCopy.listDescription}>
          <div role="radiogroup" aria-label={providerCopy.groupLabel} className="space-y-3">
            {providerItems.map((provider) => {
              const itemProps = getItemProps(provider.id);

              return (
                <SelectionCardItem
                  key={provider.id}
                  name={provider.name}
                  configured={provider.configured}
                  statusLabel={provider.configured ? providerCopy.configured : providerCopy.unconfigured}
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
          description={selectedProvider.apiKeyHint[language]}
          action={
            <StatusTag tone={selectedProvider.configured ? "success" : "neutral"}>
              {selectedProvider.configured ? providerCopy.configured : providerCopy.unconfigured}
            </StatusTag>
          }
        >
          <div className="grid gap-4">
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{providerCopy.apiKey}</span>
              <Input aria-label={providerCopy.apiKey} type="password" defaultValue={selectedProvider.configured ? "sk-live-placeholder" : ""} placeholder={providerCopy.apiKeyPlaceholder} />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{providerCopy.modelId}</span>
              <Input aria-label={providerCopy.modelId} defaultValue={selectedProvider.id === "deepseek" ? "deepseek-chat" : ""} placeholder={providerCopy.modelIdPlaceholder} />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{providerCopy.endpoint}</span>
              <Input aria-label={providerCopy.endpoint} defaultValue={selectedProvider.endpoint} placeholder={providerCopy.endpointPlaceholder} />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{providerCopy.extra}</span>
              <Input aria-label={providerCopy.extra} placeholder={providerCopy.extraPlaceholder} />
            </label>
            <div className="rounded-[22px] border border-black/8 bg-black/[0.02] px-4 py-4 text-sm leading-6 text-app-muted">
              {providerCopy.keyHelpPrefix} {selectedProvider.name} {providerCopy.keyHelpSuffix}
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary">
                {providerCopy.reset}
              </Button>
              <Button type="button">{providerCopy.save}</Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
