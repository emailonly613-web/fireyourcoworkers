"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  BrokenCopyMachine,
  MicroManagingCeo,
  SleepingIntern,
} from "@/components/characters/CharacterArt";
import { GameTutorial } from "@/components/game/GameTutorial";
import { ShareChallengeButton } from "@/components/share/ShareChallengeButton";
import {
  HR_RULE_DEFINITIONS,
  PIECE_IDS,
  createHrPersistentState,
  createInitialState,
  evaluateHr,
  getPieceDefinition,
  getRotatedCells,
  isSolved,
  normalizeRotation,
  placePiece,
  previewPlacement,
  undo,
  type Cell,
  type GameState,
  type HrAttempt,
  type HrPersistentState,
  type PieceId,
  type PiecePlacement,
  type PlacementPreview,
  type Rotation,
} from "@/game";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { compareChallengeResult, parseChallengeTarget } from "@/lib/share";
import { markTutorialSeen, shouldShowTutorial } from "@/lib/tutorial";

type RotationMap = Record<PieceId, Rotation>;

type DragState = {
  pointerId: number;
  pieceId: PieceId;
  rotation: Rotation;
  startX: number;
  startY: number;
  moved: boolean;
};

type PieceReaction = {
  pieceId: PieceId;
  line: string;
  tone: "success" | "failure";
};

const INITIAL_ROTATIONS: RotationMap = {
  "sleeping-intern": 0,
  "micro-managing-ceo": 0,
  "broken-copy-machine": 0,
};

const PIECE_NOTES: Record<PieceId, string> = {
  "sleeping-intern": "Long, sleepy, surprisingly load-bearing.",
  "micro-managing-ceo": "Wide stance. Wider liability radius.",
  "broken-copy-machine": "Rigid equipment. Zero spatial awareness.",
};

const SUCCESS_REACTIONS: Record<PieceId, string> = {
  "sleeping-intern": "…wake me when we get there.",
  "micro-managing-ceo": "Exactly where I delegated myself.",
  "broken-copy-machine": "PLACEMENT ACCEPTED. PAPERWORK PENDING.",
};

const FAILURE_REACTIONS: Record<PieceId, string> = {
  "sleeping-intern": "Is my internship over?",
  "micro-managing-ceo": "This is not an aligned fit.",
  "broken-copy-machine": "ERROR: PERSONAL SPACE UNAVAILABLE.",
};

function cellKey({ x, y }: Cell) {
  return `${x},${y}`;
}

function pieceBounds(cells: readonly Cell[]) {
  const minX = Math.min(...cells.map(({ x }) => x));
  const minY = Math.min(...cells.map(({ y }) => y));
  const maxX = Math.max(...cells.map(({ x }) => x));
  const maxY = Math.max(...cells.map(({ y }) => y));
  return { minX, minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function PieceArt({ pieceId }: { pieceId: PieceId }) {
  switch (pieceId) {
    case "sleeping-intern":
      return <SleepingIntern className="playable-piece__art playable-piece__art--intern" />;
    case "micro-managing-ceo":
      return <MicroManagingCeo className="playable-piece__art playable-piece__art--ceo" />;
    case "broken-copy-machine":
      return <BrokenCopyMachine className="playable-piece__art playable-piece__art--printer" />;
  }
}

function placementStyle(
  placement: PiecePlacement,
  gridWidth: number,
  gridHeight: number,
): CSSProperties {
  const bounds = pieceBounds(placement.cells);
  return {
    height: `${(bounds.height / gridHeight) * 100}%`,
    left: `${(bounds.minX / gridWidth) * 100}%`,
    top: `${(bounds.minY / gridHeight) * 100}%`,
    width: `${(bounds.width / gridWidth) * 100}%`,
  };
}

function PieceCellMask({ placement }: { placement: PiecePlacement }) {
  const bounds = pieceBounds(placement.cells);
  return (
    <span aria-hidden="true" className="playable-piece__mask">
      {placement.cells.map((cell) => (
        <span
          className="playable-piece__mask-cell"
          key={cellKey(cell)}
          style={{
            height: `${100 / bounds.height}%`,
            left: `${((cell.x - bounds.minX) / bounds.width) * 100}%`,
            top: `${((cell.y - bounds.minY) / bounds.height) * 100}%`,
            width: `${100 / bounds.width}%`,
          }}
        />
      ))}
    </span>
  );
}

function PlacedPiece({
  placement,
  gridWidth,
  gridHeight,
  pressured,
  flagged,
  locked,
  reaction,
  onPointerDown,
}: {
  placement: PiecePlacement;
  gridWidth: number;
  gridHeight: number;
  pressured: boolean;
  flagged: boolean;
  locked: boolean;
  reaction: PieceReaction | null;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>, pieceId: PieceId) => void;
}) {
  const definition = getPieceDefinition(placement.pieceId);
  return (
    <button
      aria-label={`Move ${definition.publicName}`}
      className={`playable-piece playable-piece--${placement.pieceId}${pressured ? " playable-piece--pressured" : ""}${flagged ? " playable-piece--hr-flagged" : ""}`}
      data-testid={`placed-${placement.pieceId}`}
      disabled={locked}
      onPointerDown={(event) => onPointerDown(event, placement.pieceId)}
      style={placementStyle(placement, gridWidth, gridHeight)}
      type="button"
    >
      <PieceCellMask placement={placement} />
      <span
        className="playable-piece__art-wrap"
        style={{ "--piece-rotation": `${placement.rotation}deg` } as CSSProperties}
      >
        <PieceArt pieceId={placement.pieceId} />
      </span>
      {reaction?.pieceId === placement.pieceId ? (
        <span className={`playable-piece__reaction playable-piece__reaction--${reaction.tone}`}>
          {reaction.line}
        </span>
      ) : null}
    </button>
  );
}

export function PlayableElevator() {
  const [game, setGame] = useState<GameState>(() => createInitialState());
  const [rotations, setRotations] = useState<RotationMap>(INITIAL_ROTATIONS);
  const [selectedPiece, setSelectedPiece] = useState<PieceId>("micro-managing-ceo");
  const [drag, setDrag] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<PlacementPreview | null>(null);
  const [rejectedPreview, setRejectedPreview] = useState<PlacementPreview | null>(null);
  const [acceptedPreview, setAcceptedPreview] = useState<PlacementPreview | null>(null);
  const [message, setMessage] = useState("Select a coworker, then drag or choose a target cell.");
  const [invalidPulse, setInvalidPulse] = useState(0);
  const [reaction, setReaction] = useState<PieceReaction | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState<ReturnType<typeof parseChallengeTarget>>(null);
  const [challengeInvalid, setChallengeInvalid] = useState(false);
  const [hrPersistentState, setHrPersistentState] = useState<HrPersistentState>(() =>
    createHrPersistentState(),
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tutorialTriggerRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const firstGrabTrackedRef = useRef(false);
  const completionTrackedRef = useRef(false);
  const invalidAttemptCounterRef = useRef(0);
  const lawsuitEpisodeTrackedRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  const targetCells = useMemo(
    () => new Set(game.level.targetCells.map(cellKey)),
    [game.level.targetCells],
  );
  const blockedCells = useMemo(
    () => new Set(game.level.blockedCells.map(cellKey)),
    [game.level.blockedCells],
  );
  const solved = isSolved(game);
  const hr = useMemo(
    () => evaluateHr(game, { persistentState: hrPersistentState }),
    [game, hrPersistentState],
  );
  const inputLocked = solved || hr.lawsuit;
  const placedCount = Object.keys(game.placements).length;
  const attemptMoves = game.actionLog.length;
  const challengeVerdict = solved && challengeTarget
    ? compareChallengeResult(challengeTarget, { moves: attemptMoves, score: hr.score })
    : null;
  const activeRulesById = useMemo(
    () => new Map(hr.activeViolations.map((violation) => [violation.id, violation])),
    [hr.activeViolations],
  );
  const hrFlaggedPieces = useMemo(
    () => new Set(hr.activeViolations.flatMap(({ evidence }) => evidence.pieceIds)),
    [hr.activeViolations],
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const params = new URLSearchParams(window.location.search);
    const incomingChallenge = parseChallengeTarget(window.location.search);
    setChallengeTarget(incomingChallenge);
    setChallengeInvalid(params.has("c") && !incomingChallenge);
    if (incomingChallenge) {
      trackAnalyticsEvent("challenge_opened", {
        level_id: incomingChallenge.levelId,
        target_result: incomingChallenge.result,
      });
    }
    if (incomingChallenge || window.location.hash === "#play") {
      window.setTimeout(
        () => stage.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" }),
        320,
      );
    }
    if (params.get("tutorial") === "1") {
      setTutorialOpen(true);
      return;
    }
    if (incomingChallenge) return;
    if (!shouldShowTutorial()) return;

    if (typeof IntersectionObserver !== "function") {
      setTutorialOpen(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setTutorialOpen(true);
        observer.disconnect();
      },
      { rootMargin: "-8% 0px -8%", threshold: 0.12 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const dismissTutorial = () => {
    markTutorialSeen();
    setTutorialOpen(false);
    window.setTimeout(() => {
      tutorialTriggerRef.current?.focus({ preventScroll: true });
      stageRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
    }, 0);
  };

  useEffect(() => {
    if (!hr.lawsuit) {
      lawsuitEpisodeTrackedRef.current = false;
      return;
    }
    if (lawsuitEpisodeTrackedRef.current) return;

    lawsuitEpisodeTrackedRef.current = true;
    const topViolation = [...hr.activeViolations].sort((a, b) => b.score - a.score)[0];
    trackAnalyticsEvent("lawsuit_triggered", {
      level_id: game.level.id,
      rule_id: topViolation?.id ?? "hr-threshold",
      strike_count: hr.activeViolations.length,
    });
    if (challengeTarget) {
      trackAnalyticsEvent("challenge_completed", {
        level_id: game.level.id,
        move_count: game.actionLog.length,
        outcome: "lawsuit",
        score: hr.score,
      });
    }
  }, [challengeTarget, game.actionLog.length, game.level.id, hr.activeViolations, hr.lawsuit, hr.score]);

  const playTone = (tone: "success" | "failure") => {
    if (!soundEnabled) return;
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = tone === "success" ? "triangle" : "square";
    oscillator.frequency.setValueAtTime(tone === "success" ? 420 : 150, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      tone === "success" ? 680 : 85,
      audio.currentTime + 0.16,
    );
    gain.gain.setValueAtTime(0.045, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.19);
    window.setTimeout(() => void audio.close(), 260);
  };

  const showReaction = (nextReaction: PieceReaction) => {
    setReaction(nextReaction);
    window.setTimeout(() => setReaction((current) => current === nextReaction ? null : current), 1_650);
  };

  const isPressured = (placement: PiecePlacement) => {
    const otherCells = (Object.values(game.placements).filter(Boolean) as PiecePlacement[])
      .filter((candidate) => candidate.pieceId !== placement.pieceId)
      .flatMap((candidate) => candidate.cells);
    const otherKeys = new Set(otherCells.map(cellKey));
    return placement.cells.some(({ x, y }) =>
      x === 0 || y === 0 || x === game.level.grid.width - 1 || y === game.level.grid.height - 1 ||
      otherKeys.has(`${x - 1},${y}`) || otherKeys.has(`${x + 1},${y}`) ||
      otherKeys.has(`${x},${y - 1}`) || otherKeys.has(`${x},${y + 1}`),
    );
  };

  const pointerPreview = (
    pieceId: PieceId,
    rotation: Rotation,
    clientX: number,
    clientY: number,
  ) => {
    const board = boardRef.current;
    if (!board) return null;
    const bounds = board.getBoundingClientRect();
    const cellWidth = bounds.width / game.level.grid.width;
    const cellHeight = bounds.height / game.level.grid.height;
    const relativeCells = getRotatedCells(getPieceDefinition(pieceId, game.level), rotation);
    const pieceSize = pieceBounds(relativeCells);
    const x = Math.round((clientX - bounds.left) / cellWidth - pieceSize.width / 2);
    const y = Math.round((clientY - bounds.top) / cellHeight - pieceSize.height / 2);
    return previewPlacement(game, pieceId, { rotation, x, y });
  };

  const beginDrag = (event: ReactPointerEvent<HTMLButtonElement>, pieceId: PieceId) => {
    if (inputLocked) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rotation = game.placements[pieceId]?.rotation ?? rotations[pieceId];
    setSelectedPiece(pieceId);
    if (!firstGrabTrackedRef.current) {
      firstGrabTrackedRef.current = true;
      trackAnalyticsEvent("first_piece_grabbed", {
        level_id: game.level.id,
        piece_id: pieceId,
      });
      if (challengeTarget) {
        trackAnalyticsEvent("play_started", {
          level_id: game.level.id,
          source: "challenge",
        });
      }
    }
    const nextDrag = {
      moved: false,
      pieceId,
      pointerId: event.pointerId,
      rotation,
      startX: event.clientX,
      startY: event.clientY,
    };
    dragRef.current = nextDrag;
    setDrag(nextDrag);
    setPreview(null);
    setMessage(`${getPieceDefinition(pieceId).publicName} selected. Drag it into the elevator.`);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const activeDrag = dragRef.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
    event.preventDefault();
    if (!activeDrag.moved && Math.hypot(event.clientX - activeDrag.startX, event.clientY - activeDrag.startY) < 7) {
      return;
    }
    if (!activeDrag.moved) {
      activeDrag.moved = true;
      dragRef.current = activeDrag;
      setMessage(`${getPieceDefinition(activeDrag.pieceId).publicName} is moving. Green fits; red gets documented.`);
    }
    setPreview(pointerPreview(activeDrag.pieceId, activeDrag.rotation, event.clientX, event.clientY));
  };

  const recordInvalidEmployeeDrop = (
    pieceId: PieceId,
    candidate: PlacementPreview | null,
  ) => {
    if (pieceId === "broken-copy-machine") return;

    invalidAttemptCounterRef.current += 1;
    const reason = candidate?.violations[0]?.reason ?? "out-of-bounds";
    const attempt: HrAttempt = {
      type: "invalid-employee-drop",
      occurrenceKey: `${game.level.id}:invalid-drop:${String(invalidAttemptCounterRef.current).padStart(4, "0")}`,
      pieceId,
      candidate: {
        x: candidate?.origin.x ?? -1,
        y: candidate?.origin.y ?? -1,
        rotation:
          candidate?.rotation ?? game.placements[pieceId]?.rotation ?? rotations[pieceId],
      },
      reason,
    };
    setHrPersistentState((current) =>
      evaluateHr(game, { persistentState: current, attempt }).persistentState,
    );
  };

  const finishPlacement = (pieceId: PieceId, candidate: PlacementPreview | null) => {
    if (hr.lawsuit) {
      setMessage("New placements are frozen. Undo or restart while Legal is typing.");
      return;
    }
    if (!candidate || !candidate.valid || candidate.rotation === null) {
      setInvalidPulse((value) => value + 1);
      setAcceptedPreview(null);
      if (candidate) {
        setRejectedPreview(candidate);
        window.setTimeout(() => setRejectedPreview(null), 900);
      }
      setMessage("Invalid fit. The elevator rejected it before HR could pretend not to see.");
      showReaction({ pieceId, line: FAILURE_REACTIONS[pieceId], tone: "failure" });
      playTone("failure");
      recordInvalidEmployeeDrop(pieceId, candidate);
      const reason = candidate?.violations[0]?.reason;
      trackAnalyticsEvent("invalid_drop", {
        level_id: game.level.id,
        piece_id: pieceId,
        move_number: game.actionLog.length + 1,
        reason: reason === "collision" ? "overlap" : reason === "blocked-cell" ? "hr_rule" : reason === "out-of-bounds" ? "out_of_bounds" : "unknown",
      });
      return;
    }

    const result = placePiece(game, pieceId, {
      ...candidate.origin,
      rotation: candidate.rotation,
    });
    if (!result.accepted) {
      setInvalidPulse((value) => value + 1);
      setMessage("That placement collided with company policy.");
      showReaction({ pieceId, line: FAILURE_REACTIONS[pieceId], tone: "failure" });
      playTone("failure");
      recordInvalidEmployeeDrop(pieceId, result.preview ?? candidate);
      trackAnalyticsEvent("invalid_drop", {
        level_id: game.level.id,
        piece_id: pieceId,
        move_number: game.actionLog.length + 1,
        reason: "unknown",
      });
      return;
    }

    setGame(result.state);
    setRejectedPreview(null);
    setAcceptedPreview(candidate);
    window.setTimeout(() => setAcceptedPreview(null), 700);
    setRotations((current) => ({ ...current, [pieceId]: candidate.rotation as Rotation }));
    const nextHr = evaluateHr(result.state, { persistentState: hrPersistentState });
    setMessage(
      nextHr.lawsuit
        ? "HR reached 100. Legal has frozen the elevator pending Undo or Restart."
        : isSolved(result.state)
        ? result.state.level.completionLine
        : `${getPieceDefinition(pieceId).publicName} placed. Management remains cautiously optimistic.`,
    );
    showReaction({ pieceId, line: SUCCESS_REACTIONS[pieceId], tone: "success" });
    playTone("success");
    trackAnalyticsEvent("valid_drop", {
      level_id: game.level.id,
      piece_id: pieceId,
      move_number: result.state.actionLog.length,
    });
    if (isSolved(result.state) && !completionTrackedRef.current) {
      completionTrackedRef.current = true;
      trackAnalyticsEvent("level_completed", {
        elapsed_ms: Date.now() - startedAtRef.current,
        level_id: game.level.id,
        move_count: result.state.actionLog.length,
        score: nextHr.score,
      });
      if (challengeTarget) {
        trackAnalyticsEvent("challenge_completed", {
          level_id: game.level.id,
          move_count: result.state.actionLog.length,
          outcome: compareChallengeResult(challengeTarget, {
            moves: result.state.actionLog.length,
            score: nextHr.score,
          }),
          score: nextHr.score,
        });
      }
    }
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const activeDrag = dragRef.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
    if (!activeDrag.moved) {
      dragRef.current = null;
      setDrag(null);
      setPreview(null);
      return;
    }
    const finalPreview = pointerPreview(
      activeDrag.pieceId,
      activeDrag.rotation,
      event.clientX,
      event.clientY,
    );
    finishPlacement(activeDrag.pieceId, finalPreview);
    dragRef.current = null;
    setDrag(null);
    setPreview(null);
  };

  const placeFromCell = (cell: Cell) => {
    if (inputLocked) return;
    const rotation = game.placements[selectedPiece]?.rotation ?? rotations[selectedPiece];
    finishPlacement(
      selectedPiece,
      previewPlacement(game, selectedPiece, { ...cell, rotation }),
    );
  };

  const rotateSelected = () => {
    if (inputLocked) {
      if (hr.lawsuit) setMessage("Rotation is frozen. Undo or restart to answer Legal.");
      return;
    }
    const currentRotation = game.placements[selectedPiece]?.rotation ?? rotations[selectedPiece];
    const nextRotation = normalizeRotation(currentRotation + 90);
    const placement = game.placements[selectedPiece];

    if (placement) {
      const result = placePiece(game, selectedPiece, {
        ...placement.origin,
        rotation: nextRotation,
      });
      if (!result.accepted) {
        setInvalidPulse((value) => value + 1);
        setMessage("Rotation blocked. Someone already claimed that personal space.");
        return;
      }
      setGame(result.state);
    }

    setRotations((current) => ({ ...current, [selectedPiece]: nextRotation }));
    setMessage(`${getPieceDefinition(selectedPiece).publicName} rotated ${nextRotation} degrees.`);
  };

  const undoLastMove = () => {
    const result = undo(game);
    if (!result.accepted) {
      setMessage("Nothing to undo. The paper trail is still clean.");
      return;
    }
    setGame(result.state);
    const nextHr = evaluateHr(result.state, { persistentState: hrPersistentState });
    setMessage(
      nextHr.lawsuit
        ? "Move withdrawn, but the remaining file still totals 100. Undo again or restart."
        : "Last move withdrawn before Legal finished typing.",
    );
  };

  const restartLevel = () => {
    setGame(createInitialState());
    setRotations(INITIAL_ROTATIONS);
    setSelectedPiece("micro-managing-ceo");
    setHrPersistentState(createHrPersistentState());
    completionTrackedRef.current = false;
    firstGrabTrackedRef.current = false;
    invalidAttemptCounterRef.current = 0;
    lawsuitEpisodeTrackedRef.current = false;
    startedAtRef.current = Date.now();
    setPreview(null);
    setRejectedPreview(null);
    setAcceptedPreview(null);
    dragRef.current = null;
    setDrag(null);
    setMessage("Floor restarted. The mandatory meeting is mandatory again.");
    setReaction(null);
  };

  const gridCells = Array.from(
    { length: game.level.grid.width * game.level.grid.height },
    (_, index) => ({
      x: index % game.level.grid.width,
      y: Math.floor(index / game.level.grid.width),
    }),
  );
  const renderedPreview = preview ?? rejectedPreview ?? acceptedPreview;

  return (
    <section
      aria-labelledby="playable-title"
      className="playable-showcase"
      id="game"
      onPointerCancel={endDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
    >
      <div aria-hidden="true" className="playable-showcase__light" />
      <header className="playable-heading">
        <div>
          <p className="playable-kicker">Floor 01 · Mandatory Elevator Meeting</p>
          <h2 id="playable-title">Pack the elevator. Dodge HR.</h2>
        </div>
        <p>
          Drag all three workplace hazards into the highlighted elevator load. Rotate when
          necessary. Invalid fits stay invalid, and every accepted move can be undone.
        </p>
      </header>

      <div className="playable-stage" data-testid="playable-stage" id="play" ref={stageRef}>
        <div className="playable-stage__toolbar">
          <ol aria-label="How to play in three steps" className="playable-micro-guide">
            <li><b>1</b> Pick a piece</li>
            <li><b>2</b> Drag or tap</li>
            <li><b>3</b> Fill the gold zone</li>
          </ol>
          <div className="playable-stage__actions">
            <button
              aria-haspopup="dialog"
              className="playable-help-button"
              data-testid="how-to-play"
              onClick={() => setTutorialOpen(true)}
              ref={tutorialTriggerRef}
              type="button"
            >
              <b aria-hidden="true">?</b>
              HOW TO PLAY
            </button>
            <ShareChallengeButton
              moves={game.actionLog.length}
              result="completed"
              score={hr.score}
              surface="game"
            />
          </div>
        </div>

        {challengeTarget ? (
          <div className="playable-challenge-banner" data-testid="challenge-banner">
            <b>Self-reported coworker run:</b>
            {challengeTarget.result === "lawsuit"
              ? ` Finish below ${challengeTarget.score}% HR exposure. They lasted ${challengeTarget.moves} moves.`
              : ` Lowest HR wins. At equal HR, fewer than ${challengeTarget.moves} moves wins.`}
          </div>
        ) : null}

        {challengeInvalid ? (
          <div className="playable-challenge-banner playable-challenge-banner--invalid" data-testid="challenge-invalid">
            <b>Challenge link unavailable.</b> Loading the current Floor 1 instead.
          </div>
        ) : null}

        <div className="playable-layout">
        <aside className="playable-brief" aria-label="Level briefing">
          <p className="playable-brief__eyebrow">Today&apos;s mandatory objective</p>
          <h3>{game.level.title}</h3>
          <p>{game.level.briefing}</p>
          <dl>
            <div>
              <dt>Grid</dt>
              <dd>{game.level.grid.width} × {game.level.grid.height}</dd>
            </div>
            <div>
              <dt>Loaded</dt>
              <dd>{placedCount} / {game.level.pieces.length}</dd>
            </div>
            <div>
              <dt>Moves</dt>
              <dd>{game.actionLog.length}</dd>
            </div>
          </dl>
          <div className="playable-brief__legend">
            <span><i className="playable-legend playable-legend--target" />Required load zone</span>
            <span><i className="playable-legend playable-legend--valid" />Valid preview</span>
            <span><i className="playable-legend playable-legend--invalid" />Invalid preview</span>
          </div>
          <section
            aria-label="Live HR exposure"
            className="playable-hr"
            data-lawsuit={hr.lawsuit ? "true" : "false"}
            data-testid="hr-panel"
          >
            <div className="playable-hr__heading">
              <div>
                <span>HR exposure</span>
                <strong aria-live="polite">{hr.statusBand}</strong>
              </div>
              <b>{hr.score}%</b>
            </div>
            <div
              aria-label={`HR exposure ${hr.score} out of 100`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={hr.score}
              className="playable-hr__meter"
              role="progressbar"
            >
              <i style={{ width: `${hr.score}%` }} />
            </div>
            <ul className="playable-hr__rules">
              {HR_RULE_DEFINITIONS.map((definition) => {
                const active = activeRulesById.get(definition.id);
                return (
                  <li className={active ? "is-active" : ""} key={definition.id}>
                    <i aria-hidden="true" />
                    <span>{definition.publicLabel}</span>
                    <b>{active ? `+${active.score}` : "CLEAR"}</b>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>

        <div className={`playable-elevator${invalidPulse ? " playable-elevator--has-rejected" : ""}${acceptedPreview ? " playable-elevator--accepted" : ""}${hr.lawsuit ? " playable-elevator--lawsuit" : ""}`} key={invalidPulse}>
          <div className="playable-elevator__header">
            <span className="playable-elevator__badge">HR</span>
            <span aria-label="Floor 1" className="playable-elevator__floor">01<i aria-hidden="true">▲</i></span>
            <div>
              <strong>{hr.statusBand.toUpperCase()}</strong>
              <span>{solved ? "ELEVATOR FULL" : `${placedCount} OF ${game.level.pieces.length} LOADED`}</span>
            </div>
            <b>{hr.score}%</b>
          </div>

          <div aria-hidden="true" className="playable-elevator__call-panel">
            <i />
            <b />
          </div>

          <div
            className="playable-board"
            data-testid="game-board"
            ref={boardRef}
            style={{
              gridTemplateColumns: `repeat(${game.level.grid.width}, 1fr)`,
              gridTemplateRows: `repeat(${game.level.grid.height}, 1fr)`,
            }}
          >
            <div aria-hidden="true" className="playable-board__cabin">
              <span className="playable-board__ceiling" />
              <span className="playable-board__wall playable-board__wall--left" />
              <span className="playable-board__wall playable-board__wall--right" />
              <span className="playable-board__floor-plane" />
              <span className="playable-board__door-seam" />
              <span className="playable-board__reflection" />
            </div>

            {placedCount === 0 ? (
              <div aria-hidden="true" className="playable-empty-guide">
                <strong>DROP ZONE</strong>
                <span>Pick a piece above or beside the elevator, then tap a gold cell.</span>
              </div>
            ) : null}

            {gridCells.map((cell) => {
              const key = cellKey(cell);
              const blocked = blockedCells.has(key);
              const target = targetCells.has(key);
              const previewed = renderedPreview?.cells.some((candidate) => cellKey(candidate) === key);
              const previewClass = previewed
                ? renderedPreview?.valid
                  ? " playable-board__cell--preview-valid"
                  : " playable-board__cell--preview-invalid"
                : "";
              return (
                <button
                  aria-label={blocked ? `Elevator control at column ${cell.x + 1}, row ${cell.y + 1}` : `Place selected piece at column ${cell.x + 1}, row ${cell.y + 1}`}
                  className={`playable-board__cell${target ? " playable-board__cell--target" : ""}${blocked ? " playable-board__cell--blocked" : ""}${previewClass}`}
                  disabled={blocked || inputLocked}
                  key={key}
                  onClick={() => placeFromCell(cell)}
                  type="button"
                >
                  {blocked && cell.x === 5 && cell.y === 0 ? <span>DOOR</span> : null}
                </button>
              );
            })}

            {(Object.values(game.placements).filter(Boolean) as PiecePlacement[]).map((placement) => (
              <PlacedPiece
                gridHeight={game.level.grid.height}
                gridWidth={game.level.grid.width}
                key={placement.pieceId}
                flagged={hrFlaggedPieces.has(placement.pieceId)}
                locked={inputLocked}
                onPointerDown={beginDrag}
                placement={placement}
                pressured={isPressured(placement)}
                reaction={reaction}
              />
            ))}

            {renderedPreview ? (
              <div
                aria-hidden="true"
                className={`playable-preview playable-preview--${renderedPreview.valid ? "valid" : "invalid"}`}
                data-testid="placement-preview"
              >
                {renderedPreview.cells.map((cell) => (
                  <span
                    key={cellKey(cell)}
                    style={{
                      height: `${100 / game.level.grid.height}%`,
                      left: `${(cell.x / game.level.grid.width) * 100}%`,
                      top: `${(cell.y / game.level.grid.height) * 100}%`,
                      width: `${100 / game.level.grid.width}%`,
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <p aria-live="polite" className="playable-message" data-testid="game-message">
            {message}
          </p>

          {solved && !hr.lawsuit ? (
            <div className="playable-complete" data-testid="game-complete">
              <span>ELEVATOR FULL</span>
              <strong>{hr.completionRating}</strong>
              <p>{hr.statusBand} · HR exposure {hr.score}%</p>
              {challengeVerdict && challengeTarget ? (
                <p className={`playable-complete__challenge playable-complete__challenge--${challengeVerdict}`}>
                  {challengeVerdict === "beat" ? "CHALLENGE BEATEN" : challengeVerdict === "tied" ? "EXACT TIE" : "TARGET MISSED"}
                  <small>{challengeTarget.score}% HR · {challengeTarget.moves} moves</small>
                </p>
              ) : null}
              <div className="playable-complete__actions">
                <ShareChallengeButton
                  label="CHALLENGE A COWORKER"
                  moves={game.actionLog.length}
                  mode="challenge"
                  result="completed"
                  score={hr.score}
                  showCopyFallback
                  surface="completion"
                />
                <button onClick={restartLevel} type="button">PLAY AGAIN</button>
              </div>
            </div>
          ) : null}

          {hr.lawsuit ? (
            <div
              aria-labelledby="lawsuit-title"
              aria-modal="true"
              className="playable-lawsuit"
              data-testid="lawsuit-overlay"
              role="dialog"
            >
              <div className="playable-lawsuit__document">
                <span className="playable-lawsuit__docket">HR-100 · FINAL NOTICE</span>
                <strong aria-hidden="true" className="playable-lawsuit__stamp">LAWSUIT</strong>
                <h3 id="lawsuit-title">Legal has entered the elevator.</h3>
                <p>New placements are frozen. The underlying game state is intact.</p>
                <ol>
                  {[...hr.activeViolations]
                    .sort((a, b) => b.score - a.score)
                    .map((violation) => (
                      <li key={violation.id}>
                        <span>{violation.publicLabel}</span>
                        <b>+{violation.score}</b>
                      </li>
                    ))}
                </ol>
                <div className="playable-lawsuit__actions">
                  <button
                    data-testid="lawsuit-undo"
                    disabled={!game.history.length}
                    onClick={undoLastMove}
                    type="button"
                  >
                    Undo last move
                  </button>
                  <button data-testid="lawsuit-restart" onClick={restartLevel} type="button">
                    Restart floor
                  </button>
                  <ShareChallengeButton
                    label="SHARE THE LAWSUIT"
                    moves={game.actionLog.length}
                    mode="challenge"
                    result="lawsuit"
                    score={hr.score}
                    surface="lawsuit"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="playable-tray" aria-label="Movable office pieces">
          <div className="playable-tray__title">
            <span>Piece rack</span>
            <strong>Drag these 3 into the elevator</strong>
            <button
              aria-pressed={soundEnabled}
              className="playable-sound"
              onClick={() => setSoundEnabled((current) => !current)}
              type="button"
            >
              {soundEnabled ? "SFX ON" : "SFX OFF"}
            </button>
          </div>
          <div className="playable-tray__pieces">
            {PIECE_IDS.map((pieceId, index) => {
              const definition = getPieceDefinition(pieceId);
              const placed = Boolean(game.placements[pieceId]);
              const selected = selectedPiece === pieceId;
              return (
                <button
                  aria-pressed={selected}
                  className={`playable-tray-piece${selected ? " playable-tray-piece--selected" : ""}${placed ? " playable-tray-piece--placed" : ""}`}
                  data-testid={`tray-${pieceId}`}
                  disabled={inputLocked}
                  key={pieceId}
                  onClick={() => {
                    setSelectedPiece(pieceId);
                    setMessage(`${definition.publicName} selected. Now tap a gold cell—or drag it into the elevator.`);
                  }}
                  onPointerDown={(event) => beginDrag(event, pieceId)}
                  type="button"
                >
                  <span aria-hidden="true" className="playable-tray-piece__number">{index + 1}</span>
                  <span className="playable-tray-piece__art" style={{ transform: `rotate(${rotations[pieceId]}deg)` }}>
                    <PieceArt pieceId={pieceId} />
                  </span>
                  <span className="playable-tray-piece__copy">
                    <strong>{definition.publicName}</strong>
                    <small>{placed ? "Loaded · drag to move" : PIECE_NOTES[pieceId]}</small>
                    <em className="playable-tray-piece__cue">{placed ? "IN ELEVATOR" : selected ? "SELECTED · TAP A GOLD CELL" : "DRAG OR TAP"}</em>
                  </span>
                  <b>{rotations[pieceId]}°</b>
                </button>
              );
            })}
          </div>

          <div className="playable-controls" aria-label="Game controls">
            <button data-testid="rotate-control" disabled={inputLocked} onClick={rotateSelected} type="button">
              <span>ROTATE</span>
              <small>Selected piece</small>
            </button>
            <button data-testid="undo-control" disabled={!game.history.length} onClick={undoLastMove} type="button">
              <span>UNDO</span>
              <small>Last move</small>
            </button>
            <button data-testid="restart-control" onClick={restartLevel} type="button">
              <span>RESTART</span>
              <small>Clear floor</small>
            </button>
          </div>
        </aside>
        </div>
      </div>

      <p className="playable-access-note">
        Mouse, touch, and keyboard cell placement are supported. Drag surfaces disable page
        scrolling only while a piece is under your control.
      </p>
      <GameTutorial open={tutorialOpen} onDismiss={dismissTutorial} />
    </section>
  );
}
