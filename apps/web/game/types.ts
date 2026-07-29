export const PIECE_IDS = [
  "sleeping-intern",
  "micro-managing-ceo",
  "broken-copy-machine",
] as const;

export type PieceId = (typeof PIECE_IDS)[number];

export type Rotation = 0 | 90 | 180 | 270;

export interface Cell {
  readonly x: number;
  readonly y: number;
}

export interface PieceDefinition {
  readonly id: PieceId;
  readonly publicName: string;
  readonly category: "coworker" | "equipment";
  readonly baseCells: readonly Cell[];
}

export interface LevelDefinition {
  readonly id: "mandatory-elevator-meeting";
  readonly publicBrand: "Fire Your Coworkers";
  readonly title: "Mandatory Elevator Meeting";
  readonly briefing: string;
  readonly completionLine: string;
  readonly grid: {
    readonly width: number;
    readonly height: number;
  };
  readonly blockedCells: readonly Cell[];
  readonly targetCells: readonly Cell[];
  readonly pieces: readonly PieceDefinition[];
}

export interface PlacementCandidate extends Cell {
  readonly rotation: number;
}

export interface PiecePlacement {
  readonly pieceId: PieceId;
  readonly origin: Cell;
  readonly rotation: Rotation;
  readonly cells: readonly Cell[];
}

export type PlacementMap = Readonly<Partial<Record<PieceId, PiecePlacement>>>;

export type PlacementViolationReason =
  | "invalid-rotation"
  | "out-of-bounds"
  | "blocked-cell"
  | "collision";

export interface PlacementViolation {
  readonly reason: PlacementViolationReason;
  readonly cell?: Cell;
  readonly occupiedBy?: PieceId;
}

export interface PlacementPreview {
  readonly pieceId: PieceId;
  readonly origin: Cell;
  readonly rotation: Rotation | null;
  readonly cells: readonly Cell[];
  readonly valid: boolean;
  readonly violations: readonly PlacementViolation[];
}

export type LoggedGameAction =
  | {
      readonly sequence: number;
      readonly type: "place";
      readonly pieceId: PieceId;
      readonly origin: Cell;
      readonly rotation: Rotation;
    }
  | {
      readonly sequence: number;
      readonly type: "remove";
      readonly pieceId: PieceId;
    }
  | {
      readonly sequence: number;
      readonly type: "undo";
    }
  | {
      readonly sequence: number;
      readonly type: "restart";
    };

export interface GameState {
  readonly level: LevelDefinition;
  readonly placements: PlacementMap;
  /** Prior placement maps only. Kept out of public snapshots. */
  readonly history: readonly PlacementMap[];
  readonly actionLog: readonly LoggedGameAction[];
}

export type GameActionFailureReason =
  | "invalid-placement"
  | "piece-not-placed"
  | "nothing-to-undo";

export type GameActionResult =
  | {
      readonly accepted: true;
      readonly state: GameState;
      readonly preview?: PlacementPreview;
    }
  | {
      readonly accepted: false;
      /** Failed actions are atomic: this is the exact input state reference. */
      readonly state: GameState;
      readonly reason: GameActionFailureReason;
      readonly preview?: PlacementPreview;
    };

export interface StablePlacementSnapshot {
  readonly pieceId: PieceId;
  readonly x: number;
  readonly y: number;
  readonly rotation: Rotation;
  readonly cells: readonly Cell[];
}

export interface StableOccupiedCell extends Cell {
  readonly pieceId: PieceId;
}

export interface StableGameSnapshot {
  readonly schemaVersion: 1;
  readonly levelId: LevelDefinition["id"];
  readonly placements: readonly StablePlacementSnapshot[];
  readonly occupiedCells: readonly StableOccupiedCell[];
  readonly solved: boolean;
}

export interface SerializedActionLog {
  readonly schemaVersion: 1;
  readonly levelId: LevelDefinition["id"];
  readonly actions: readonly LoggedGameAction[];
}
