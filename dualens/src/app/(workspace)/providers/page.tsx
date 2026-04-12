"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { SelectionCardItem } from "@/components/common/selection-card-item";
import { StatusTag } from "@/components/common/status-tag";
import { Input } from "@/components/ui/input";
import { useAppPreferences } from "@/lib/app-preferences";
import {
  isModelProviderConfigured,
  loadModelProviderConfigs,
  loadSelectedModelProviderId,
  MODEL_PROVIDER_OPTIONS,
  saveModelProviderConfig,
  saveSelectedModelProviderId,
  type ModelProviderConfig,
  type ModelProviderId
} from "@/lib/model-provider-preferences";
import { useSelectableCardGroup } from "@/lib/use-selectable-card-group";
import { getWorkspaceCopy } from "@/lib/workspace-copy";

const providerHints: Record<ModelProviderId, Record<"en" | "zh-CN", string>> = {
  deepseek: {
    en: "Create an API key in the DeepSeek console, then save the key, model, and endpoint here.",
    "zh-CN": "在 DeepSeek 控制台创建 API Key，然后在这里保存 Key、模型与 Endpoint。"
  },
  openai: {
    en: "Use an OpenAI project API key and choose a model suitable for dual-role debate.",
    "zh-CN": "使用 OpenAI 平台项目级 API Key，并选择可用于双角色辩论的模型。"
  },
  gemini: {
    en: "Generate credentials in Google AI Studio or Vertex AI.",
    "zh-CN": "在 Google AI Studio 或 Vertex AI 中生成对应的访问凭证。"
  },
  doubao: {
    en: "Configure inference access in Volcengine and prepare the matching model and endpoint.",
    "zh-CN": "在火山引擎控制台配置推理接入，并准备对应模型与 Endpoint。"
  }
};

export default function ProvidersPage() {
  const { language } = useAppPreferences();
  const [configs, setConfigs] = useState(() => loadModelProviderConfigs());
  const [selectedProviderId, setSelectedProviderId] = useState<ModelProviderId>(
    () => loadSelectedModelProviderId()
  );
  const selectedProvider =
    MODEL_PROVIDER_OPTIONS.find((item) => item.id === selectedProviderId) ??
    MODEL_PROVIDER_OPTIONS[0];
  const selectedConfig = configs[selectedProviderId];
  const selectedConfigured = isModelProviderConfigured(selectedConfig);
  const copy = getWorkspaceCopy(language);
  const providerCopy = copy.providers;
  const { getItemProps } = useSelectableCardGroup({
    items: MODEL_PROVIDER_OPTIONS,
    selectedId: selectedProviderId,
    onSelect: (providerId) => {
      setSelectedProviderId(providerId);
      saveSelectedModelProviderId(providerId);
    }
  });

  const updateSelectedConfig = (patch: Partial<ModelProviderConfig>) => {
    setConfigs((current) => {
      const nextConfig = {
        ...current[selectedProviderId],
        ...patch
      };

      saveSelectedModelProviderId(selectedProviderId);
      saveModelProviderConfig(selectedProviderId, nextConfig);

      return {
        ...current,
        [selectedProviderId]: nextConfig
      };
    });
  };

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title={copy.pages.providers.title}
        description={copy.pages.providers.description}
      />
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <SectionCard title={providerCopy.listTitle} description={providerCopy.listDescription}>
          <div role="radiogroup" aria-label={providerCopy.groupLabel} className="space-y-3">
            {MODEL_PROVIDER_OPTIONS.map((provider) => {
              const itemProps = getItemProps(provider.id);
              const configured = isModelProviderConfigured(configs[provider.id]);

              return (
                <SelectionCardItem
                  key={provider.id}
                  name={provider.name}
                  configured={configured}
                  statusLabel={configured ? providerCopy.configured : providerCopy.unconfigured}
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
          description={providerHints[selectedProvider.id][language]}
          action={
            <StatusTag tone={selectedConfigured ? "success" : "neutral"}>
              {selectedConfigured ? providerCopy.configured : providerCopy.unconfigured}
            </StatusTag>
          }
        >
          <div className="grid gap-4">
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{providerCopy.apiKey}</span>
              <Input
                aria-label={providerCopy.apiKey}
                type="password"
                value={selectedConfig.apiKey}
                onChange={(event) => updateSelectedConfig({ apiKey: event.target.value })}
                placeholder={providerCopy.apiKeyPlaceholder}
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{providerCopy.modelId}</span>
              <Input
                aria-label={providerCopy.modelId}
                value={selectedConfig.modelId}
                onChange={(event) => updateSelectedConfig({ modelId: event.target.value })}
                placeholder={providerCopy.modelIdPlaceholder}
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{providerCopy.endpoint}</span>
              <Input
                aria-label={providerCopy.endpoint}
                value={selectedConfig.endpoint}
                onChange={(event) => updateSelectedConfig({ endpoint: event.target.value })}
                placeholder={providerCopy.endpointPlaceholder}
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{providerCopy.extra}</span>
              <Input
                aria-label={providerCopy.extra}
                value={selectedConfig.extra}
                onChange={(event) => updateSelectedConfig({ extra: event.target.value })}
                placeholder={providerCopy.extraPlaceholder}
              />
            </label>
            <div className="rounded-[22px] border border-black/8 bg-black/[0.02] px-4 py-4 text-sm leading-6 text-app-muted">
              {providerCopy.keyHelpPrefix} {selectedProvider.name} {providerCopy.keyHelpSuffix}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <a
                href={selectedProvider.apiUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-app-strong transition hover:border-black/20"
              >
                {providerCopy.apiLink}
              </a>
              <a
                href={selectedProvider.tutorialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-app-strong transition hover:border-black/20"
              >
                {providerCopy.tutorialLink}
              </a>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
