import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PieceShape } from "../components/game/PieceShape";

function cellCoordinates(markup: string): readonly string[] {
  return [...markup.matchAll(/data-x="(\d+)" data-y="(\d+)"/g)].map(
    ([, x, y]) => `${x},${y}`,
  );
}

describe("PieceShape", () => {
  it("renders the exact normalized occupied-cell silhouette at the requested rotation", () => {
    const markup = renderToStaticMarkup(
      createElement(PieceShape, {
        className: "preview-shape",
        pieceId: "micro-managing-ceo",
        rotation: 90,
      }),
    );

    expect(cellCoordinates(markup)).toEqual(["1,0", "0,1", "1,1", "1,2"]);
    expect(markup).toContain("grid-template-columns:repeat(2, var(--shape-cell, 8px))");
    expect(markup).toContain("grid-template-rows:repeat(3, var(--shape-cell, 8px))");
    expect(markup).toContain("grid-column-start:2;grid-row-start:1");
    expect(markup).toContain(
      'class="piece-shape piece-shape--micro-managing-ceo piece-shape--rotation-90 preview-shape"',
    );
    expect(markup).toContain('data-rotation="90"');
  });

  it("is decorative by default and becomes a labelled image when requested", () => {
    const decorative = renderToStaticMarkup(
      createElement(PieceShape, { pieceId: "sleeping-intern", rotation: 0 }),
    );
    const labelled = renderToStaticMarkup(
      createElement(PieceShape, {
        "aria-label": "Sleeping Intern piece",
        pieceId: "sleeping-intern",
        rotation: 0,
      }),
    );

    expect(decorative).toContain('aria-hidden="true"');
    expect(decorative).not.toContain("aria-label=");
    expect(decorative).not.toContain('role="img"');
    expect(labelled).toContain('aria-label="Sleeping Intern piece"');
    expect(labelled).toContain('role="img"');
    expect(labelled).not.toContain('aria-hidden="true" class="piece-shape ');
  });

  it("normalizes equivalent rotations before rendering", () => {
    const markup = renderToStaticMarkup(
      createElement(PieceShape, { pieceId: "broken-copy-machine", rotation: 450 }),
    );

    expect(markup).toContain('data-rotation="90"');
    expect(cellCoordinates(markup)).toEqual(["0,0", "1,0", "0,1", "1,1"]);
  });
});
