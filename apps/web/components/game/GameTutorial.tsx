"use client";

import { useEffect, useRef } from "react";

export function GameTutorial({
  open,
  onDismiss,
}: {
  open: boolean;
  onDismiss: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      aria-labelledby="game-tutorial-title"
      aria-describedby="game-tutorial-summary"
      className="playable-tutorial"
      data-testid="game-tutorial"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      ref={dialogRef}
    >
      <button
        aria-label="Close how to play"
        className="playable-tutorial__close"
        onClick={onDismiss}
        type="button"
      >
        ×
      </button>

      <div className="playable-tutorial__heading">
        <span>30-second orientation</span>
        <h3 id="game-tutorial-title">How to avoid an HR incident.</h3>
        <p id="game-tutorial-summary">
          Your entire job is to fit all three office disasters into the glowing gold load zone.
        </p>
      </div>

      <ol className="playable-tutorial__steps">
        <li>
          <b>1</b>
          <div>
            <strong>Pick a piece</strong>
            <p>Choose the CEO, intern, or copier from the rack beside the elevator.</p>
          </div>
          <span aria-hidden="true">PICK</span>
        </li>
        <li>
          <b>2</b>
          <div>
            <strong>Drag or tap to fit</strong>
            <p>Drag it in—or tap a piece, then tap a gold cell. Green fits. Red does not.</p>
          </div>
          <span aria-hidden="true">FIT</span>
        </li>
        <li>
          <b>3</b>
          <div>
            <strong>Pack all three</strong>
            <p>Rotate when needed, watch HR, then share the same floor with a friend.</p>
          </div>
          <span aria-hidden="true">FULL</span>
        </li>
      </ol>

      <div className="playable-tutorial__tip">
        <strong>Phone shortcut:</strong> dragging is optional. Tap a piece, then tap its destination.
      </div>

      <button
        className="playable-tutorial__start"
        data-testid="tutorial-start"
        onClick={onDismiss}
        type="button"
      >
        START PACKING
        <span aria-hidden="true">→</span>
      </button>
    </dialog>
  );
}
