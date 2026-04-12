export function formatStarCount(count: number | null | undefined) {
  if (typeof count !== "number" || !Number.isFinite(count) || count < 0) {
    return "--";
  }

  return new Intl.NumberFormat("en-US").format(count);
}
