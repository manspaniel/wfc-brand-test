import { createNoise2D, createNoise3D } from "simplex-noise";
// import { segment, point, Polygon } from "@flatten-js/core";
// import offset from "@flatten-js/polygon-offset";
// import lineOffset from "line2offset";

console.clear();

const cellSize = 2;
const width = 20;
const height = 20;

type ExpandedRule = {
  symbol: string;
  rotation: number;
  top: Symbol;
  left: Symbol;
  right: Symbol;
  bottom: Symbol;
  draw: (ctx: CanvasRenderingContext2D) => void;
};

type Rule = {
  rotations: number[];
  left: Symbol;
  right: Symbol;
  top: Symbol;
  bottom: Symbol;
  symbol: string;
  draw: (ctx: CanvasRenderingContext2D) => void;
};

export const Black = Symbol("red");
export const Blue = Symbol("blue");
export const Air = Symbol("air");

const Done = Symbol("Done");
const Contradiction = Symbol("Contradiction");

const ruleSet: Rule[] = [
  // {
  //   symbol: "╋",
  //   rotations: [0, 1],
  //   top: Black,
  //   right: Blue,
  //   bottom: Black,
  //   left: Blue,
  //   draw: (ctx) => {
  //     ctx.beginPath();
  //     ctx.moveTo(0, -cellSize / 2);
  //     ctx.lineTo(0, cellSize / 2);
  //     ctx.strokeStyle = "#0000ff";
  //     ctx.stroke();
  //     ctx.beginPath();
  //     ctx.moveTo(-cellSize / 2, 0);
  //     ctx.lineTo(cellSize / 2, 0);
  //     ctx.strokeStyle = "#000000";
  //     ctx.stroke();
  //   }
  // },
  {
    symbol: "╋",
    rotations: [0, 1],
    top: Blue,
    right: Black,
    bottom: Blue,
    left: Black,
    draw: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(0, -cellSize / 2);
      ctx.lineTo(0, cellSize / 2);
      ctx.strokeStyle = "#000000";
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-cellSize / 2, 0);
      ctx.lineTo(cellSize / 2, 0);
      ctx.strokeStyle = "#0000ff";
      ctx.stroke();
    },
  },
  // {
  //   symbol: "╋",
  //   rotations: [0, 1],
  //   top: Blue,
  //   right: Blue,
  //   bottom: Blue,
  //   left: Blue,
  //   draw: (ctx) => {
  //     ctx.beginPath();
  //     ctx.moveTo(0, -cellSize / 2);
  //     ctx.lineTo(0, cellSize / 2);
  //     ctx.strokeStyle = "#000000";
  //     ctx.stroke();
  //     ctx.beginPath();
  //     ctx.moveTo(-cellSize / 2, 0);
  //     ctx.lineTo(cellSize / 2, 0);
  //     ctx.strokeStyle = "#000000";
  //     ctx.stroke();
  //   }
  // },
  // {
  //   symbol: "╋",
  //   rotations: [0, 1],
  //   top: Black,
  //   right: Black,
  //   bottom: Black,
  //   left: Black,
  //   draw: (ctx) => {
  //     ctx.beginPath();
  //     ctx.moveTo(0, -cellSize / 2);
  //     ctx.lineTo(0, cellSize / 2);
  //     ctx.strokeStyle = "#0000ff";
  //     ctx.stroke();
  //     ctx.beginPath();
  //     ctx.moveTo(-cellSize / 2, 0);
  //     ctx.lineTo(cellSize / 2, 0);
  //     ctx.strokeStyle = "#0000ff";
  //     ctx.stroke();
  //   }
  // },
  {
    symbol: "┋",
    rotations: [0, 1],
    top: Black,
    right: Air,
    bottom: Black,
    left: Air,
    draw: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(0, -cellSize / 2);
      ctx.lineTo(0, cellSize / 2);
      ctx.strokeStyle = "#0000ff";
      ctx.stroke();
    },
  },
  {
    symbol: "┋",
    rotations: [0, 1],
    top: Blue,
    right: Air,
    bottom: Blue,
    left: Air,
    draw: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(0, -cellSize / 2);
      ctx.lineTo(0, cellSize / 2);
      ctx.strokeStyle = "#000000";
      ctx.stroke();
    },
  },
  {
    symbol: "┏",
    rotations: [0, 1, 2, 3],
    top: Air,
    right: Black,
    bottom: Black,
    left: Air,
    draw: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(cellSize / 2, 0);
      // ctx.lineTo(0, 0);
      ctx.quadraticCurveTo(0, 0, 0, cellSize / 2);
      ctx.strokeStyle = "#0000ff";
      ctx.stroke();
    },
  },
  {
    symbol: "┏",
    rotations: [0, 1, 2, 3],
    top: Air,
    right: Blue,
    bottom: Blue,
    left: Air,
    draw: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(cellSize / 2, 0);
      // ctx.lineTo(0, 0);
      ctx.quadraticCurveTo(0, 0, 0, cellSize / 2);
      ctx.strokeStyle = "#000000";
      ctx.stroke();
    },
  },
  {
    symbol: " ",
    rotations: [0],
    top: Air,
    right: Air,
    bottom: Air,
    left: Air,
    draw(ctx) {
      // ctx.beginPath();
      // ctx.arc(0, 0, cellSize * 0.3, 0, Math.PI * 2);
      // ctx.strokeStyle = "#ff00ff";
      // ctx.stroke();
    },
  },
  // {
  //   symbol: "dot",
  //   rotations: [0, 1, 2, 3],
  //   top: Air,
  //   right: Air,
  //   bottom: Black,
  //   left: Air,
  //   draw(ctx) {
  //     ctx.beginPath();
  //     ctx.arc(0, 0, cellSize * 0.3, 0, Math.PI * 2);
  //     ctx.strokeStyle = "#0000ff";
  //     ctx.stroke();
  //     ctx.beginPath();
  //     ctx.moveTo(0, cellSize * 0.3);
  //     ctx.lineTo(0, cellSize / 2);
  //     ctx.strokeStyle = "#0000ff";
  //     ctx.stroke();
  //   }
  // },
  // {
  //   symbol: "dot",
  //   rotations: [0, 1, 2, 3],
  //   top: Air,
  //   right: Air,
  //   bottom: Blue,
  //   left: Air,
  //   draw(ctx) {
  //     ctx.beginPath();
  //     ctx.arc(0, 0, cellSize * 0.2, 0, Math.PI * 2);
  //     ctx.strokeStyle = "#000000";
  //     ctx.stroke();
  //     ctx.beginPath();
  //     ctx.moveTo(0, cellSize * 0.3);
  //     ctx.lineTo(0, cellSize / 2);
  //     ctx.strokeStyle = "#000000";
  //     ctx.stroke();
  //   }
  // }
];

function expandRules(rules: Rule[]): ExpandedRule[] {
  const output: ExpandedRule[] = [];
  rules.forEach((rule) => {
    const sides = [rule.top, rule.right, rule.bottom, rule.left];
    for (let rotation of rule.rotations) {
      output.push({
        symbol: rule.symbol,
        rotation,
        top: sides[(0 + 4 - rotation) % 4],
        right: sides[(1 + 4 - rotation) % 4],
        bottom: sides[(2 + 4 - rotation) % 4],
        left: sides[(3 + 4 - rotation) % 4],
        draw: rule.draw,
      });
    }
  });
  return output;
}

const rules = expandRules(ruleSet);

console.table(rules);

type EntropyCell = {
  entropy: number;
  value?: ExpandedRule;
  x: number;
  y: number;
  candidates: ExpandedRule[];
};

let grid: EntropyCell[] = [];

function getCell(x: number, y: number) {
  if (x < 0) return null;
  if (y < 0) return null;
  if (x >= width) return null;
  if (y >= height) return null;
  return grid[y * width + x];
}

function neighborSlots(x: number, y: number) {
  const up = getCell(x, y - 1);
  const down = getCell(x, y + 1);
  const left = getCell(x - 1, y);
  const right = getCell(x + 1, y);
  return [
    up?.value?.bottom,
    right?.value?.left,
    down?.value?.top,
    left?.value?.right,
  ];
}

// function hasNeighbors(x: number, y: number) {
//   if (getCell(x, y - 1)?.value) return true;
//   if (getCell(x, y + 1)?.value) return true;
//   if (getCell(x - 1, y)?.value) return true;
//   if (getCell(x + 1, y)?.value) return true;
//   return false;
// }

function getNeighbors(cell: EntropyCell) {
  const x = cell.x;
  const y = cell.y;
  return [
    getCell(x, y - 1),
    getCell(x, y + 1),
    getCell(x - 1, y),
    getCell(x + 1, y),
  ].filter(Boolean) as EntropyCell[];
}

let contradiction = {
  x: -1,
  y: -1,
};

function collapseOne() {
  let sortedCells = grid.filter((c) => !c.value);
  sortedCells.forEach((c) => {
    c.entropy = c.candidates.length;
    if (c.value) {
      c.entropy = 0;
    }
  });
  sortedCells.sort((a, b) => {
    return a.entropy - b.entropy;
  });

  if (sortedCells.length === 0) {
    console.log("Nothing to do");
    return Done;
  }

  let lowestEntropy = sortedCells[0].entropy;

  sortedCells = sortedCells.filter((c) => c.entropy === lowestEntropy);

  const cell = sortedCells[Math.floor(Math.random() * sortedCells.length)];

  if (cell.candidates.length === 0) {
    contradiction.x = cell.x;
    contradiction.y = cell.y;
    console.log("Contradiction");
    return Contradiction;
  }

  cell.value =
    cell.candidates[Math.floor(Math.random() * cell.candidates.length)];

  return cell;
}

function reduceCandidates(cells: EntropyCell[]) {
  // for (let y = 0; y < height; y++) {
  //   for (let x = 0; x < width; x++) {
  // const cell = getCell(x, y)!;
  // if (!hasNeighbors(x, y)) continue;
  cells.forEach((cell) => {
    const slots = neighborSlots(cell.x, cell.y);
    cell.candidates = cell.candidates.filter((rule) => {
      if (slots[0] && slots[0] !== rule.top) return false;
      if (slots[1] && slots[1] !== rule.right) return false;
      if (slots[2] && slots[2] !== rule.bottom) return false;
      if (slots[3] && slots[3] !== rule.left) return false;
      return true;
    });
  });
  //   }
  // }
}

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;

function draw() {
  console.log("Drawing");
  canvas.width = width * cellSize;
  canvas.height = height * cellSize;
  ctx.save();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y * width + x];
      ctx.resetTransform();
      ctx.translate(x * cellSize - cellSize / 2, y * cellSize - cellSize / 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
      ctx.strokeRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize);
      if (x === contradiction.x && y === contradiction.y) {
        // ctx.lineWidth = 3;
        // ctx.strokeStyle = "#000000";
        // ctx.strokeRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize);
      }
      if (cell.value) {
        ctx.globalAlpha = 1;
        ctx.rotate((cell.value?.rotation / 4) * Math.PI * 2);
        ctx.strokeStyle = "black";
        ctx.lineWidth = cellSize * 0.3;
        cell.value.draw(ctx);
        // ctx.fillText(cell.value.symbol, 0, 9);
      } else {
        ctx.globalAlpha = 0.03;
        if (cell.candidates.length > 0) {
          // cell.candidates.forEach((rule) => {
          //   ctx.rotate((rule.rotation / 4) * Math.PI * 2);
          //   ctx.strokeStyle = "rgba(0,0,0,0.2)";
          //   ctx.lineWidth = 10;
          //   rule.draw(ctx);
          // });
        }
        // ctx.fillStyle = "#ddd";
        // ctx.rotate((x / width) * Math.PI * 2);
        // ctx.textAlign = "center";
        // ctx.fillText("A", 0, 9);
      }
    }
  }
  ctx.restore();
}

const backupStack: EntropyCell[][] = [];

function backup() {
  backupStack.push(
    grid.map((cell) => ({
      ...cell,
      candidates: [...cell.candidates],
    }))
  );
}

function restore() {
  grid = backupStack[backupStack.length - 1];
}

export function generateWFC() {
  // Init the grid
  grid = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      grid.push({
        x,
        y,
        entropy: 0,
        value: undefined,
        candidates: [...rules],
      });
    }
  }

  // Airgaps around the side
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const distFromCenter = Math.sqrt(
        (x - width / 2) ** 2 + (y - height / 2) ** 2
      );
      // if (distFromCenter < Math.min(width, height) * 0.4) continue;
      if (x > 0 && y > 0 && x < width - 1 && y < height - 1) continue;
      // if (x > 0 && x < width - 1 && y > 0 && y < height - 1) continue;
      const cell = getCell(x, y)!;
      if (!cell) console.log(x, y);
      cell.value = {
        rotation: 0,
        symbol: "air",
        top: Air,
        bottom: Air,
        left: Air,
        right: Air,
        draw: () => {},
      };
      cell.candidates = [];
    }
  }

  reduceCandidates(grid);
  backup();

  let iteration = 0;
  let contradictions = 0;
  let totalContradictions = 0;
  while (true) {
    iteration++;
    // try {
    const cell = collapseOne();
    draw();
    if (cell === Contradiction) {
      if (contradictions > 5 && backupStack.length > 1) {
        if (totalContradictions > 10) {
          backupStack.pop();
          backupStack.pop();
        } else {
          backupStack.pop();
        }
        contradictions = 0;
      } else {
        contradictions++;
        totalContradictions++;
      }
      restore();
    } else if (cell === Done) {
      contradiction.x = -1;
      contradiction.y = -1;
      draw();
      return canvas;
    } else {
      reduceCandidates(getNeighbors(cell));
    }
    if (cell !== Contradiction && iteration % 10 === 0) {
      backup();
    }
  }
}

type Point = [number, number];

type Shape = {
  points: Point[];
};

function lerpPoints(v: number, a: Point, b: Point, dest: Point = [0, 0]) {
  dest[0] = a[0] + (b[0] - a[0]) * v;
  dest[1] = a[1] + (b[1] - a[1]) * v;
  return dest;
}

function pointDist(a: Point, b: Point) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

function subdividePoints(points: Point[]) {
  const result: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const self = points[i];
    const next = points[(i + 1) % points.length];
    result.push(lerpPoints(0.25, self, next));
    result.push(lerpPoints(0.75, self, next));
  }
  return result;
}

// function relaxPoints(points: Point[]) {
//   return points.map((point, i) => {
//     const p = [...point] as Point

//     return p
//   })
// }

function mag(point: Point) {
  return pointDist(point, [0, 0]);
}

function relaxPoints(points: Point[], strength: number) {
  // let vel: Point = [0, 0]
  let last = [...points[0]];
  return points.map((point, i) => {
    // if (mag(vel) === 0) continue
    const prev = points[i];
    const current = points[(i + 1) % points.length];
    const next = points[(i + 2) % points.length];
    const target = lerpPoints(0.5, prev, next);
    return lerpPoints(strength, current, target);
  });
}

// function relaxPoints(points: Point[]) {
//   const result: Point[] = [];
//   for (let i = 0; i < points.length; i++) {
//     const original = points[i];
//     let point = [...original] as Point;
//     points.forEach((other, f) => {
//       if (other === original || f < i || i > f - 3) return;
//       const dist = pointDist(other, original);
//       lerpPoints(
//         Math.max(0, Math.min(1, 1 - dist / 3)) * 0.01,
//         point,
//         other,
//         point
//       );
//     });
//     result.push(point);
//   }
//   return result;
// }

const noise = createNoise3D();
export function generateShapes(
  color: Symbol,
  fillStyle: string,
  seed: (i: number) => number,
  smoothing: boolean
): Point[][] {
  const seen = new Set<EntropyCell>();

  const shapes: Shape[] = [];

  const followShape = (cell: EntropyCell, shape: Shape): any => {
    seen.add(cell);
    shape.points.push([cell.x, cell.y]);
    const up = getCell(cell.x, cell.y - 1)!;
    if (up && cell?.value?.top === color && !seen.has(up))
      return followShape(up, shape);
    const right = getCell(cell.x + 1, cell.y)!;
    if (right && cell?.value?.right === color && !seen.has(right))
      return followShape(right, shape);
    const down = getCell(cell.x, cell.y + 1)!;
    if (down && cell?.value?.bottom === color && !seen.has(down))
      return followShape(down, shape);
    const left = getCell(cell.x - 1, cell.y)!;
    if (left && cell?.value?.left === color && !seen.has(left))
      return followShape(left, shape);
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = getCell(x, y)!;
      if (seen.has(cell)) continue;
      if (
        cell.value?.top === color ||
        cell.value?.bottom === color ||
        cell.value?.right === color ||
        cell.value?.left === color
      ) {
        const shape: Shape = {
          points: [],
        };
        followShape(cell, shape);
        shapes.push(shape);
      }
    }
  }

  const noiseScale = 0.1;
  const noiseStrength = 0.2;
  shapes.forEach((shape, id) => {
    shape.points.forEach((point) => {
      point[0] += 0.5;
      point[1] += 0.5;
    });
  });
  if (smoothing) {
    shapes.forEach((shape, id) => {
      for (let i = 0; i < 4; i++) {
        shape.points.forEach((point) => {
          point[0] +=
            noise(point[0] * noiseScale, point[1] * noiseScale, seed(id)) *
            noiseStrength;
          point[1] +=
            noise(-point[0] * noiseScale, -point[1] * noiseScale, seed(id)) *
            noiseStrength;
        });
        shape.points = relaxPoints(shape.points, 0.4);
        shape.points = subdividePoints(shape.points);
      }
      shape.points.push([...shape.points[0]]);
    });
  }

  for (const shape of shapes) {
    ctx.beginPath();
    // ctx.moveTo(shape.points[0][0] * cellSize, shape.points[0][1] * cellSize);
    for (let i = 0; i <= shape.points.length; i++) {
      const point = shape.points[i % shape.points.length];
      ctx[i === 0 ? "moveTo" : "lineTo"](
        point[0] * cellSize - cellSize / 2,
        point[1] * cellSize - cellSize / 2
      );
    }
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = fillStyle;
    ctx.globalCompositeOperation = "screen";
    // ctx.fill();
    ctx.strokeStyle = fillStyle;
    ctx.lineWidth = 8;
    ctx.stroke();
  }

  return shapes.map((shape) =>
    shape.points.map((point) => [point[0] / width, point[1] / height])
  );
}

export async function generate() {
  await generateWFC();
  console.log("Done");

  await new Promise((resolve) => setTimeout(resolve, 500));

  ctx.resetTransform();
  // ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width * cellSize, height * cellSize);

  const blue = generateShapes(Blue, "#24BFDB");
  // const blue2 = generateShapes(Blue, "#24BFDB");
  // const blue3 = generateShapes(Blue, "#24BFDB");
  // const blue4 = generateShapes(Blue, "#24BFDB");
  const red = generateShapes(Black, "#DB4024");
  // const red2 = generateShapes(Black, "#DB4024");
  // const red3 = generateShapes(Black, "#DB4024");
  // const red4 = generateShapes(Black, "#DB4024");

  return [...blue, ...red];

  // function makePoint(p: Point) {
  //   const x = (p[0] / width) * 210;
  //   const y = (p[1] / height) * 297;
  //   return `${x} ${y}`;
  // }

  // let layerCounter = 0;
  // function makeShapeLayer(
  //   shapes: Point[][],
  //   stroke: string,
  //   layerName: string
  // ) {
  //   return `
  //     <g inkscape:label="${
  //       layerName + " " + ++layerCounter
  //     }" inkscape:groupmode="layer" id="layer${++layerCounter}">
  //       ${shapes
  //         .map(
  //           (shape) => `
  //         <g>
  //           <path
  //             stroke="${stroke}"
  //             stroke-width="0.6"
  //             fill="none"
  //             d="${shape
  //               .map((p, i) =>
  //                 i === 0 ? "M " + makePoint(p) : "L " + makePoint(p)
  //               )
  //               .join(" ")} Z" />
  //         </g>
  //       `
  //         )
  //         .join("\n")}
  //     </g>
  //   `;
  // }

  // const totalRings = 1;
  // const offsetSize = 0.7;

  // blue.push(
  //   ...blue.flatMap((shape) => {
  //     const out: Point[][] = [];
  //     for (let i = -totalRings; i <= totalRings; i++) {
  //       out.push(offsetPoints(shape, (i + 1) * offsetSize));
  //     }
  //     return out;
  //   })
  // );

  // red.push(
  //   ...red.flatMap((shape) => {
  //     const out: Point[][] = [];
  //     for (let i = -totalRings; i <= totalRings; i++) {
  //       out.push(offsetPoints(shape, (i + 1) * offsetSize));
  //     }
  //     return out;
  //   })
  // );

  // console.log(blueOffset);

  // console.log({ blue });

  // const svg = `
  //   <svg
  //   width="210mm"
  //   height="297mm"
  //   viewBox="0 0 210 297"
  //   version="1.1"
  //   id="svg5"
  //   sodipodi:docname="drawing-1.svg"
  //   inkscape:version="1.1.2 (b8e25be8, 2022-02-05)"
  //   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
  //   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
  //   xmlns="http://www.w3.org/2000/svg"
  //   xmlns:svg="http://www.w3.org/2000/svg">
  //     ${makeShapeLayer(
  //       blue.map((shape) => shape),
  //       "#0000ff",
  //       "1 Blue"
  //     )}
  //     ${makeShapeLayer(
  //       red.map((shape) => shape),
  //       "#ff0000",
  //       "2 Red"
  //     )}
  //   </svg>
  // `;

  // console.log(svg);

  // const div = document.createElement("div");
  // div.innerHTML = svg;
  // document.body.appendChild(div);
}
