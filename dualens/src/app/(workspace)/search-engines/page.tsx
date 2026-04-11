"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/common/section-card";
import { PageHeader } from "@/components/common/page-header";
import { SelectionCardItem } from "@/components/common/selection-card-item";
import { StatusTag } from "@/components/common/status-tag";
import { Input } from "@/components/ui/input";
import { useAppPreferences } from "@/lib/app-preferences";
import { searchEngineItems, type SearchEngineId } from "@/lib/search-engine-options";
import {
  createDefaultSearchEngineConfigs,
  isSearchEngineConfigured,
  loadSearchEngineConfigs,
  loadSelectedSearchEngineId,
  saveSearchEngineConfig,
  saveSelectedSearchEngineId
} from "@/lib/search-engine-preferences";
import type { SearchEngineConfig } from "@/lib/search-engine-preferences";
import { useSelectableCardGroup } from "@/lib/use-selectable-card-group";
import { getWorkspaceCopy } from "@/lib/workspace-copy";

export default function SearchEnginesPage() {
  const { language } = useAppPreferences();
  const [selectedEngineId, setSelectedEngineId] = useState<SearchEngineId>("tavily");
  const [configs, setConfigs] = useState(() => createDefaultSearchEngineConfigs());
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);
  const selectedEngine =
    searchEngineItems.find((item) => item.id === selectedEngineId) ?? searchEngineItems[0];
  const selectedConfig = configs[selectedEngineId];
  const selectedConfigured = isSearchEngineConfigured(selectedConfig);
  const copy = getWorkspaceCopy(language);
  const searchCopy = copy.searchEngines;
  const { getItemProps } = useSelectableCardGroup({
    items: searchEngineItems,
    selectedId: selectedEngineId,
    onSelect: setSelectedEngineId
  });

  useEffect(() => {
    setSelectedEngineId(loadSelectedSearchEngineId());
    setConfigs(loadSearchEngineConfigs());
    setHasLoadedPreference(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedPreference) {
      return;
    }

    saveSelectedSearchEngineId(selectedEngineId);
  }, [hasLoadedPreference, selectedEngineId]);

  const updateSelectedConfig = (patch: Partial<SearchEngineConfig>) => {
    setConfigs((current) => {
      const nextConfig = {
        ...current[selectedEngineId],
        ...patch
      };

      saveSelectedSearchEngineId(selectedEngineId);
      saveSearchEngineConfig(selectedEngineId, nextConfig);

      return {
        ...current,
        [selectedEngineId]: nextConfig
      };
    });
  };

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title={copy.pages.searchEngines.title}
        description={copy.pages.searchEngines.description}
      />
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <SectionCard title={searchCopy.listTitle} description={searchCopy.listDescription}>
          <div role="radiogroup" aria-label={searchCopy.groupLabel} className="space-y-3">
            {searchEngineItems.map((engine) => {
              const itemProps = getItemProps(engine.id);
              const configured = isSearchEngineConfigured(configs[engine.id]);

              return (
                <SelectionCardItem
                  key={engine.id}
                  name={engine.name}
                  configured={configured}
                  statusLabel={configured ? searchCopy.configured : searchCopy.unconfigured}
                  active={engine.id === selectedEngineId}
                  icon={engine.icon}
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
          key={selectedEngine.id}
          title={selectedEngine.name}
          description={selectedEngine.helperText[language]}
          action={
            <StatusTag tone={selectedConfigured ? "success" : "neutral"}>
              {selectedConfigured ? searchCopy.configured : searchCopy.unconfigured}
            </StatusTag>
          }
        >
          <div className="grid gap-4">
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{searchCopy.apiKey}</span>
              <Input
                aria-label={searchCopy.apiKey}
                type="password"
                value={selectedConfig.apiKey}
                onChange={(event) => updateSelectedConfig({ apiKey: event.target.value })}
                placeholder={searchCopy.apiKeyPlaceholder}
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{searchCopy.engineId}</span>
              <Input
                aria-label={searchCopy.engineId}
                value={selectedConfig.engineIdentifier}
                onChange={(event) => updateSelectedConfig({ engineIdentifier: event.target.value })}
                placeholder={searchCopy.engineIdPlaceholder}
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{searchCopy.endpoint}</span>
              <Input
                aria-label={searchCopy.endpoint}
                value={selectedConfig.endpoint}
                onChange={(event) => updateSelectedConfig({ endpoint: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{searchCopy.extra}</span>
              <Input
                aria-label={searchCopy.extra}
                value={selectedConfig.extra}
                onChange={(event) => updateSelectedConfig({ extra: event.target.value })}
                placeholder={searchCopy.extraPlaceholder}
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <a
                href={selectedEngine.apiUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-app-strong transition hover:border-black/20"
              >
                {searchCopy.apiLink}
              </a>
              <a
                href={selectedEngine.tutorialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-app-strong transition hover:border-black/20"
              >
                {searchCopy.tutorialLink}
              </a>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
