import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";

export default function SearchEnginesPage() {
  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title="搜索引擎"
        description="配置默认检索引擎与各引擎的接入参数，保持辩论前的检索环境清晰统一。"
      />
      <SectionCard
        title="搜索引擎列表"
        description="查看当前支持的搜索引擎，并为下一步配置中心建立统一入口。"
      >
        <div className="text-sm text-app-muted">Bing / 百度 / Google / Tavily</div>
      </SectionCard>
    </div>
  );
}
