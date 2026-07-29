using System;
using UnityEngine;

namespace CorporateTetris.Data
{
    /// <summary>
    /// One elevator. Field names mirror the authoritative content schema; anything below the
    /// "schema extensions" header is an addition this implementation needs and defaults safely
    /// when the content file omits it.
    /// </summary>
    [Serializable]
    public class LevelDefinition
    {
        public string id;
        public string displayName;
        public int gridWidth = 4;
        public int gridHeight = 3;

        /// <summary>Character ids to spawn into the staging tray, one instance each.</summary>
        public string[] requiredCharacterIds = Array.Empty<string>();

        /// <summary>0 means unlimited.</summary>
        public int moveLimit;

        public string completionLine;

        // ---- Schema extensions (see docs/CLAUDE-STATUS.md, OQ-1 and OQ-2) ----

        /// <summary>World size of one grid cell.</summary>
        public float cellSize = 1f;

        /// <summary>
        /// Cells that are structure rather than usable interior. Required cells for completion
        /// are every in-bounds cell that is not blocked.
        /// </summary>
        public Vector2Int[] blockedCells = Array.Empty<Vector2Int>();

        public bool hrEnabled = true;
        public int hrWarningThreshold = 25;
        public int hrFailureLimit = 60;

        /// <summary>
        /// When true, action-violation score is wiped on undo. Defaults false, matching
        /// "action violations may remain until the level restarts".
        /// </summary>
        public bool clearActionViolationsOnUndo;

        public int TotalRequiredItems => requiredCharacterIds?.Length ?? 0;

        /// <summary>Cells that must be occupied for the level to be complete.</summary>
        public int RequiredCellCount
        {
            get
            {
                int blocked = blockedCells?.Length ?? 0;
                return Mathf.Max(0, gridWidth * gridHeight - blocked);
            }
        }
    }
}
