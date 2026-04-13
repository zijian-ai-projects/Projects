/*
 * Adapted from shan-shui-inf by Lingdong Huang.
 * Source: https://github.com/LingDong-/shan-shui-inf
 * License: MIT
 *
 * Copyright (c) 2018 Lingdong Huang
 *
 * This TypeScript module ports the core procedural SVG landscape ideas used by
 * shan-shui-inf: seeded noise, brush strokes, blobs, mountain texture, trees,
 * rocks, distant mountains, and horizontal scroll planning. The browser UI,
 * architecture, boats, figures, buildings, and global Math.random override from
 * the original project are intentionally omitted for use as a deterministic
 * product-page background.
 */

export type ShanShuiVariant = "home" | "workspace";

type Point = [number, number];
type PointGrid = Point[][];

type StrokeOptions = {
  xof?: number;
  yof?: number;
  wid?: number;
  col?: string;
  noi?: number;
  out?: number;
  fun?: (x: number) => number;
  part?: string;
};

type PolyOptions = {
  xof?: number;
  yof?: number;
  fil?: string;
  str?: string;
  wid?: number;
  part?: string;
};

type TextureOptions = {
  xof?: number;
  yof?: number;
  tex?: number;
  wid?: number;
  len?: number;
  sha?: number;
  col?: (x: number) => string;
  noi?: (x: number) => number;
  dis?: () => number;
  ret?: boolean;
};

type TreeOptions = {
  hei?: number;
  wid?: number;
  col?: string;
  clu?: number;
  ben?: (x: number) => number;
};

type MountainOptions = {
  hei?: number;
  wid?: number;
  tex?: number;
  veg?: boolean;
  col?: (x: number) => string;
};

type FlatMountainOptions = {
  hei?: number;
  wid?: number;
  tex?: number;
  cho?: number;
};

type DistantMountainOptions = {
  hei?: number;
  len?: number;
  seg?: number;
};

type RockOptions = {
  hei?: number;
  wid?: number;
  tex?: number;
  sha?: number;
};

type PlanEntry =
  | { tag: "distmount"; x: number; y: number; len: number; hei: number; seed: number }
  | { tag: "mount"; x: number; y: number; wid: number; hei: number; tex: number; seed: number }
  | { tag: "flatmount"; x: number; y: number; wid: number; hei: number; seed: number }
  | { tag: "rock"; x: number; y: number; wid: number; hei: number; seed: number }
  | { tag: "grove"; x: number; y: number; count: number; seed: number };

export type ShanShuiStrip = {
  svg: string;
  width: number;
  height: number;
  seed: string;
  variant: ShanShuiVariant;
};

export const SHAN_SHUI_INF_ATTRIBUTION = {
  name: "shan-shui-inf",
  source: "https://github.com/LingDong-/shan-shui-inf",
  license: "MIT",
  copyright: "Copyright (c) 2018 Lingdong Huang"
} as const;

const DEFAULT_SEEDS: Record<ShanShuiVariant, string> = {
  home: "dualens-home-shan-shui-inf-v1",
  workspace: "dualens-workspace-shan-shui-inf-v1"
};

const VARIANT_CONFIG: Record<
  ShanShuiVariant,
  {
    width: number;
    height: number;
    yShift: number;
    detail: number;
    opacityScale: number;
  }
> = {
  home: {
    width: 4200,
    height: 900,
    yShift: 0,
    detail: 1,
    opacityScale: 1
  },
  workspace: {
    width: 4200,
    height: 900,
    yShift: 72,
    detail: 0.76,
    opacityScale: 0.78
  }
};

const stripCache = new Map<string, ShanShuiStrip>();

function hashSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return h >>> 0;
}

class SeededRandom {
  private state: number;

  constructor(seed: string) {
    this.state = hashSeed(seed) || 1;
  }

  next() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  fork(salt: string) {
    return new SeededRandom(`${this.state}:${salt}`);
  }
}

class PerlinNoise {
  private readonly perlin: number[];
  private readonly perlinYWrapB = 4;
  private readonly perlinYWrap = 1 << this.perlinYWrapB;
  private readonly perlinZWrapB = 8;
  private readonly perlinZWrap = 1 << this.perlinZWrapB;
  private readonly perlinSize = 4095;
  private readonly octaves = 4;
  private readonly falloff = 0.5;

  constructor(rng: SeededRandom) {
    this.perlin = Array.from({ length: this.perlinSize + 1 }, () => rng.next());
  }

  noise(x: number, y = 0, z = 0) {
    const nx = x < 0 ? -x : x;
    const ny = y < 0 ? -y : y;
    const nz = z < 0 ? -z : z;
    let xi = Math.floor(nx);
    let yi = Math.floor(ny);
    let zi = Math.floor(nz);
    let xf = nx - xi;
    let yf = ny - yi;
    let zf = nz - zi;
    let result = 0;
    let ampl = 0.5;

    for (let octave = 0; octave < this.octaves; octave += 1) {
      let of = xi + (yi << this.perlinYWrapB) + (zi << this.perlinZWrapB);
      const rxf = scaledCosine(xf);
      const ryf = scaledCosine(yf);
      let n1 = this.perlin[of & this.perlinSize];
      n1 += rxf * (this.perlin[(of + 1) & this.perlinSize] - n1);
      let n2 = this.perlin[(of + this.perlinYWrap) & this.perlinSize];
      n2 += rxf * (this.perlin[(of + this.perlinYWrap + 1) & this.perlinSize] - n2);
      n1 += ryf * (n2 - n1);
      of += this.perlinZWrap;
      n2 = this.perlin[of & this.perlinSize];
      n2 += rxf * (this.perlin[(of + 1) & this.perlinSize] - n2);
      let n3 = this.perlin[(of + this.perlinYWrap) & this.perlinSize];
      n3 += rxf * (this.perlin[(of + this.perlinYWrap + 1) & this.perlinSize] - n3);
      n2 += ryf * (n3 - n2);
      n1 += scaledCosine(zf) * (n2 - n1);
      result += n1 * ampl;
      ampl *= this.falloff;
      xi <<= 1;
      xf *= 2;
      yi <<= 1;
      yf *= 2;
      zi <<= 1;
      zf *= 2;
      if (xf >= 1) {
        xi += 1;
        xf -= 1;
      }
      if (yf >= 1) {
        yi += 1;
        yf -= 1;
      }
      if (zf >= 1) {
        zi += 1;
        zf -= 1;
      }
    }

    return result;
  }
}

function scaledCosine(value: number) {
  return 0.5 * (1 - Math.cos(value * Math.PI));
}

function mapValue(value: number, istart: number, istop: number, ostart: number, ostop: number) {
  return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function pointList(plist: Point[]) {
  return plist.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

function gray(alpha: number, tone = 100) {
  return `rgba(${tone},${tone},${tone},${clamp(alpha, 0, 1).toFixed(3)})`;
}

function poly(plist: Point[], options: PolyOptions = {}) {
  if (plist.length === 0) {
    return "";
  }

  const xof = options.xof ?? 0;
  const yof = options.yof ?? 0;
  const fil = options.fil ?? "rgba(0,0,0,0)";
  const str = options.str ?? fil;
  const wid = options.wid ?? 0;
  const part = options.part ? ` data-shan-shui-part="${options.part}"` : "";
  const points = pointList(plist.map(([x, y]) => [x + xof, y + yof]));

  return `<polyline${part} points="${points}" style="fill:${fil};stroke:${str};stroke-width:${wid}"/>`;
}

function midPoint(points: Point[]) {
  return points.reduce<Point>((acc, point) => [acc[0] + point[0] / points.length, acc[1] + point[1] / points.length], [
    0,
    0
  ]);
}

class ShanShuiContext {
  readonly rng: SeededRandom;
  readonly noise: PerlinNoise;

  constructor(seed: string) {
    this.rng = new SeededRandom(seed);
    this.noise = new PerlinNoise(this.rng.fork("noise"));
  }

  random() {
    return this.rng.next();
  }

  choice<T>(arr: T[]) {
    return arr[Math.floor(arr.length * this.random())];
  }

  normRand(min: number, max: number) {
    return mapValue(this.random(), 0, 1, min, max);
  }

  weightedRandom(func: (x: number) => number) {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const x = this.random();
      const y = this.random();
      if (y < func(x)) {
        return x;
      }
    }

    return this.random();
  }

  gaussian() {
    return this.weightedRandom((x) => Math.E ** (-24 * (x - 0.5) ** 2)) * 2 - 1;
  }

  loopNoise(nslist: number[]) {
    const diff = nslist[nslist.length - 1] - nslist[0];
    let min = 100;
    let max = -100;
    for (let i = 0; i < nslist.length; i += 1) {
      nslist[i] += (diff * (nslist.length - 1 - i)) / (nslist.length - 1);
      min = Math.min(min, nslist[i]);
      max = Math.max(max, nslist[i]);
    }
    for (let i = 0; i < nslist.length; i += 1) {
      nslist[i] = mapValue(nslist[i], min, max, 0, 1);
    }
  }

  div(plist: Point[], resolution: number) {
    const total = (plist.length - 1) * resolution;
    let lastX = 0;
    let lastY = 0;
    const result: Point[] = [];
    for (let i = 0; i < total; i += 1) {
      const last = plist[Math.floor(i / resolution)];
      const next = plist[Math.ceil(i / resolution)];
      const p = (i % resolution) / resolution;
      const nx = last[0] * (1 - p) + next[0] * p;
      const ny = last[1] * (1 - p) + next[1] * p;
      Math.atan2(ny - lastY, nx - lastX);
      result.push([nx, ny]);
      lastX = nx;
      lastY = ny;
    }
    if (plist.length > 0) {
      result.push(plist[plist.length - 1]);
    }

    return result;
  }

  stroke(ptlist: Point[], options: StrokeOptions = {}) {
    if (ptlist.length < 2) {
      return "";
    }

    const xof = options.xof ?? 0;
    const yof = options.yof ?? 0;
    const wid = options.wid ?? 2;
    const col = options.col ?? gray(0.9, 200);
    const noi = options.noi ?? 0.5;
    const out = options.out ?? 1;
    const fun = options.fun ?? ((x: number) => Math.sin(x * Math.PI));
    const vtxlist0: Point[] = [];
    const vtxlist1: Point[] = [];
    const n0 = this.random() * 10;

    for (let i = 1; i < ptlist.length - 1; i += 1) {
      let width = wid * fun(i / ptlist.length);
      width = width * (1 - noi) + width * noi * this.noise.noise(i * 0.5, n0);
      const a1 = Math.atan2(ptlist[i][1] - ptlist[i - 1][1], ptlist[i][0] - ptlist[i - 1][0]);
      const a2 = Math.atan2(ptlist[i][1] - ptlist[i + 1][1], ptlist[i][0] - ptlist[i + 1][0]);
      let angle = (a1 + a2) / 2;
      if (angle < a2) {
        angle += Math.PI;
      }
      vtxlist0.push([ptlist[i][0] + width * Math.cos(angle), ptlist[i][1] + width * Math.sin(angle)]);
      vtxlist1.push([ptlist[i][0] - width * Math.cos(angle), ptlist[i][1] - width * Math.sin(angle)]);
    }

    const vtxlist = [ptlist[0]].concat(vtxlist0.concat(vtxlist1.concat([ptlist[ptlist.length - 1]]).reverse()));

    return poly(vtxlist.concat([ptlist[0]]), { xof, yof, fil: col, str: col, wid: out, part: options.part ?? "stroke" });
  }

  blob(x: number, y: number, options: {
    len?: number;
    wid?: number;
    ang?: number;
    col?: string;
    noi?: number;
    ret?: boolean;
    fun?: (x: number) => number;
    part?: string;
  } = {}) {
    const len = options.len ?? 20;
    const wid = options.wid ?? 5;
    const ang = options.ang ?? 0;
    const col = options.col ?? gray(0.9, 200);
    const noi = options.noi ?? 0.5;
    const fun =
      options.fun ??
      ((p: number) =>
        p <= 1 ? Math.sin(p * Math.PI) ** 0.5 : -(Math.sin((p + 1) * Math.PI) ** 0.5));
    const resolution = 20;
    const lengthAngleList: Point[] = [];
    for (let i = 0; i <= resolution; i += 1) {
      const p = (i / resolution) * 2;
      const xo = len / 2 - Math.abs(p - 1) * len;
      const yo = (fun(p) * wid) / 2;
      lengthAngleList.push([Math.sqrt(xo * xo + yo * yo), Math.atan2(yo, xo)]);
    }
    const nslist = Array.from({ length: resolution + 1 }, (_, i) => this.noise.noise(i * 0.05, this.random() * 10));
    this.loopNoise(nslist);
    const plist: Point[] = [];
    for (let i = 0; i < lengthAngleList.length; i += 1) {
      const ns = nslist[i] * noi + (1 - noi);
      plist.push([
        x + Math.cos(lengthAngleList[i][1] + ang) * lengthAngleList[i][0] * ns,
        y + Math.sin(lengthAngleList[i][1] + ang) * lengthAngleList[i][0] * ns
      ]);
    }

    return options.ret ? plist : poly(plist, { fil: col, str: col, wid: 0, part: options.part ?? "blob" });
  }

  texture(ptlist: PointGrid, options: TextureOptions = {}) {
    const xof = options.xof ?? 0;
    const yof = options.yof ?? 0;
    const tex = options.tex ?? 400;
    const wid = options.wid ?? 1.5;
    const len = options.len ?? 0.2;
    const sha = options.sha ?? 0;
    const noi = options.noi ?? ((x: number) => 30 / x);
    const col = options.col ?? (() => gray(this.random() * 0.3, 100));
    const dis =
      options.dis ??
      (() => {
        if (this.random() > 0.5) {
          return (1 / 3) * this.random();
        }

        return 2 / 3 + (1 / 3) * this.random();
      });
    const resolution = [ptlist.length, ptlist[0].length];
    const texlist: PointGrid = [];

    for (let i = 0; i < tex; i += 1) {
      const mid = Math.floor(dis() * resolution[1]);
      const halfLength = Math.floor(this.random() * (resolution[1] * len));
      const start = clamp(mid - halfLength, 0, resolution[1] - 1);
      const end = clamp(mid + halfLength, 0, resolution[1] - 1);
      const layer = (i / tex) * (resolution[0] - 1);
      const floor = Math.floor(layer);
      const ceil = Math.ceil(layer);
      const p = layer - floor;
      texlist.push([]);
      for (let j = start; j < end; j += 1) {
        const x = ptlist[floor][j][0] * p + ptlist[ceil][j][0] * (1 - p);
        const y = ptlist[floor][j][1] * p + ptlist[ceil][j][1] * (1 - p);
        const ns: Point = [
          noi(layer + 1) * (this.noise.noise(x, j * 0.5) - 0.5),
          noi(layer + 1) * (this.noise.noise(y, j * 0.5) - 0.5)
        ];
        texlist[texlist.length - 1].push([x + ns[0], y + ns[1]]);
      }
    }

    let output = "";
    if (sha) {
      for (let j = 0; j < texlist.length; j += 1 + Number(sha !== 0)) {
        output += this.stroke(
          texlist[j].map(([x, y]) => [x + xof, y + yof]),
          { col: gray(0.1, 100), wid: sha, part: "texture" }
        );
      }
    }
    for (let j = sha; j < texlist.length; j += 1 + sha) {
      output += this.stroke(
        texlist[j].map(([x, y]) => [x + xof, y + yof]),
        { col: col(j / texlist.length), wid, part: "texture" }
      );
    }

    return options.ret ? texlist : output;
  }

  tree01(x: number, y: number, options: TreeOptions = {}) {
    const hei = options.hei ?? 50;
    const wid = options.wid ?? 3;
    const col = options.col ?? gray(0.5, 100);
    const resolution = 10;
    const nslist = Array.from({ length: resolution }, (_, i) => [
      this.noise.noise(i * 0.5),
      this.noise.noise(i * 0.5, 0.5)
    ]);
    let output = `<g data-shan-shui-tree="tree01">`;
    const line1: Point[] = [];
    const line2: Point[] = [];
    for (let i = 0; i < resolution; i += 1) {
      const nx = x;
      const ny = y - (i * hei) / resolution;
      if (i >= resolution / 4) {
        for (let j = 0; j < (resolution - i) / 5; j += 1) {
          output += this.blob(nx + (this.random() - 0.5) * wid * 1.2 * (resolution - i), ny + (this.random() - 0.5) * wid, {
            len: this.random() * 20 * (resolution - i) * 0.2 + 10,
            wid: this.random() * 6 + 3,
            ang: ((this.random() - 0.5) * Math.PI) / 6,
            col: gray(0.38 + this.random() * 0.18, 100),
            part: "tree-leaf"
          });
        }
      }
      line1.push([nx + (nslist[i][0] - 0.5) * wid - wid / 2, ny]);
      line2.push([nx + (nslist[i][1] - 0.5) * wid + wid / 2, ny]);
    }
    output += poly(line1, { fil: "none", str: col, wid: 1.5, part: "tree-trunk" });
    output += poly(line2, { fil: "none", str: col, wid: 1.5, part: "tree-trunk" });

    return `${output}</g>`;
  }

  tree02(x: number, y: number, options: TreeOptions = {}) {
    const hei = options.hei ?? 16;
    const wid = options.wid ?? 8;
    const clu = options.clu ?? 5;
    const col = options.col ?? gray(0.5, 100);
    let output = `<g data-shan-shui-tree="tree02">`;
    for (let i = 0; i < clu; i += 1) {
      output += this.blob(x + this.gaussian() * clu * 4, y + this.gaussian() * clu * 4, {
        ang: Math.PI / 2,
        col,
        wid: this.random() * wid * 0.75 + wid * 0.5,
        len: this.random() * hei * 0.75 + hei * 0.5,
        part: "tree-leaf",
        fun: (p) =>
          p <= 1 ? Math.sqrt(Math.sin(p * Math.PI) * p) : -Math.sqrt(Math.sin((p - 2) * Math.PI * (p - 2)))
      });
    }

    return `${output}</g>`;
  }

  tree03(x: number, y: number, options: TreeOptions = {}) {
    const hei = options.hei ?? 50;
    const wid = options.wid ?? 5;
    const ben = options.ben ?? (() => 0);
    const col = options.col ?? gray(0.5, 100);
    const resolution = 10;
    const nslist = Array.from({ length: resolution }, (_, i) => [
      this.noise.noise(i * 0.5),
      this.noise.noise(i * 0.5, 0.5)
    ]);
    let blobs = "";
    const line1: Point[] = [];
    const line2: Point[] = [];
    for (let i = 0; i < resolution; i += 1) {
      const nx = x + ben(i / resolution) * 100;
      const ny = y - (i * hei) / resolution;
      if (i >= resolution / 5) {
        for (let j = 0; j < (resolution - i) * 2; j += 1) {
          const shape = (p: number) => Math.log(50 * p + 1) / 3.95;
          const ox = this.random() * wid * 2 * shape((resolution - i) / resolution);
          blobs += this.blob(nx + ox * this.choice([-1, 1]), ny + (this.random() - 0.5) * wid * 2, {
            len: ox * 2,
            wid: this.random() * 6 + 3,
            ang: ((this.random() - 0.5) * Math.PI) / 6,
            col: gray(0.34 + this.random() * 0.22, 100),
            part: "tree-leaf"
          });
        }
      }
      line1.push([nx + (((nslist[i][0] - 0.5) * wid - wid / 2) * (resolution - i)) / resolution, ny]);
      line2.push([nx + (((nslist[i][1] - 0.5) * wid + wid / 2) * (resolution - i)) / resolution, ny]);
    }
    const trunk = line1.concat(line2.reverse());

    return `<g data-shan-shui-tree="tree03">${poly(trunk, {
      fil: "white",
      str: col,
      wid: 1.5,
      part: "tree-trunk"
    })}${blobs}</g>`;
  }

  foot(ptlist: PointGrid, xof: number, yof: number) {
    const footList: PointGrid = [];
    const span = 10;
    let nextIndex = 0;
    for (let i = 0; i < ptlist.length - 2; i += 1) {
      if (i === nextIndex) {
        nextIndex = Math.min(nextIndex + this.choice([1, 2]), ptlist.length - 1);
        footList.push([]);
        footList.push([]);
        for (let j = 0; j < Math.min(ptlist[i].length / 8, 10); j += 1) {
          footList[footList.length - 2].push([ptlist[i][j][0] + this.noise.noise(j * 0.1, i) * 10, ptlist[i][j][1]]);
          footList[footList.length - 1].push([
            ptlist[i][ptlist[i].length - 1 - j][0] - this.noise.noise(j * 0.1, i) * 10,
            ptlist[i][ptlist[i].length - 1 - j][1]
          ]);
        }
        footList[footList.length - 2] = footList[footList.length - 2].reverse();
        footList[footList.length - 1] = footList[footList.length - 1].reverse();
        for (let j = 0; j < span; j += 1) {
          const p = j / span;
          const x1 = ptlist[i][0][0] * (1 - p) + ptlist[nextIndex][0][0] * p;
          let y1 = ptlist[i][0][1] * (1 - p) + ptlist[nextIndex][0][1] * p;
          const x2 = ptlist[i][ptlist[i].length - 1][0] * (1 - p) + ptlist[nextIndex][ptlist[i].length - 1][0] * p;
          let y2 = ptlist[i][ptlist[i].length - 1][1] * (1 - p) + ptlist[nextIndex][ptlist[i].length - 1][1] * p;
          const vib = -1.7 * (p - 1) * p ** (1 / 5);
          y1 += vib * 5 + this.noise.noise(xof * 0.05, i) * 5;
          y2 += vib * 5 + this.noise.noise(xof * 0.05, i) * 5;
          footList[footList.length - 2].push([x1, y1]);
          footList[footList.length - 1].push([x2, y2]);
        }
      }
    }

    let output = "";
    for (const footShape of footList) {
      output += poly(footShape, { xof, yof, fil: "white", str: "none", part: "mountain-foot" });
    }
    for (const footShape of footList) {
      output += this.stroke(
        footShape.map(([x, y]) => [x + xof, y + yof]),
        { col: gray(0.1 + this.random() * 0.1, 100), wid: 1, part: "mountain-foot" }
      );
    }

    return output;
  }

  mountain(xoff: number, yoff: number, seed: number, options: MountainOptions = {}) {
    const hei = options.hei ?? 100 + this.random() * 400;
    const wid = options.wid ?? 400 + this.random() * 200;
    const tex = options.tex ?? 200;
    const veg = options.veg ?? true;
    const col = options.col;
    const ptlist: PointGrid = [];
    const resolution: [number, number] = [10, 50];
    let hoff = 0;

    for (let j = 0; j < resolution[0]; j += 1) {
      hoff += (this.random() * yoff) / 100;
      ptlist.push([]);
      for (let i = 0; i < resolution[1]; i += 1) {
        const x = (i / resolution[1] - 0.5) * Math.PI;
        let y = Math.cos(x);
        y *= this.noise.noise(x + 10, j * 0.15, seed);
        const p = 1 - j / resolution[0];
        ptlist[ptlist.length - 1].push([(x / Math.PI) * wid * p, -y * hei * p + hoff]);
      }
    }

    let output = `<g data-shan-shui-mountain="mountain">`;
    const vegetate = (
      treeFunc: (x: number, y: number) => string,
      growthRule: (i: number, j: number) => boolean,
      proofRule: (veglist: Point[], i: number) => boolean
    ) => {
      const veglist: Point[] = [];
      for (let i = 0; i < ptlist.length; i += 1) {
        for (let j = 0; j < ptlist[i].length; j += 1) {
          if (growthRule(i, j)) {
            veglist.push([ptlist[i][j][0], ptlist[i][j][1]]);
          }
        }
      }
      for (let i = 0; i < veglist.length; i += 1) {
        if (proofRule(veglist, i)) {
          output += treeFunc(veglist[i][0], veglist[i][1]);
        }
      }
    };

    vegetate(
      (x, y) =>
        this.tree02(x + xoff, y + yoff - 5, {
          col: gray(this.noise.noise(0.01 * x, 0.01 * y) * 0.15 + 0.5, 100),
          clu: 2
        }),
      (i, j) => {
        const ns = this.noise.noise(j * 0.1, seed);
        return i === 0 && ns ** 3 < 0.1 && Math.abs(ptlist[i][j][1]) / hei > 0.2;
      },
      () => true
    );

    output += poly(ptlist[0].concat([[0, resolution[0] * 4]]), {
      xof: xoff,
      yof: yoff,
      fil: "white",
      str: "none",
      part: "mountain-body"
    });
    output += this.stroke(
      ptlist[0].map(([x, y]) => [x + xoff, y + yoff]),
      { col: gray(0.3, 100), noi: 1, wid: 3, part: "mountain-outline" }
    );
    output += this.foot(ptlist, xoff, yoff);
    output += this.texture(ptlist, {
      xof: xoff,
      yof: yoff,
      tex,
      sha: this.choice([0, 0, 0, 0, 5]),
      col
    });

    vegetate(
      (x, y) =>
        this.tree02(x + xoff, y + yoff, {
          col: gray(this.noise.noise(0.01 * x, 0.01 * y) * 0.15 + 0.5, 100)
        }),
      (i, j) => {
        const ns = this.noise.noise(i * 0.1, j * 0.1, seed + 2);
        return ns ** 3 < 0.1 && Math.abs(ptlist[i][j][1]) / hei > 0.5;
      },
      () => true
    );

    if (veg) {
      vegetate(
        (x, y) => {
          let treeHeight = ((hei + y) / hei) * 70;
          treeHeight = treeHeight * 0.3 + this.random() * treeHeight * 0.7;
          return this.tree01(x + xoff, y + yoff, {
            hei: treeHeight,
            wid: this.random() * 3 + 1,
            col: gray(this.noise.noise(0.01 * x, 0.01 * y) * 0.15 + 0.3, 100)
          });
        },
        (i, j) => {
          const ns = this.noise.noise(i * 0.2, j * 0.05, seed);
          return Boolean(j % 2) && ns ** 4 < 0.012 && Math.abs(ptlist[i][j][1]) / hei < 0.3;
        },
        (veglist, i) => {
          let counter = 0;
          for (let j = 0; j < veglist.length; j += 1) {
            if (i !== j && (veglist[i][0] - veglist[j][0]) ** 2 + (veglist[i][1] - veglist[j][1]) ** 2 < 30 ** 2) {
              counter += 1;
            }
            if (counter > 2) {
              return true;
            }
          }
          return false;
        }
      );

      vegetate(
        (x, y) => {
          let treeHeight = ((hei + y) / hei) * 120;
          treeHeight = treeHeight * 0.5 + this.random() * treeHeight * 0.5;
          const bend = this.random() * 0.1;
          return this.tree03(x + xoff, y + yoff, {
            hei: treeHeight,
            ben: (p) => (p * bend) ** 1,
            col: gray(this.noise.noise(0.01 * x, 0.01 * y) * 0.15 + 0.3, 100)
          });
        },
        (i, j) => {
          const ns = this.noise.noise(i * 0.2, j * 0.05, seed);
          return (j === 0 || j === ptlist[i].length - 1) && ns ** 4 < 0.012;
        },
        () => true
      );
    }

    vegetate(
      (x, y) =>
        this.rock(x + xoff, y + yoff, seed, {
          wid: 20 + this.random() * 20,
          hei: 20 + this.random() * 20,
          sha: 2
        }),
      (_i, j) => (j === 0 || j === ptlist[0].length - 1) && this.random() < 0.1,
      () => true
    );

    return `${output}</g>`;
  }

  flatMount(xoff: number, yoff: number, seed: number, options: FlatMountainOptions = {}) {
    const hei = options.hei ?? 40 + this.random() * 400;
    const wid = options.wid ?? 400 + this.random() * 200;
    const tex = options.tex ?? 80;
    const cho = options.cho ?? 0.5;
    const ptlist: PointGrid = [];
    const resolution: [number, number] = [5, 50];
    let hoff = 0;

    for (let j = 0; j < resolution[0]; j += 1) {
      hoff += (this.random() * yoff) / 100;
      ptlist.push([]);
      for (let i = 0; i < resolution[1]; i += 1) {
        const x = (i / resolution[1] - 0.5) * Math.PI;
        let y = Math.cos(x * 2) + 1;
        y *= this.noise.noise(x + 10, j * 0.1, seed);
        const p = 1 - (j / resolution[0]) * 0.6;
        const nx = (x / Math.PI) * wid * p;
        let ny = -y * hei * p + hoff;
        if (ny < -100 * cho + hoff) {
          ny = -100 * cho + hoff;
        }
        ptlist[ptlist.length - 1].push([nx, ny]);
      }
    }

    let output = `<g data-shan-shui-mountain="flatmount">`;
    output += poly(ptlist[0].concat([[0, resolution[0] * 4]]), {
      xof: xoff,
      yof: yoff,
      fil: "white",
      str: "none",
      part: "mountain-body"
    });
    output += this.stroke(
      ptlist[0].map(([x, y]) => [x + xoff, y + yoff]),
      { col: gray(0.26, 100), noi: 1, wid: 3, part: "mountain-outline" }
    );
    output += this.texture(ptlist, {
      xof: xoff,
      yof: yoff,
      tex,
      wid: 2,
      dis: () => (this.random() > 0.5 ? 0.1 + 0.4 * this.random() : 0.9 - 0.4 * this.random())
    });
    output += this.flatDecoration(xoff, yoff, {
      xmin: -wid * 0.42,
      xmax: wid * 0.42,
      ymin: -hei * 0.2,
      ymax: 12
    });

    return `${output}</g>`;
  }

  flatDecoration(xoff: number, yoff: number, bounds: { xmin: number; xmax: number; ymin: number; ymax: number }) {
    let output = "";
    for (let j = 0; j < Math.floor(this.random() * 4); j += 1) {
      output += this.rock(xoff + this.normRand(bounds.xmin, bounds.xmax), yoff + (bounds.ymin + bounds.ymax) / 2 + this.normRand(-10, 10) + 10, this.random() * 100, {
        wid: 10 + this.random() * 20,
        hei: 10 + this.random() * 20,
        sha: 2
      });
    }
    for (let i = 0; i < this.choice([0, 1, 2]); i += 1) {
      const xr = xoff + this.normRand(bounds.xmin, bounds.xmax);
      const yr = yoff + (bounds.ymin + bounds.ymax) / 2 + this.normRand(-5, 5) + 20;
      output += this.tree03(xr, yr, { hei: 48 + this.random() * 48, wid: 4 + this.random() * 3 });
      output += this.tree02(xr + this.normRand(-24, 24), yr + this.normRand(-5, 5), { clu: 3 });
    }

    return output;
  }

  distMount(xoff: number, yoff: number, seed: number, options: DistantMountainOptions = {}) {
    const hei = options.hei ?? 300;
    const len = options.len ?? 2000;
    const seg = options.seg ?? 5;
    const span = 10;
    const ptlist: PointGrid = [];

    for (let i = 0; i < len / span / seg; i += 1) {
      ptlist.push([]);
      for (let j = 0; j < seg + 1; j += 1) {
        const k = i * seg + j;
        const wave = Math.max(Math.sin((Math.PI * k) / (len / span)), 0);
        ptlist[ptlist.length - 1].push([
          xoff + k * span,
          yoff - hei * this.noise.noise(k * 0.05, seed) * Math.sqrt(wave)
        ]);
      }
      for (let j = 0; j < seg / 2 + 1; j += 1) {
        const k = i * seg + j * 2;
        const wave = Math.max(Math.sin((Math.PI * k) / (len / span)), 0);
        ptlist[ptlist.length - 1].unshift([
          xoff + k * span,
          yoff + 24 * this.noise.noise(k * 0.05, 2, seed) * wave
        ]);
      }
    }

    let output = `<g data-shan-shui-mountain="distmount">`;
    for (const segment of ptlist) {
      const m = midPoint(segment);
      const c = Math.floor(this.noise.noise(m[0] * 0.02, m[1] * 0.02, yoff) * 55 + 200);
      output += poly(segment, { fil: `rgb(${c},${c},${c})`, str: "none", wid: 1, part: "distant-mountain" });
      output += this.stroke(segment, { col: gray(0.08, 100), wid: 1, part: "distant-mountain" });
    }

    return `${output}</g>`;
  }

  rock(xoff: number, yoff: number, seed: number, options: RockOptions = {}) {
    const hei = options.hei ?? 80;
    const wid = options.wid ?? 100;
    const tex = options.tex ?? 40;
    const sha = options.sha ?? 10;
    const resolution: [number, number] = [10, 50];
    const ptlist: PointGrid = [];

    for (let i = 0; i < resolution[0]; i += 1) {
      ptlist.push([]);
      const nslist = Array.from({ length: resolution[1] }, (_, j) => this.noise.noise(i, j * 0.2, seed));
      this.loopNoise(nslist);
      for (let j = 0; j < resolution[1]; j += 1) {
        const angle = (j / resolution[1]) * Math.PI * 2 - Math.PI / 2;
        let length = (wid * hei) / Math.sqrt((hei * Math.cos(angle)) ** 2 + (wid * Math.sin(angle)) ** 2);
        length *= 0.7 + 0.3 * nslist[j];
        const p = 1 - i / resolution[0];
        const nx = Math.cos(angle) * length * p;
        let ny = -Math.sin(angle) * length * p;
        if (Math.PI < angle || angle < 0) {
          ny *= 0.2;
        }
        ny += hei * (i / resolution[0]) * 0.2;
        ptlist[ptlist.length - 1].push([nx, ny]);
      }
    }

    let output = `<g data-shan-shui-rock="true">`;
    output += poly(ptlist[0].concat([[0, 0]]), { xof: xoff, yof: yoff, fil: "white", str: "none", part: "rock-body" });
    output += this.stroke(
      ptlist[0].map(([x, y]) => [x + xoff, y + yoff]),
      { col: gray(0.3, 100), noi: 1, wid: 3, part: "rock-outline" }
    );
    output += this.texture(ptlist, {
      xof: xoff,
      yof: yoff,
      tex,
      wid: 3,
      sha,
      col: () => gray(0.3 + this.random() * 0.3, 160),
      dis: () => (this.random() > 0.5 ? 0.15 + 0.15 * this.random() : 0.85 - 0.15 * this.random())
    });

    return `${output}</g>`;
  }
}

function buildPlan(ctx: ShanShuiContext, width: number, variant: ShanShuiVariant): PlanEntry[] {
  const config = VARIANT_CONFIG[variant];
  const entries: PlanEntry[] = [];
  const quietEdge = 260;
  const farCount = variant === "home" ? 5 : 5;
  for (let i = 0; i < farCount; i += 1) {
    const x = quietEdge + i * (width - quietEdge * 2) / farCount + ctx.normRand(-90, 90);
    entries.push({
      tag: "distmount",
      x,
      y: 305 + config.yShift + ctx.normRand(-26, 42),
      len: ctx.choice([760, 980, 1240]),
      hei: (variant === "home" ? 150 : 138) + ctx.normRand(-18, 28),
      seed: ctx.random() * 100
    });
  }

  const mainMounts = variant === "home" ? 5 : 5;
  for (let i = 0; i < mainMounts; i += 1) {
    const section = (width - quietEdge * 2) / mainMounts;
    const x = quietEdge + section * i + section * 0.5 + ctx.normRand(-130, 130);
    entries.push({
      tag: "mount",
      x,
      y: (variant === "home" ? 640 : 708) + config.yShift * (variant === "home" ? 0.35 : 0.28) + ctx.normRand(-30, 48),
      wid: (variant === "home" ? 520 : 500) + ctx.normRand(-80, 100),
      hei: (variant === "home" ? 245 : 208) + ctx.normRand(-44, 54),
      tex: Math.floor((variant === "home" ? 150 : 112) * config.detail),
      seed: ctx.random() * 100
    });
  }

  for (let i = 0; i < (variant === "home" ? 4 : 4); i += 1) {
    entries.push({
      tag: "flatmount",
      x: quietEdge + ctx.random() * (width - quietEdge * 2),
      y: (variant === "home" ? 748 : 780) + ctx.normRand(-16, 28),
      wid: (variant === "home" ? 680 : 610) + ctx.normRand(-80, 120),
      hei: (variant === "home" ? 110 : 92) + ctx.normRand(-12, 24),
      seed: ctx.random() * 100
    });
  }

  for (let i = 0; i < (variant === "home" ? 12 : 12); i += 1) {
    const edgeBias =
      variant === "workspace" && i % 2 === 0
        ? ctx.choice([ctx.normRand(72, 900), ctx.normRand(width - 900, width - 72)])
        : i % 3 === 0
          ? ctx.choice([ctx.normRand(80, 820), ctx.normRand(width - 820, width - 80)])
          : ctx.normRand(quietEdge, width - quietEdge);
    entries.push({
      tag: "rock",
      x: edgeBias,
      y: (variant === "home" ? 825 : 838) + ctx.normRand(-18, 16),
      wid: (variant === "home" ? 90 : 82) + ctx.normRand(-28, 36),
      hei: (variant === "home" ? 54 : 48) + ctx.normRand(-12, 16),
      seed: ctx.random() * 100
    });
  }

  for (let i = 0; i < (variant === "home" ? 12 : 10); i += 1) {
    entries.push({
      tag: "grove",
      x:
        variant === "workspace"
          ? ctx.choice([ctx.normRand(120, 1080), ctx.normRand(width - 1080, width - 120), ctx.normRand(quietEdge, width - quietEdge)])
          : ctx.choice([ctx.normRand(140, 980), ctx.normRand(width - 980, width - 140), ctx.normRand(quietEdge, width - quietEdge)]),
      y: (variant === "home" ? 790 : 812) + ctx.normRand(-42, 28),
      count: variant === "home" ? ctx.choice([2, 3, 4]) : ctx.choice([2, 3]),
      seed: ctx.random() * 100
    });
  }

  return entries.sort((a, b) => a.y - b.y);
}

function renderPlan(ctx: ShanShuiContext, plan: PlanEntry[], variant: ShanShuiVariant) {
  let far = "";
  let mid = "";
  let foreground = "";
  let trees = "";
  const config = VARIANT_CONFIG[variant];
  for (const entry of plan) {
    if (entry.tag === "distmount") {
      far += ctx.distMount(entry.x, entry.y, entry.seed, { hei: entry.hei, len: entry.len, seg: 5 });
    } else if (entry.tag === "mount") {
      mid += ctx.mountain(entry.x, entry.y, entry.seed, {
        wid: entry.wid,
        hei: entry.hei,
        tex: entry.tex,
        veg: true,
        col: () => gray((variant === "home" ? 0.08 : 0.045) + ctx.random() * 0.18 * config.opacityScale, 100)
      });
    } else if (entry.tag === "flatmount") {
      mid += ctx.flatMount(entry.x, entry.y, entry.seed, {
        wid: entry.wid,
        hei: entry.hei,
        tex: Math.floor((variant === "home" ? 72 : 58) * config.detail),
        cho: variant === "home" ? 0.52 : 0.45
      });
    } else if (entry.tag === "rock") {
      foreground += ctx.rock(entry.x, entry.y, entry.seed, {
        wid: entry.wid,
        hei: entry.hei,
        tex: Math.floor((variant === "home" ? 30 : 24) * config.detail),
        sha: variant === "home" ? 5 : 4
      });
    } else if (entry.tag === "grove") {
      for (let i = 0; i < entry.count; i += 1) {
        const x = entry.x + ctx.normRand(-42, 42);
        const y = entry.y + ctx.normRand(-8, 12);
        trees += ctx.choice([
          () => ctx.tree01(x, y, { hei: 52 + ctx.random() * 54, wid: 2 + ctx.random() * 3, col: gray(0.34 + ctx.random() * 0.2, 100) }),
          () => ctx.tree02(x, y, { hei: 18 + ctx.random() * 14, wid: 8 + ctx.random() * 5, clu: 3 + Math.floor(ctx.random() * 3), col: gray(0.34 + ctx.random() * 0.2, 100) }),
          () => ctx.tree03(x, y, { hei: 58 + ctx.random() * 70, wid: 4 + ctx.random() * 4, col: gray(0.32 + ctx.random() * 0.2, 100) })
        ])();
      }
    }
  }

  return { far, mid, foreground, trees };
}

export function generateShanShuiStrip({
  variant,
  seed = DEFAULT_SEEDS[variant]
}: {
  variant: ShanShuiVariant;
  seed?: string;
}): ShanShuiStrip {
  const cacheKey = `${variant}:${seed}`;
  const cached = stripCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const config = VARIANT_CONFIG[variant];
  const ctx = new ShanShuiContext(`${seed}:${variant}`);
  const plan = buildPlan(ctx, config.width, variant);
  const layers = renderPlan(ctx, plan, variant);
  const opacity = variant === "home" ? 1 : 0.82;
  const svg = [
    `<g data-shan-shui-adapted="true" data-shan-shui-source="shan-shui-inf" data-shan-shui-variant="${variant}" opacity="${opacity}">`,
    `<g data-shan-shui-layer="far-mountains">${layers.far}</g>`,
    `<g data-shan-shui-layer="mid-mountains">${layers.mid}</g>`,
    `<g data-shan-shui-layer="foreground-rocks">${layers.foreground}</g>`,
    `<g data-shan-shui-layer="tree-clusters">${layers.trees}</g>`,
    `<g data-shan-shui-layer="mist"></g>`,
    `</g>`
  ].join("");

  const strip = {
    svg,
    width: config.width,
    height: config.height,
    seed,
    variant
  };

  stripCache.set(cacheKey, strip);

  return strip;
}
