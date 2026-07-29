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
          Pack two coworkers and one workplace hazard. The hazard becomes evidence, then HR
          makes you fire one coworker. If HR reaches 100%, HR fires you.
        </p>
      </div>

      <ol className="playable-tutorial__steps">
        <li>
          <b>1</b>
          <div>
            <strong>Pick a shape</strong>
            <p>Each character card shows its real puzzle footprint. Start with the pulsing shape.</p>
          </div>
          <span aria-hidden="true">PICK</span>
        </li>
        <li>
          <b>2</b>
          <div>
            <strong>Preview, then fit</strong>
            <p>Pick a shape, then tap a gold square. You will see the whole footprint before it lands.</p>
          </div>
          <span aria-hidden="true">FIT</span>
        </li>
        <li>
          <b>3</b>
          <div>
            <strong>Fire a coworker—or get fired</strong>
            <p>Pack all three pieces. Equipment becomes evidence; choose one actual coworker for HR to terminate.</p>
          </div>
          <span aria-hidden="true">FULL</span>
        </li>
      </ol>

      <div className="playable-tutorial__tip">
        <strong>Phone shortcut:</strong> dragging is optional. Pick a shape, then tap a gold square and watch the green or red ghost.
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
