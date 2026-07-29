using System.Collections.Generic;
using UnityEngine;

namespace CorporateTetris.Core
{
    public enum PlacementFailure
    {
        None = 0,
        NoShape,
        OutOfBounds,
        CellBlocked,
        Overlap,
        ItemAlreadyPlaced,
        UnknownItem
    }

    /// <summary>
    /// Outcome of a validation or occupancy attempt. <see cref="Cells"/> is populated on
    /// success and on <see cref="PlacementFailure.Overlap"/> so callers can highlight the
    /// offending cells; it is null for failures detected before the full set was resolved.
    /// </summary>
    public readonly struct PlacementResult
    {
        public readonly bool Success;
        public readonly PlacementFailure Failure;
        public readonly IReadOnlyList<Vector2Int> Cells;
        public readonly Vector2Int FirstOffendingCell;

        PlacementResult(bool success, PlacementFailure failure, IReadOnlyList<Vector2Int> cells, Vector2Int offending)
        {
            Success = success;
            Failure = failure;
            Cells = cells;
            FirstOffendingCell = offending;
        }

        public static PlacementResult Ok(IReadOnlyList<Vector2Int> cells)
        {
            return new PlacementResult(true, PlacementFailure.None, cells, Vector2Int.zero);
        }

        public static PlacementResult Fail(PlacementFailure failure, Vector2Int offending)
        {
            return new PlacementResult(false, failure, null, offending);
        }

        public static PlacementResult Fail(PlacementFailure failure, Vector2Int offending, IReadOnlyList<Vector2Int> cells)
        {
            return new PlacementResult(false, failure, cells, offending);
        }

        public override string ToString()
        {
            return Success ? $"Placed {Cells.Count} cells" : $"Rejected: {Failure} at {FirstOffendingCell}";
        }
    }
}
