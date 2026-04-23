import type { SearchEngineId } from "@/lib/types";

const PROVIDER_HOST_ALLOWLIST = new Set([
  "api.deepseek.com",
  "api.openai.com",
  "generativelanguage.googleapis.com",
  "ark.cn-beijing.volces.com"
]);

const SEARCH_ENDPOINT_ALLOWLIST: Record<SearchEngineId, readonly string[]> = {
  bing: ["https://api.bing.microsoft.com"],
  baidu: ["https://aip.baidubce.com"],
  google: ["https://customsearch.googleapis.com"],
  tavily: ["https://api.tavily.com/search"]
};

const LOCAL_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain"
]);

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function normalizeHostname(hostname: string) {
  return hostname
    .toLowerCase()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/\.$/, "");
}

function parseIpv4(hostname: string) {
  const parts = hostname.split(".");
  if (parts.length !== 4) {
    return null;
  }

  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return Number.NaN;
    }

    return Number(part);
  });

  return octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255)
    ? octets
    : null;
}

function isBlockedIpv4(hostname: string) {
  const octets = parseIpv4(hostname);
  if (!octets) {
    return false;
  }

  const [a, b] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isBlockedIpv6(hostname: string) {
  const normalized = normalizeHostname(hostname);
  if (!normalized.includes(":")) {
    return false;
  }

  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1];

  if (mappedIpv4) {
    return isBlockedIpv4(mappedIpv4);
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/i.test(normalized) ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8")
  );
}

export function isLocalOrPrivateHostname(hostname: string) {
  const normalized = normalizeHostname(hostname);

  return (
    LOCAL_HOSTNAMES.has(normalized) ||
    normalized.endsWith(".localhost") ||
    isBlockedIpv4(normalized) ||
    isBlockedIpv6(normalized)
  );
}

function normalizeUrlForExactMatch(url: URL) {
  if (url.search || url.hash) {
    return "";
  }

  const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return `${url.origin}${pathname}`;
}

export function isAllowedProviderBaseUrl(value: string) {
  const url = parseUrl(value);

  return Boolean(
    url &&
      url.protocol === "https:" &&
      PROVIDER_HOST_ALLOWLIST.has(normalizeHostname(url.hostname))
  );
}

export function isAllowedSearchEndpoint(engineId: SearchEngineId, endpoint: string) {
  const url = parseUrl(endpoint);
  if (!url || url.protocol !== "https:") {
    return false;
  }

  return SEARCH_ENDPOINT_ALLOWLIST[engineId].includes(normalizeUrlForExactMatch(url));
}

export function isAllowedPublicFetchUrl(value: string) {
  const url = parseUrl(value);

  return Boolean(
    url &&
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !isLocalOrPrivateHostname(url.hostname)
  );
}

export function assertAllowedPublicFetchUrl(value: string) {
  if (!isAllowedPublicFetchUrl(value)) {
    throw new Error("URL is not allowed for server-side fetching");
  }

  return new URL(value);
}
