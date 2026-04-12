import { HomePage } from "@/components/home/home-page";
import type { UiLanguage } from "@/lib/types";

export function ProductEntryPage({ language }: { language?: UiLanguage }) {
  return <HomePage initialLanguage={language} />;
}
