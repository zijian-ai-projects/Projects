"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/common/section-card";
import { PageHeader } from "@/components/common/page-header";
import { SelectionCardItem } from "@/components/common/selection-card-item";
import { StatusTag } from "@/components/common/status-tag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppPreferences } from "@/lib/app-preferences";
import { searchEngineItems, type SearchEngineId } from "@/lib/search-engine-options";
import {
  loadSelectedSearchEngineId,
  saveSelectedSearchEngineId
} from "@/lib/search-engine-preferences";
import { useSelectableCardGroup } from "@/lib/use-selectable-card-group";
import { getWorkspaceCopy } from "@/lib/workspace-copy";

export default function SearchEnginesPage() {
  const { language } = useAppPreferences();
  const [selectedEngineId, setSelectedEngineId] = useState<SearchEngineId>("tavily");
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);
  const selectedEngine =
    searchEngineItems.find((item) => item.id === selectedEngineId) ?? searchEngineItems[0];
  const copy = getWorkspaceCopy(language);
  const searchCopy = copy.searchEngines;
  const { getItemProps } = useSelectableCardGroup({
    items: searchEngineItems,
    selectedId: selectedEngineId,
    onSelect: setSelectedEngineId
  });

  useEffect(() => {
    setSelectedEngineId(loadSelectedSearchEngineId());
    setHasLoadedPreference(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedPreference) {
      return;
    }

    saveSelectedSearchEngineId(selectedEngineId);
  }, [hasLoadedPreference, selectedEngineId]);

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

              return (
                <SelectionCardItem
                  key={engine.id}
                  name={engine.name}
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
            <StatusTag tone={selectedEngine.configured ? "success" : "neutral"}>
              {selectedEngine.configured ? searchCopy.configured : searchCopy.unconfigured}
            </StatusTag>
          }
        >
          <div className="grid gap-4">
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{searchCopy.apiKey}</span>
              <Input aria-label={searchCopy.apiKey} type="password" placeholder={searchCopy.apiKeyPlaceholder} />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{searchCopy.engineId}</span>
              <Input aria-label={searchCopy.engineId} placeholder={searchCopy.engineIdPlaceholder} />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{searchCopy.endpoint}</span>
              <Input aria-label={searchCopy.endpoint} defaultValue={selectedEngine.endpoint} />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>{searchCopy.extra}</span>
              <Input aria-label={searchCopy.extra} placeholder={searchCopy.extraPlaceholder} />
            </label>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary">
                {searchCopy.reset}
              </Button>
              <Button type="button">{searchCopy.save}</Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
