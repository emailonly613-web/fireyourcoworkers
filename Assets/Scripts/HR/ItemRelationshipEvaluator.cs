using System.Collections.Generic;
using CorporateTetris.Core;
using CorporateTetris.Items;
using UnityEngine;

namespace CorporateTetris.HR
{
    /// <summary>A placed item as the HR system needs to see it. Keeps HR testable without prefabs.</summary>
    public interface IPlacedItemView
    {
        int ItemId { get; }
        OfficeItemDefinition Definition { get; }
        int Orientation { get; }
    }

    public interface IPlacedItemRegistry
    {
        bool TryGetPlacedItem(int itemId, out IPlacedItemView item);
        IReadOnlyList<int> PlacedItemIds { get; }
    }

    /// <summary>
    /// Spatial queries over the authoritative grid. Read-only: it answers "what is next to what"
    /// and never changes occupancy.
    /// </summary>
    public static class ItemRelationshipEvaluator
    {
        static readonly Vector2Int[] Orthogonal =
        {
            Vector2Int.left,
            Vector2Int.right,
            Vector2Int.up,
            Vector2Int.down
        };

        /// <summary>Distinct item ids orthogonally touching the subject, excluding the subject.</summary>
        public static List<int> GetOrthogonalNeighbours(GridManager grid, int subjectItemId)
        {
            var neighbours = new List<int>();
            if (grid == null)
            {
                return neighbours;
            }

            IReadOnlyList<Vector2Int> cells = grid.GetCellsForItem(subjectItemId);
            for (int i = 0; i < cells.Count; i++)
            {
                for (int d = 0; d < Orthogonal.Length; d++)
                {
                    int occupant = grid.GetOccupant(cells[i] + Orthogonal[d]);
                    if (occupant != GridManager.EmptyCell && occupant != subjectItemId && !neighbours.Contains(occupant))
                    {
                        neighbours.Add(occupant);
                    }
                }
            }

            return neighbours;
        }

        /// <summary>Distinct item ids occupying a cell directly above any cell of the subject.</summary>
        public static List<int> GetItemsDirectlyAbove(GridManager grid, int subjectItemId)
        {
            return GetItemsInDirection(grid, subjectItemId, Vector2Int.up);
        }

        public static List<int> GetItemsDirectlyBelow(GridManager grid, int subjectItemId)
        {
            return GetItemsInDirection(grid, subjectItemId, Vector2Int.down);
        }

        static List<int> GetItemsInDirection(GridManager grid, int subjectItemId, Vector2Int direction)
        {
            var found = new List<int>();
            if (grid == null)
            {
                return found;
            }

            IReadOnlyList<Vector2Int> cells = grid.GetCellsForItem(subjectItemId);
            for (int i = 0; i < cells.Count; i++)
            {
                int occupant = grid.GetOccupant(cells[i] + direction);
                if (occupant != GridManager.EmptyCell && occupant != subjectItemId && !found.Contains(occupant))
                {
                    found.Add(occupant);
                }
            }

            return found;
        }

        /// <summary>
        /// Lowest-then-leftmost occupied cell. Used as the stable "relevant grid position" in a
        /// violation key so the key changes if and only if the item actually moves.
        /// </summary>
        public static Vector2Int GetAnchorCell(GridManager grid, int itemId)
        {
            IReadOnlyList<Vector2Int> cells = grid != null
                ? grid.GetCellsForItem(itemId)
                : System.Array.Empty<Vector2Int>();

            if (cells.Count == 0)
            {
                return Vector2Int.zero;
            }

            Vector2Int anchor = cells[0];
            for (int i = 1; i < cells.Count; i++)
            {
                if (cells[i].y < anchor.y || (cells[i].y == anchor.y && cells[i].x < anchor.x))
                {
                    anchor = cells[i];
                }
            }

            return anchor;
        }

        public static bool MatchesSubject(OfficeItemDefinition definition, HRCondition condition)
        {
            if (definition == null || condition == null)
            {
                return false;
            }

            if (condition.subjectTags != null)
            {
                for (int i = 0; i < condition.subjectTags.Length; i++)
                {
                    if (!definition.HasTag(condition.subjectTags[i]))
                    {
                        return false;
                    }
                }
            }

            if (condition.subjectExcludeTags != null)
            {
                for (int i = 0; i < condition.subjectExcludeTags.Length; i++)
                {
                    if (definition.HasTag(condition.subjectExcludeTags[i]))
                    {
                        return false;
                    }
                }
            }

            return true;
        }
    }
}
