import type { SideIdentity, SideIdentityKey, UiLanguage } from "@/lib/types";

export const SIDE_IDENTITIES = [
  {
    key: "lumina",
    name: {
      en: "Lumina",
      "zh-CN": "乾明"
    },
    descriptor: {
      en: "argument lead",
      "zh-CN": "立论主张"
    }
  },
  {
    key: "vigila",
    name: {
      en: "Vigila",
      "zh-CN": "坤察"
    },
    descriptor: {
      en: "critical review",
      "zh-CN": "驳论审视"
    }
  }
] as const satisfies readonly SideIdentity[];

export function getSideIdentityByKey(key: SideIdentityKey) {
  return SIDE_IDENTITIES.find((identity) => identity.key === key);
}

export function getLocalizedSideIdentityCopy(key: SideIdentityKey, language: UiLanguage) {
  const identity = getSideIdentityByKey(key);

  if (!identity) {
    throw new Error(`Missing side identity for key "${key}"`);
  }

  return {
    name: identity.name[language] ?? identity.name.en,
    descriptor: identity.descriptor[language] ?? identity.descriptor.en
  };
}
