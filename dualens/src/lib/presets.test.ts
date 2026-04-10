import { describe, expect, it } from "vitest";
import {
  getLocalizedTemperamentOptionLabel,
  getLocalizedTemperamentPairLabel,
  getOppositeTemperament,
  getTemperamentPairById,
  TEMPERAMENT_PAIRS
} from "@/lib/presets";
import {
  getLocalizedSideIdentityCopy,
  SIDE_IDENTITIES
} from "@/lib/side-identities";

describe("temperament pair catalog", () => {
  it("exposes only temperament pairs and resolves pair helpers", () => {
    expect(TEMPERAMENT_PAIRS.map((pair) => pair.id)).toEqual([
      "cautious-aggressive",
      "rational-intuitive",
      "cost-benefit",
      "short-long"
    ]);

    const pair = getTemperamentPairById("cautious-aggressive");

    expect(pair).toBeDefined();
    expect(pair?.options).toEqual(["cautious", "aggressive"]);
    expect(getOppositeTemperament(pair!, "cautious")).toBe("aggressive");
    expect(getOppositeTemperament(pair!, "aggressive")).toBe("cautious");
  });

  it("rejects a temperament that does not belong to the selected pair", () => {
    const pair = getTemperamentPairById("rational-intuitive");

    expect(pair).toBeDefined();
    expect(() => getOppositeTemperament(pair!, "cautious")).toThrow(
      'Invalid temperament "cautious" for pair "rational-intuitive"'
    );
  });

  it("localizes temperament option labels", () => {
    expect(getLocalizedTemperamentOptionLabel("cost-focused", "en")).toBe("Cost-focused");
    expect(getLocalizedTemperamentOptionLabel("cost-focused", "zh-CN")).toBe("成本");
    expect(getLocalizedTemperamentOptionLabel("long-term", "en")).toBe("Long-term");
    expect(getLocalizedTemperamentOptionLabel("long-term", "zh-CN")).toBe("长期");
  });

  it("localizes temperament pair labels", () => {
    const pair = getTemperamentPairById("cost-benefit");

    expect(pair).toBeDefined();
    expect(getLocalizedTemperamentPairLabel(pair!, "en")).toBe(
      "Cost-focused / Benefit-focused"
    );
    expect(getLocalizedTemperamentPairLabel(pair!, "zh-CN")).toBe("成本 / 收益");
  });
});

describe("fixed side identities", () => {
  it("provides the shared Lumina and Vigila identities with descriptors", () => {
    expect(SIDE_IDENTITIES.map((identity) => identity.key)).toEqual(["lumina", "vigila"]);
    expect(getLocalizedSideIdentityCopy("lumina", "en")).toEqual({
      name: "Lumina",
      descriptor: "argument lead"
    });
    expect(getLocalizedSideIdentityCopy("lumina", "zh-CN")).toEqual({
      name: "乾明",
      descriptor: "立论主张"
    });
    expect(getLocalizedSideIdentityCopy("vigila", "en")).toEqual({
      name: "Vigila",
      descriptor: "critical review"
    });
    expect(getLocalizedSideIdentityCopy("vigila", "zh-CN")).toEqual({
      name: "坤察",
      descriptor: "驳论审视"
    });
  });

  it("fails loudly when a side identity key is missing", () => {
    expect(() =>
      getLocalizedSideIdentityCopy("missing" as never, "en")
    ).toThrow('Missing side identity for key "missing"');
  });
});
