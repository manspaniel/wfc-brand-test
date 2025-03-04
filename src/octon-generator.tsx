import { mat3, vec2 } from "gl-matrix";

type Path2D = vec2[];

export type ColorName =
  | "SunrisePink"
  | "GrassGreen"
  | "SunlightYellow"
  | "Glass"
  | "SunsetOrange"
  | "PacificBlue"
  | "SkyBlue";

export const BRAND_COLORS = {
  SunrisePink: "#F33F6F",
  GrassGreen: "#25A333",
  SunlightYellow: "#F2CD26",
  SunsetOrange: "#F97101",
  PacificBlue: "#0778CF",
  SkyBlue: "#00BAE5",
  Glass: "#F3F4F1",
} satisfies Record<ColorName, string>;

export const OCTON_COLORS = [
  "SunrisePink",
  "GrassGreen",
  "SunlightYellow",
  "SunsetOrange",
  "PacificBlue",
  "SkyBlue",
] as ColorName[];

export type OctonItem = {
  opacity: number;
  color?: ColorName;
  left?: ColorName;
  top?: ColorName;
};

export type OctonModel = {
  background: ColorName;
  cols: number;
  rows: number;
  octons: OctonItem[][];
};

export type OctonRenderParams = {
  includeBackground: boolean;
  width: number;
  padding: number;
};

export const DEFAULT_OCTON_SHAPE_PARAMS = {
  notchLength: 0.33,
  notchWidth: 0.17,
};

export type OctonShapeParams = {
  notchLength: number;
  notchWidth: number;
};

export type LayoutParams = {
  cols: number;
  rows: number;
  width: number;
  padding: number;
  shapeParams?: OctonShapeParams;
};

/**
 * Calculates the artwork size, octon size and 'step' needed to lay out the octons.
 * Needs the cols/rows, target artwork width and optional shape parameters
 **/
export function calculateLayout(params: LayoutParams) {
  const { cols, rows, width, padding } = params;
  const shapeParams = params.shapeParams ?? DEFAULT_OCTON_SHAPE_PARAMS;
  const innerWidth = width - padding * 2;
  const overlap = calculateOctonOverlapRatio(shapeParams.notchWidth);
  const octonWidth =
    innerWidth / (overlap * (cols + 1) + (1 - overlap * 2) * cols);
  const step = octonWidth * (1 - overlap);
  const height = step * rows - step + octonWidth + padding * 2;

  return {
    cols,
    rows,
    width: width,
    height,
    octonWidth,
    overlap,
    overlapSize: octonWidth * overlap,
    step,
    padding,
  };
}

/**
 * Calculates the ratio of 1 full overlap width / 1 full octon width.
 * The ratio of the notch width to the side length of the octon is used to compute this
 */
export function calculateOctonOverlapRatio(notchLengthRatio: number): number {
  const sideLength = 1 * Math.tan(Math.PI / 8);
  const notchWidth = sideLength * notchLengthRatio;

  const overlapSize =
    (sideLength / 2 - notchWidth / 2) * Math.sin(Math.PI * 0.25) * 2;

  return overlapSize;
}

/**
 * Creates the octon shape path, as well as the overlap paths
 */
export function createOctonPaths(
  width: number,
  params = DEFAULT_OCTON_SHAPE_PARAMS
) {
  const main: Path2D = [];

  const sideLength = width * Math.tan(Math.PI / 8);
  const notchLength = sideLength * params.notchLength; // * Math.max(params.notchLength, overlapRatio + 0.02);
  const notchWidth = sideLength * params.notchWidth;
  const startX = sideLength * Math.sin(Math.PI * 0.25);
  const overlapSize = calculateOctonOverlapRatio(params.notchWidth) * width;

  let pos = vec2.create();
  let mat = mat3.create();
  for (let side = 0; side < 8; side++) {
    const points: vec2[] = [
      [sideLength / 2 - notchWidth / 2, 0],
      [0, notchLength],
      [notchWidth, 0],
      [0, -notchLength],
      [sideLength / 2 - notchWidth / 2, 0],
    ];

    for (let p of points) {
      vec2.add(pos, pos, vec2.transformMat3(vec2.create(), p, mat));
      main.push([pos[0] + startX, pos[1]]);
    }

    mat3.rotate(mat, mat, Math.PI / 4);
  }

  const overlapSegment: Path2D = [
    [width / 2 - sideLength / 2, 0],
    [width / 2 - notchWidth / 2, 0],
    [width / 2 - notchWidth / 2, overlapSize],
    [width / 2 - sideLength / 2, overlapSize],
    [
      width / 2 -
        sideLength / 2 -
        Math.sin(Math.PI / 4) * (sideLength / 2 - notchWidth / 2),
      overlapSize / 2,
    ],
  ];
  const topOverlap: Path2D[] = [
    overlapSegment,
    overlapSegment.map((v) => [(v[0] - width / 2) * -1 + width / 2, v[1]]),
  ];
  const leftOverlap = topOverlap.map((path): Path2D => {
    return path.map((pos) => [pos[1], pos[0]]);
  });

  return {
    main: main,
    topOverlap: topOverlap,
    leftOverlap: leftOverlap,
  };
}

type Color = [number, number, number];

function parseHex(hex: string): Color {
  const hexNum = parseInt(hex.substring(1), 16);
  return [
    ((hexNum >> 16) & 255) / 255,
    ((hexNum >> 8) & 255) / 255,
    (hexNum & 255) / 255,
  ];
}

function encodeHex(color: Color): string {
  return `#${color
    .map((c) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

function multiplyColors(c1: Color, c2: Color, factor: number): Color {
  return c1.map((_, i) => {
    const a = c1[i];
    const b = c2[i];
    return lerp(a, a * b, factor);
  }) as Color;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const cache = new Map<string, string>();

export function calculateColor(bg: ColorName, fg: ColorName, fg2?: ColorName) {
  let key = `${bg}-${fg}-${fg2}`;
  if (cache.has(key)) return cache.get(key)!;
  let result = parseHex(BRAND_COLORS[fg]);
  let factor = 1;
  if (bg !== "Glass") {
    factor = 0.25;
  }
  if (fg2) {
    result = multiplyColors(result, parseHex(BRAND_COLORS[fg2]), factor);
  }
  result = multiplyColors(result, parseHex(BRAND_COLORS[bg]), factor);
  const value = encodeHex(result);
  cache.set(key, value);
  return value;
}

export function pathToSVG(path: Path2D): string {
  return (
    path
      .map(([x, y], i) => {
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join("") + "Z"
  );
}
