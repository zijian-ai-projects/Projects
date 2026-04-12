import { WorkspaceSessionPage } from "@/components/layout/workspace-session-page";
import type { UiLanguage } from "@/lib/types";

type AppPageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
  }>;
};

function parseLanguage(value: string | string[] | undefined): UiLanguage | null {
  const language = Array.isArray(value) ? value[0] : value;
  if (language === "en") {
    return "en";
  }

  if (language === "zh-CN") {
    return "zh-CN";
  }

  return null;
}

export default async function AppPage({ searchParams }: AppPageProps) {
  const params = searchParams ? await searchParams : {};
  const initialUiLanguage = parseLanguage(params.lang);

  return <WorkspaceSessionPage initialUiLanguage={initialUiLanguage} />;
}
