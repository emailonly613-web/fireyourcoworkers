# Spec Gaps Register — CLOSED

Superseded on 2026-07-29 by the authoritative dispatch:
`C:\Users\email\Downloads\corporate_tetris_claude_dispatch_current.txt`

This file previously tracked nine gaps caused by the specification arriving over a channel that
corrupted and fragmented it. The downloaded dispatch resolved every transmission gap. The
recovered answers, for the record:

| Was unknown | Resolved value |
|---|---|
| Audio anti-spam rules beyond cooldowns | No immediate repetition; max simultaneous clips; priority for invalid-drop and level-complete |
| Whether the base spec continued past §6 | Yes — §7 Initial Content, JSON schema, tests, scene, proof, definition of done |
| Squish state names | Neutral, Grabbed, Dragged, Rotating, WallCompressed, ItemCompressed, InvalidDropImpact, ValidDropSettle, Released |
| Facial reaction IDs | neutral, concerned, compressed_left, compressed_right, compressed_vertical, upside_down, panicked, smug, sleeping, angry |
| HR violation categories | Orientation, Adjacency, Position, Action, CharacterRelationship, EquipmentSafety, ManagementAbuse, AnimalPolicy |
| HR evaluation moments | OnGrab, OnRotate, OnInvalidDrop, OnValidDrop, OnUndo, OnArrangementChanged, OnLevelCompletionAttempt |
| `hrProperties` contents | Not a schema field at all — the real schema uses `category` and `weightClass` (now tracked as OQ-2) |

Two items in the old register were **not** transmission faults and remain open. They moved to
`CLAUDE-STATUS.md`:

- Unity is not installed on this build box → **B-1**
- "Sideloadable PWA" versus a Unity-only dispatch → **OQ-4**

A third problem was found only after reading the clean dispatch, and is the more serious one:

- `level_001` as specified cannot be completed (11 item cells, 12 required) → **B-2**

See `docs/CLAUDE-STATUS.md`.
