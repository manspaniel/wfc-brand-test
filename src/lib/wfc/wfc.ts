import Chooser from "./chooser";

export type ProtoRule<TEdge> = {
  name?: string;
  edges: TEdge[];
  weight?: number;
};

export type Rule<TEdge> = {
  name?: string;
  edges: TEdge[];
  weight?: number;
};

export const Done = Symbol.for("Done");
export const Contradiction = Symbol.for("Contradiction");
export const Continue = Symbol.for("Continue");

// export type WFCArgs<TProto, TRule, TCoord> = {
//   protoRules: TProto[];
// };

export type BaseCell<TCoord, TRule> = {
  coord: TCoord;
  entropy: number;
  value?: TRule;
  // candidates: number[];
  candidates: TRule[];
};

export type Backup<State> = {
  // contradictions: number;
  childContradicitons: number;
  state: State;
  totalCells: number;
};

const childThreshold = 300;
const singleThreshold = 10;
const backupInterval = 2;

// export class WFC<
//   TTopology extends ITopology<TProto, TRule, TCoord, TEdge, TCell, TBackup>,
//   TProto extends ProtoRule<TEdge>,
//   TRule extends Rule<TEdge>,
//   TCoord = TTopology extends ITopology<any, any, infer TCoord, any, any, any>
//     ? TCoord
//     : never,
//   TEdge = TTopology extends ITopology<any, any, any, infer TEdge, any, any>
//     ? TEdge
//     : never,
//   TCell extends BaseCell<TCoord, TRule> = TTopology extends ITopology<
//     any,
//     any,
//     any,
//     any,
//     infer TCell,
//     any
//   >
//     ? TCell
//     : never,
//   TBackup = TTopology extends ITopology<any, any, any, any, any, infer TBackup>
//     ? TBackup
//     : never
// > {

export class WFC<
  // TProto extends ProtoRule<TEdge>,
  TRule extends Rule<TEdge>,
  TCoord,
  TEdge,
  TCell extends BaseCell<TCoord, TRule>,
  TBackup
> {
  // Rules
  rules: TRule[] = [];

  // Backups

  /**
   * Contains the list of backups
   */
  backups: Backup<TBackup>[] = [];
  /**
   * Used for tracking the number of collapsed tiles.
   * When this value is greater than backupInterval, we'll create a backup.
   */
  private tilesThisBackup = 0;

  isRefining = false;
  defaultWeight = 1;

  private lowestEntropy = -1;

  topo!: Topology<any, TRule, TCoord, TEdge, TCell, TBackup>;

  constructor(args: {
    topology: Topology<any, TRule, TCoord, TEdge, TCell, TBackup>;
  }) {
    this.topo = args.topology;
    this.rules = this.topo.rules;
  }

  getNeighbors(coord: TCoord): (TCell | null)[] {
    const neighbors = this.topo.edges.map((edge) =>
      this.topo.getCellAtEdge(coord, edge)
    );
    return neighbors;
  }

  /** Returns the values of each neighbors touching edge for this cell */
  neighborSlots(cell: TCell) {
    const neighbors = this.getNeighbors(cell.coord);
    return neighbors.map((neighbor, i) => {
      if (neighbor && neighbor.value !== undefined) {
        const reverseEdgeIndex = this.topo.edges.indexOf(
          this.topo.reverseEdges[i]
        );
        return neighbor.value.edges[reverseEdgeIndex];
      }
    });
  }

  getCellEntropy(cell: TCell) {
    return cell.candidates.length;
  }

  getLowestEntropyCell(): TCell | null {
    const cells = this.topo.getAllCells();

    if (this.lowestEntropy === -1) {
      return null;
    }

    // 1. Array builder (seems faster, if we want to choose from all available items — may reduce patterns?)
    const lowestEntropyCells = [];
    for (const cell of cells) {
      if (cell.value === undefined && cell.entropy === this.lowestEntropy) {
        lowestEntropyCells.push(cell);
      }
    }

    // 2. Return single item
    // const lowestEntropyCells = [];
    // for (const cell of cells) {
    //   if (cell.value === undefined && cell.entropy === this.lowestEntropy) {
    //     return cell
    //   }
    // }

    // 3. Simple filter
    // const lowestEntropyCells = cells.filter(
    //   (cell) => cell.value === undefined && cell.entropy === this.lowestEntropy
    // );

    const randomIndex = Math.floor(Math.random() * lowestEntropyCells.length);
    return lowestEntropyCells[randomIndex];
  }

  /**
   * Collapse a low-entropy cell into a specific value
   */
  collapseOne(): typeof Contradiction | typeof Done | TCell {
    const cell = this.getLowestEntropyCell();

    if (!cell) return Done;

    if (cell.candidates.length === 0) {
      return Contradiction;
    }

    cell.value = this.getRandomCandidate(cell);

    return cell;
  }

  getRandomCandidate(cell: TCell) {
    return Chooser.chooseWeightedObject(
      cell.candidates,
      (rule) => rule.weight ?? this.defaultWeight,
      this.defaultWeight
    )!;
  }

  /**
   * One for each rule. Has a list of EdgeID => compatible rules[]
   */
  // compats!: Map<TRule, Set<TRule>[]>;
  // calculateRuleCompats() {
  //   this.compats = new Map(
  //     this.rules.map((rule) => {
  //       return [
  //         rule,
  //         this.edges.map((edge, j) => {
  //           const otherEdge = this.reverseEdges[j];
  //           return new Set(
  //             this.rules.filter((otherRule) => {
  //               return (
  //                 !otherRule.edges[otherEdge] ||
  //                 !rule.edges[edge] ||
  //                 this.edgesAreCompatible(
  //                   rule.edges[edge],
  //                   otherRule.edges[otherEdge]
  //                 )
  //               );
  //             })
  //           );
  //         }),
  //       ];
  //     })
  //   );
  // }

  reduceCandidates(cells: TCell[]) {
    for (const cell of cells) {
      if (cell.value !== undefined) continue;

      // 1. Tested edges in-flight (seems to be a tiny bit faster? Is also more flexible!)
      const neighboringEdges = this.neighborSlots(cell);
      cell.candidates = cell.candidates.filter((rule) => {
        return rule.edges.every((edge, i) => {
          const edge2 = neighboringEdges[i];
          return !edge2 || !edge || this.topo.edgesAreCompatible(edge, edge2);
        });
      });

      // console.log(
      //   "Cands",
      //   cell.candidates.length,
      //   cell.candidates.map((c) => c.name)
      // );

      // 2. Using precomputed compats
      // const neighbors = this.getNeighbors(cell.coord);
      // cell.candidates = cell.candidates.filter((rule, i) => {
      //   const compats = this.compats.get(rule)!;
      //   return neighbors.every((neighbor, j) => {
      //     if (!neighbor || neighbor.value === undefined) return true;
      //     return compats[j].has(neighbor.value);
      //   });
      // });

      cell.entropy = this.getCellEntropy(cell);
    }
  }

  /** Call to initialize state from scratch, and get ready */
  initClean() {
    this.isRefining = false;
    this.topo.reset();
    this.reduceCandidates(this.topo.getAllCells());
    this.backup();
  }

  /** Call instead of, or after 'init', to begin _refining_ an existing solution. Good for updating or animating. */
  initRefinement() {
    this.isRefining = true;
    this.reduceCandidates(this.topo.getAllCells());
    this.backup();
  }

  next() {
    const backup = this.backups[0];

    // Calculate the 'lowest entropy'
    let lowest = Infinity;
    for (const cell of this.topo.getAllCells()) {
      cell.entropy = this.getCellEntropy(cell);
      if (cell.entropy < lowest && cell.value === undefined) {
        lowest = cell.entropy;
      }
    }
    this.lowestEntropy = lowest;

    // console.log("Next");
    const result = this.collapseOne();
    // console.log("Result is", result);
    if (result === Done) {
      this.backups = [];
      return true;
    }
    if (result === Contradiction) {
      this.noteContradiction();
      this.restore();
      return false;
    }
    this.tilesThisBackup++;
    backup.totalCells++;
    // this.path.push(result);
    this.reduceCandidates(
      this.getNeighbors(result.coord).filter(Boolean) as any
    );

    if (this.tilesThisBackup > backupInterval) {
      this.backup();
    }

    return false;
  }

  backup() {
    const backup: Backup<TBackup> = {
      // contradictions: 0,
      childContradicitons: 0,
      state: this.topo.backupState(),
      totalCells: 0, //this.path.length,
    };
    this.tilesThisBackup = 0;

    this.backups.push(backup);
  }

  /**
   * Restore a backup when a contradiction is found.
   */
  restore() {
    /**
     * We have a childThreshold and singleThreshold.
     * If the latest backup has less than singleThreshold, restore that.
     * Otherwise, pop any backups which are greater than the child threshold, then restore the last backup on the list.
     * Otherwise, we have no backups to restore, so reset.
     */

    this.tilesThisBackup = 0;

    /**
     * If the last backup is still valid, restore it.
     * It's still valid if it has led to a small amount of contradictions so far.
     * If it gets too many contraditions, we'll wipe it!
     */
    const latestBackup = this.backups[this.backups.length - 1];
    if (latestBackup.childContradicitons < singleThreshold) {
      // this.path = this.path.slice(0, latestBackup.totalCells);
      this.topo.restoreState(latestBackup.state);
      // console.log("Single threshold", latestBackup.childContradicitons);
      return;
    } else {
      // Too many contradictions on this backup! Wipe it!
      this.popBackup();
    }

    /**
     * If we still have backups, we'll remove any backups which have led to too many contradictions.
     * We'll then restore the latest backup still left, if there is one.
     */
    while (this.backups.length > 0) {
      const backup = this.backups[this.backups.length - 1];
      if (backup.childContradicitons > childThreshold) {
        // console.log("REmoving backup", this.backups.length, backup);
        this.popBackup();
      } else {
        // this.path = this.path.slice(0, backup.totalCells);
        this.topo.restoreState(backup.state);
        return;
      }
    }

    /**
     * If we've gotten to this point, then the original version is too contradictory.
     * We'll reset the entire system and start again.
     */
    // this.path = [];
    this.backups = [];
    this.topo.reset();
    this.backup();
  }

  popBackup() {
    if (this.backups.length == 1 && this.isRefining) return;
    this.backups.pop();
  }

  noteContradiction() {
    for (let i in this.backups) {
      const backup = this.backups[i];
      backup.childContradicitons++;
      // if (+i === this.backups.length - 1) {
      //   backup.contradictions++;
      // }
    }
  }
}

// export abstract class Topology<
//   TProto extends ProtoRule<TEdge>,
//   TRule extends Rule<TEdge>,
//   TCoord,
//   TEdge,
//   TCell extends BaseCell<TCoord, TRule>,
//   TBackup = TCell[]
// > {
//   edges!: number[];
//   reverseEdges!: number[];
//   rules: TRule[] = [];
//   abstract reset(): void;
//   abstract expandProtoRules(protos: TProto[]): TRule[];
//   abstract getCell(coord: TCoord): TCell | null;
//   abstract getCellAtEdge(center: TCoord, edge: number): TCell | null;
//   abstract getAllCells(): TCell[];
//   abstract backupState(): TBackup;
//   abstract restoreState(state: TBackup): void;
//   abstract edgesAreCompatible(a: TEdge, b: TEdge): boolean;
// }

export abstract class Topology<
  TProto extends ProtoRule<TEdge>,
  TRule extends Rule<TEdge>,
  TCoord,
  TEdge,
  TCell extends BaseCell<TCoord, TRule>,
  TBackup = TCell[]
> {
  edges!: number[];
  reverseEdges!: number[];
  rules!: TRule[];
  abstract reset(): void;
  abstract expandProtoRules(protos: TProto[]): TRule[];
  abstract getCell(coord: TCoord): TCell | null;
  abstract getCellAtEdge(center: TCoord, edge: number): TCell | null;
  abstract getAllCells(): TCell[];
  abstract backupState(): TBackup;
  abstract restoreState(state: TBackup): void;
  abstract edgesAreCompatible(a: TEdge, b: TEdge): boolean;
}
