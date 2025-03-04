import { Topology } from "../wfc";

type SquareProtoRule<TEdge, TExtra> = {
  name?: string;
  rotations: (0 | 1 | 2 | 3)[];
  edges: TEdge[];
  weight?: number;
} & TExtra;

type SquareRule<TEdge, TExtra> = {
  name?: string;
  rotation: number;
  edges: TEdge[];
  weight?: number;
} & TExtra;

type Vec2 = { x: number; y: number };

export type Cell<TEdge, TExtra> = {
  coord: Vec2;
  entropy: number;
  value?: SquareRule<TEdge, TExtra>;
  candidates: SquareRule<TEdge, TExtra>[];
};

export class SquareGridTopology<TEdge, TExtra> extends Topology<
  SquareProtoRule<TEdge, TExtra>,
  SquareRule<TEdge, TExtra>,
  Vec2,
  TEdge,
  Cell<TEdge, TExtra>,
  { cells: Cell<TEdge, TExtra>[] }
> {
  width: number;
  height: number;

  rules: SquareRule<TEdge, TExtra>[];

  cells: Cell<TEdge, TExtra>[] = [];

  edges = [0, 1, 2, 3];
  reverseEdges = [2, 3, 0, 1];

  constructor(args: {
    width: number;
    height: number;
    edgeTest?: (a: TEdge, b: TEdge) => boolean;
    rules: SquareProtoRule<TEdge, TExtra>[];
  }) {
    super();
    this.width = args.width;
    this.height = args.height;
    this.edgesAreCompatible = args.edgeTest ?? ((a, b) => a === b);
    this.rules = this.expandProtoRules(args.rules);
  }

  edgesAreCompatible: (a: TEdge, b: TEdge) => boolean;

  reset() {
    this.cells = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cells.push({
          coord: { x, y },
          entropy: 0,
          value: undefined,
          candidates: this.rules,
        });
      }
    }
  }

  expandProtoRules(protos: SquareProtoRule<TEdge, TExtra>[]) {
    const rules: SquareRule<TEdge, TExtra>[] = [];
    for (const proto of protos) {
      for (const rotation of proto.rotations) {
        rules.push({
          ...(proto as any),
          name: proto.name,
          rotation,
          weight: proto.weight,
          edges: [
            proto.edges[(0 + 4 - rotation) % 4],
            proto.edges[(1 + 4 - rotation) % 4],
            proto.edges[(2 + 4 - rotation) % 4],
            proto.edges[(3 + 4 - rotation) % 4],
          ],
        });
      }
    }
    return rules;
  }

  getAllCells() {
    return this.cells;
  }

  getCell(coord: Vec2) {
    return this.cells[coord.y * this.width + coord.x] || null;
  }

  getCellAt(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return null;
    }
    return this.cells[y * this.width + x] || null;
  }

  getCellAtEdge(center: Vec2, edge: number) {
    if (edge === 0) {
      return this.getCell({ x: center.x, y: center.y - 1 });
    } else if (edge === 1) {
      return this.getCell({ x: center.x + 1, y: center.y });
    } else if (edge === 2) {
      return this.getCell({ x: center.x, y: center.y + 1 });
    } else if (edge === 3) {
      return this.getCell({ x: center.x - 1, y: center.y });
    }
    return null;
  }

  backupState() {
    return {
      cells: this.cells.map((cell) => {
        return {
          coord: cell.coord,
          entropy: cell.entropy,
          value: cell.value,
          candidates: cell.candidates,
        };
      }),
    };
  }

  restoreState(state: { cells: Cell<TEdge, TExtra>[] }) {
    this.cells = state.cells;
  }
}
