import type { CSSProperties } from "react";
import {
  getPieceDefinition,
  getRotatedCells,
  normalizeRotation,
  type PieceId,
} from "../../game";

export interface PieceShapeProps {
  readonly pieceId: PieceId;
  readonly rotation?: number;
  readonly className?: string;
  readonly "aria-label"?: string;
}

function classNames(...values: readonly (string | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

/**
 * Renders the occupied cells of a game piece as an exact, normalized CSS grid.
 * The shape is decorative unless an accessible label is supplied.
 */
export function PieceShape({
  pieceId,
  rotation = 0,
  className,
  "aria-label": ariaLabel,
}: PieceShapeProps) {
  const normalizedRotation = normalizeRotation(rotation);
  const cells = getRotatedCells(getPieceDefinition(pieceId), normalizedRotation);
  const columnCount = cells.reduce((maximum, cell) => Math.max(maximum, cell.x + 1), 0);
  const rowCount = cells.reduce((maximum, cell) => Math.max(maximum, cell.y + 1), 0);
  const labelled = Boolean(ariaLabel?.trim());
  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columnCount}, var(--shape-cell, 8px))`,
    gridTemplateRows: `repeat(${rowCount}, var(--shape-cell, 8px))`,
  };

  return (
    <span
      aria-hidden={labelled ? undefined : true}
      aria-label={labelled ? ariaLabel : undefined}
      className={classNames(
        "piece-shape",
        `piece-shape--${pieceId}`,
        `piece-shape--rotation-${normalizedRotation}`,
        className,
      )}
      data-piece-id={pieceId}
      data-rotation={normalizedRotation}
      role={labelled ? "img" : undefined}
      style={gridStyle}
    >
      {cells.map(({ x, y }) => (
        <span
          aria-hidden="true"
          className="piece-shape__cell"
          data-x={x}
          data-y={y}
          key={`${x}:${y}`}
          style={{ gridColumnStart: x + 1, gridRowStart: y + 1 }}
        />
      ))}
    </span>
  );
}
