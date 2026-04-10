"use client";

import { useState } from "react";
import { SectionCard } from "@/components/common/section-card";
import { PageHeader } from "@/components/common/page-header";
import { SelectionCardItem } from "@/components/common/selection-card-item";
import { StatusTag } from "@/components/common/status-tag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchEngineItems, type SearchEngineId } from "@/lib/search-engine-options";
import { useSelectableCardGroup } from "@/lib/use-selectable-card-group";

export default function SearchEnginesPage() {
  const [selectedEngineId, setSelectedEngineId] = useState<SearchEngineId>("tavily");
  const selectedEngine =
    searchEngineItems.find((item) => item.id === selectedEngineId) ?? searchEngineItems[0];
  const { getItemProps } = useSelectableCardGroup({
    items: searchEngineItems,
    selectedId: selectedEngineId,
    onSelect: setSelectedEngineId
  });

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title="搜索引擎"
        description="配置默认检索引擎与各引擎的接入参数，保持辩论前的检索环境清晰统一。"
      />
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <SectionCard title="搜索引擎列表" description="选择当前默认检索引擎。">
          <div role="radiogroup" aria-label="搜索引擎" className="space-y-3">
            {searchEngineItems.map((engine) => {
              const itemProps = getItemProps(engine.id);

              return (
                <SelectionCardItem
                  key={engine.id}
                  name={engine.name}
                  configured={engine.configured}
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
          description={selectedEngine.helperText}
          action={
            <StatusTag tone={selectedEngine.configured ? "success" : "neutral"}>
              {selectedEngine.configured ? "已配置" : "未配置"}
            </StatusTag>
          }
        >
          <div className="grid gap-4">
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>API Key</span>
              <Input aria-label="API Key" type="password" placeholder="输入当前搜索引擎的 API Key" />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>Engine ID / CX / App ID</span>
              <Input aria-label="Engine ID / CX / App ID" placeholder="输入引擎标识" />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>API Endpoint</span>
              <Input aria-label="API Endpoint" defaultValue={selectedEngine.endpoint} />
            </label>
            <label className="space-y-2 text-sm font-medium text-app-strong">
              <span>其他必要参数</span>
              <Input aria-label="其他必要参数" placeholder="输入区域、市场或其他扩展参数" />
            </label>
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
