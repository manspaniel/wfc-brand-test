import { vec2 } from "gl-matrix";
import { parseSVG, makeAbsolute } from "svg-path-parser";
import { SquareGridTopology } from "./lib/wfc/topologies/square-topology";
import { WFC } from "./lib/wfc/wfc";

const SIZE = 64;

export class RuleSet {}

type Edge = number[];
type RuleExtra = {
  svg: string[];
  offset: vec2;
};

export class LayoutGenerator {
  rows = 32;
  cols = 32;
  airgap = 0;
  grid!: SquareGridTopology<Edge, RuleExtra>;

  constructor() {}

  init() {
    console.log("Start", this.airgap);
    this.grid = new SquareGridTopology<Edge, RuleExtra>({
      width: this.rows,
      height: this.cols,
      edgeTest(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          const a1 = a[i];
          const b1 = b[i];
          if (a1 !== 64 - b1) return false;
        }
        return true;
      },
      rules: [],
    });
  }

  generate() {
    const wfc = new WFC({
      topology: this.grid,
    });

    // function run() {
    //   let total = 0;
    //   while (!wfc.next()) {
    //     if (total++ > 10000) {
    //       console.error("Too many iterations");
    //       return;
    //     }
    //   }
    //   console.log(total);
    // }
    wfc.initClean();

    if (this.airgap > 0) {
      const cx = this.rows / 2 - 0.5;
      const cy = this.cols / 2 - 0.5;
      const rad = Math.sqrt(cx * cx + cy * cy) * (1 - this.airgap);
      console.log(this.grid.cells);
      this.grid.cells.forEach((cell) => {
        const distFromCenter = Math.sqrt(
          (cell.coord.x - cx) * (cell.coord.x - cx) +
            (cell.coord.y - cy) * (cell.coord.y - cy)
        );
        console.log(distFromCenter, rad);
        if (distFromCenter > rad) {
          cell.candidates = [cell.candidates[0]];
          cell.value = cell.candidates[0];
        }
      });
    }

    return () => {
      return wfc.next();
    };
  }

  setRules(rules: ParsedRule[]) {
    this.grid.rules = [
      ...this.grid.expandProtoRules([
        {
          name: "empty",
          edges: [[], [], [], []],
          rotations: [0, 1, 2, 3],
          svg: [],
          weight: 0.001,
          offset: [0, 0],
        },
      ]),
      ...this.grid.expandProtoRules(
        rules.map((rule, i) => {
          return {
            name: rule.coord.join(","),
            edges: rule.edges.map((e) => e.sort()),
            rotations: [0, 1, 2, 3],
            svg: rule.shapes,
            weight: Math.random(),
            offset: rule.coord,
          };
        })
      ),
    ];
  }
}

type ParsedRule = {
  coord: vec2;
  shapes: string[];
  edges: number[][];
  points: vec2[];
};

export function parseRules(code = DEFAULT_SVG) {
  const svg = document.createElement("div");
  svg.innerHTML = code;
  for (let def of svg.getElementsByTagName("defs")) {
    def.remove();
  }
  const els = svg.querySelectorAll("path,circle,ellipse,rect");

  const tiles = new Map<string, ParsedRule>();
  for (let el of els) {
    const result = getSvgBounds(el as SVGElement);
    if (!result) continue;
    const { bounds, points } = result;
    if (!bounds || bounds.width > 128 || bounds.height > 128) {
      console.log("Hmmm", el, bounds);
      continue;
    }
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;

    const x = Math.floor(cx / SIZE);
    const y = Math.floor(cy / SIZE);
    const id = `${x},${y}`;

    if (!tiles.has(id)) {
      tiles.set(id, { shapes: [], edges: [], coord: [x, y], points: [] });
    }

    const rule = tiles.get(id)!;
    rule.shapes.push(el.outerHTML);
    rule.points.push(
      ...points.map((p) => vec2.fromValues(p[0] - x * 64, p[1] - y * 64))
    );
  }

  for (const tile of tiles.values()) {
    tile.edges = [[], [], [], []];
    for (let p of tile.points) {
      if (p[1] === 0) {
        // Top
        tile.edges[0].push(p[0]);
      }
      if (p[0] === 64) {
        // Right
        tile.edges[1].push(p[1]);
      }
      if (p[1] === 64) {
        // Bottom
        tile.edges[2].push(64 - p[0]);
      }
      if (p[0] === 0) {
        // Left
        tile.edges[3].push(64 - p[1]);
      }
    }
  }

  console.log(tiles);

  return [...tiles.values()];
}

type Rect = { x: number; y: number; width: number; height: number };

function getSvgBounds(
  el: SVGElement
): { bounds: Rect; points: vec2[] } | undefined {
  if (el instanceof SVGPathElement) {
    const path = el.getAttribute("d")!;
    const parsed = makeAbsolute(parseSVG(path));
    const points: vec2[] = [];
    const min = { x: Infinity, y: Infinity };
    const max = { x: -Infinity, y: -Infinity };
    const extend = (x: number, y: number) => {
      min.x = Math.min(min.x, x);
      min.y = Math.min(min.y, y);
      max.x = Math.max(max.x, x);
      max.y = Math.max(max.y, y);
    };
    for (let cmd of parsed) {
      if (cmd.x || cmd.y) {
        extend(cmd.x, cmd.y);
      } else if (cmd.x0 && cmd.y0) {
        extend(cmd.x0, cmd.y0);
      }
    }
    const first = parsed.at(0)!;
    const last = parsed.at(-1)!;
    if (first.x0 || first.y0) {
      points.push(vec2.fromValues(first.x0!, first.y0!));
    } else if (first.x || first.y) {
      points.push(vec2.fromValues(first.x!, first.y!));
    }
    if (last.x || last.y) {
      points.push(vec2.fromValues(last.x!, last.y!));
    }

    return {
      bounds: {
        x: min.x,
        y: min.y,
        width: max.x - min.x,
        height: max.y - min.y,
      },
      points: points,
    };
  }
  if (el instanceof SVGRectElement) {
    const x = parseFloat(el.getAttribute("x")!);
    const y = parseFloat(el.getAttribute("y")!);
    const width = parseFloat(el.getAttribute("width")!);
    const height = parseFloat(el.getAttribute("height")!);
    return { bounds: { x, y, width, height }, points: [] };
  }
  if (el instanceof SVGCircleElement) {
    const cx = parseFloat(el.getAttribute("cx")!);
    const cy = parseFloat(el.getAttribute("cy")!);
    const r = parseFloat(el.getAttribute("r")!);
    return {
      bounds: { x: cx - r, y: cy - r, width: r * 2, height: r * 2 },
      points: [],
    };
  }
  if (el instanceof SVGEllipseElement) {
    const cx = parseFloat(el.getAttribute("cx")!);
    const cy = parseFloat(el.getAttribute("cy")!);
    const rx = parseFloat(el.getAttribute("rx")!);
    const ry = parseFloat(el.getAttribute("ry")!);
    return {
      bounds: { x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2 },
      points: [],
    };
  }
}

export const DEFAULT_SVG = `
<svg width="1052" height="512" viewBox="0 0 1052 512" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Frame 2" clip-path="url(#clip0_3_9)">
<path id="Vector 1" d="M8 384V392H56V404H8V428H56V440H8V448" stroke="black" stroke-width="3"/>
<path id="Vector 32" d="M56 512L56 504L8 504L8 492L56 492L56 468L8 468L8 456L56 456L56 448" stroke="black" stroke-width="3"/>
<path id="Vector 2" d="M8 64V128" stroke="black" stroke-width="3"/>
<path id="Vector 3" d="M8 128L32 192" stroke="black" stroke-width="3"/>
<path id="Vector 33" d="M128 128L192 192" stroke="black" stroke-width="3"/>
<path id="Vector 36" d="M192 136H192.515C194.106 136 195.632 136.632 196.757 137.757L221.5 162.5L246.243 187.243C247.368 188.368 248 189.894 248 191.485V192" stroke="black" stroke-width="3"/>
<path id="Vector 37" d="M256 184L255.485 184C253.894 184 252.368 183.368 251.243 182.243L201.757 132.757C200.632 131.632 200 130.106 200 128.515L200 128" stroke="black" stroke-width="3"/>
<path id="Vector 9" d="M8 192V200H56V256" stroke="black" stroke-width="3"/>
<path id="Vector 14" d="M136 192V200H160V256" stroke="black" stroke-width="3"/>
<path id="Vector 34" d="M200 192V200L224 224V256" stroke="black" stroke-width="3"/>
<path id="Vector 35" d="M248 192V200L224 224" stroke="black" stroke-width="3"/>
<path id="Vector 26" d="M8 320V328H32V384" stroke="black" stroke-width="3"/>
<path id="Vector 28" d="M120 320V328H96V384" stroke="black" stroke-width="3"/>
<path id="Vector 30" d="M160 384V320" stroke="black" stroke-width="3"/>
<path id="Vector 27" d="M0 376L8 376L8 352L64 352" stroke="black" stroke-width="3"/>
<path id="Vector 29" d="M64 376L72 376L72 352L88 352L88 348C88 345.791 89.7909 344 92 344L100 344C102.209 344 104 345.791 104 348L104 352L128 352" stroke="black" stroke-width="3"/>
<path id="Vector 31" d="M192 352L128 352" stroke="black" stroke-width="3"/>
<path id="Vector 15" d="M184 256V264H160V320" stroke="black" stroke-width="3"/>
<path id="Vector 4" d="M64 8H128" stroke="black" stroke-width="3"/>
<path id="Vector 6" d="M128 8H192" stroke="black" stroke-width="3"/>
<path id="Vector 20" d="M128 32H192" stroke="black" stroke-width="3"/>
<path id="Vector 21" d="M128 72H192" stroke="black" stroke-width="3"/>
<path id="Vector 22" d="M128 96H192" stroke="black" stroke-width="3"/>
<path id="Vector 13" d="M448 32H512" stroke="black" stroke-width="3"/>
<path id="Vector 7" d="M192 56H256" stroke="black" stroke-width="3"/>
<path id="Vector 8" d="M320 56H264V64" stroke="black" stroke-width="3"/>
<path id="Vector 11" d="M256 120H304C308.418 120 312 123.582 312 128V128" stroke="black" stroke-width="3"/>
<path id="Vector 5" d="M64 56H128" stroke="black" stroke-width="3"/>
<path id="Ellipse 1" d="M384 58C370.193 58 359 46.8071 359 33C359 19.1929 370.193 8 384 8" stroke="black" stroke-width="3"/>
<path id="Ellipse 3" d="M376 128V122C362.193 122 351 110.807 351 97C351 83.1929 362.193 72 376 72V64" stroke="black" stroke-width="3"/>
<path id="Ellipse 2" d="M392 64C392 33.0721 417.072 8 448 8" stroke="black" stroke-width="3"/>
<path id="Ellipse 6" d="M392 128C392 97.0721 417.072 72 448 72" stroke="black" stroke-width="3"/>
<path id="Ellipse 7" d="M416 128C416 110.327 430.327 96 448 96" stroke="black" stroke-width="3"/>
<path id="Ellipse 5" d="M608 0C608 18.2254 594.225 32 576 32" stroke="black" stroke-width="3"/>
<path id="Arrow 1" d="M97.0607 84.9393C96.4749 84.3536 95.5252 84.3536 94.9394 84.9393L85.3934 94.4853C84.8076 95.071 84.8076 96.0208 85.3934 96.6066C85.9792 97.1924 86.929 97.1924 87.5147 96.6066L96 88.1213L104.485 96.6066C105.071 97.1924 106.021 97.1924 106.607 96.6066C107.192 96.0208 107.192 95.0711 106.607 94.4853L97.0607 84.9393ZM97.5 106.5L97.5 86L94.5 86L94.5 106.5L97.5 106.5Z" fill="black"/>
<path id="Arrow 2" d="M96 128L96 103.5" stroke="black" stroke-width="3"/>
<path id="Arrow 3" d="M94.2457 159C94.2457 158.172 93.5741 157.5 92.7457 157.5L79.2457 157.5C78.4173 157.5 77.7457 158.172 77.7457 159C77.7457 159.828 78.4173 160.5 79.2457 160.5L91.2457 160.5L91.2457 172.5C91.2457 173.328 91.9173 174 92.7457 174C93.5741 174 94.2457 173.328 94.2457 172.5L94.2457 159ZM79.3107 174.556L93.8064 160.061L91.6851 157.939L77.1893 172.435L79.3107 174.556Z" fill="black"/>
<path id="Arrow 4" d="M72 192L72 179.75L80.5 171.25" stroke="black" stroke-width="3"/>
<path id="Vector 10" d="M56 256V264H64" stroke="black" stroke-width="3"/>
<path id="Vector 12" d="M120 256V256C120 260.418 123.582 264 128 264V264" stroke="black" stroke-width="3"/>
<path id="Vector 24" d="M248 256V280C248 284.418 251.582 288 256 288V288" stroke="black" stroke-width="3"/>
<path id="Vector 25" d="M288 256V256C288 260.418 291.582 264 296 264H320" stroke="black" stroke-width="3"/>
<circle id="Ellipse 4" cx="353" cy="224" r="20.5" stroke="black" stroke-width="3"/>
<path id="Vector 16" d="M332 224H320" stroke="black" stroke-width="3"/>
<path id="Vector 18" d="M396 224H384" stroke="black" stroke-width="3"/>
<path id="Vector 17" d="M384 224H373.5" stroke="black" stroke-width="3"/>
<path id="Vector 19" d="M448 224H437.5" stroke="black" stroke-width="3"/>
<rect id="Rectangle 1" x="416" y="203.121" width="29.527" height="29.527" transform="rotate(45 416 203.121)" stroke="black" stroke-width="3"/>
<path id="Vector 38" d="M376 256V257.5C376 257.5 376.146 259.129 376.204 260C376.461 263.843 375.752 267.002 374.479 270.577C372.941 274.896 371.156 279.276 368.432 282.996C366.39 285.785 364.246 288.386 360.859 289.432C359.118 289.969 356.626 290.28 355.062 289.163C353.791 288.255 352.654 286.6 352.416 285.022C352.312 284.332 352.226 283.346 352.742 282.829C353.543 282.028 354.855 281.317 356.014 281.232C358.609 281.039 360.962 281.655 362.399 283.986C364.254 286.997 364.223 291.058 363.089 294.334C361.674 298.422 357.432 300.507 353.502 301.613C350.591 302.433 347.459 303.328 344.414 303.422C342.909 303.468 341.593 303.134 340.26 302.444C338.923 301.753 338.461 300.112 339.275 298.801C340.444 296.919 342.675 296.441 344.74 296.238C346.567 296.059 347.623 297.116 348.619 298.482C350.039 300.427 350.952 302.754 351.521 305.084C352.025 307.145 352.045 309.126 352.045 311.226C352.045 313.148 352.045 315 352.045 317L352 320" stroke="black" stroke-width="3" stroke-linecap="round"/>
<path id="Vector 39" d="M480 256V261.969C480 263.196 480.747 264.299 481.886 264.754L483.036 265.215C485.551 266.22 485.551 269.78 483.036 270.785L480 272L476.964 273.215C474.449 274.22 474.449 277.78 476.964 278.785L480 280L483.036 281.215C485.551 282.22 485.551 285.78 483.036 286.785L480 288L476.964 289.215C474.449 290.22 474.449 293.78 476.964 294.785L480 296L483.036 297.215C485.551 298.22 485.551 301.78 483.036 302.785L480 304L476.964 305.215C474.449 306.22 474.449 309.78 476.964 310.785L478.114 311.246C479.253 311.701 480 312.804 480 314.031V320" stroke="black" stroke-width="3"/>
</g>
<defs>
<clipPath id="clip0_3_9">
<rect width="1052" height="512" fill="white"/>
</clipPath>
</defs>
</svg>
`;
