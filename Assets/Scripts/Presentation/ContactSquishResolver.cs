using System.Collections.Generic;
using CorporateTetris.Core;
using CorporateTetris.Items;
using UnityEngine;

namespace CorporateTetris.Presentation
{
    /// <summary>
    /// Which sides of an item are under pressure, and whether that pressure comes from an
    /// elevator wall or another item. Derived from the logical grid only.
    /// </summary>
    public readonly struct ContactPressure
    {
        public readonly bool WallLeft;
        public readonly bool WallRight;
        public readonly bool WallDown;
        public readonly bool WallUp;
        public readonly bool ItemLeft;
        public readonly bool ItemRight;
        public readonly bool ItemDown;
        public readonly bool ItemUp;

        public ContactPressure(
            bool wallLeft, bool wallRight, bool wallDown, bool wallUp,
            bool itemLeft, bool itemRight, bool itemDown, bool itemUp)
        {
            WallLeft = wallLeft;
            WallRight = wallRight;
            WallDown = wallDown;
            WallUp = wallUp;
            ItemLeft = itemLeft;
            ItemRight = itemRight;
            ItemDown = itemDown;
            ItemUp = itemUp;
        }

        public static ContactPressure None => new ContactPressure(false, false, false, false, false, false, false, false);

        public bool AnyLeft => WallLeft || ItemLeft;
        public bool AnyRight => WallRight || ItemRight;
        public bool AnyDown => WallDown || ItemDown;
        public bool AnyUp => WallUp || ItemUp;

        public bool HasAnyPressure => AnyLeft || AnyRight || AnyDown || AnyUp;

        /// <summary>Number of distinct sides under pressure. Three or more means maximum squish.</summary>
        public int PressuredSideCount
        {
            get
            {
                int count = 0;
                if (AnyLeft) count++;
                if (AnyRight) count++;
                if (AnyDown) count++;
                if (AnyUp) count++;
                return count;
            }
        }

        /// <summary>True when the item is pinned between an item and a wall on opposite sides.</summary>
        public bool IsTrappedHorizontally => AnyLeft && AnyRight;
        public bool IsTrappedVertically => AnyDown && AnyUp;
    }

    /// <summary>
    /// A purely cosmetic transform delta. Applying this must never feed back into the grid.
    /// </summary>
    public readonly struct Deformation
    {
        public readonly Vector2 Scale;
        public readonly Vector2 Offset;

        public Deformation(Vector2 scale, Vector2 offset)
        {
            Scale = scale;
            Offset = offset;
        }

        public static Deformation Neutral => new Deformation(Vector2.one, Vector2.zero);

        public bool IsNeutral =>
            Mathf.Approximately(Scale.x, 1f) &&
            Mathf.Approximately(Scale.y, 1f) &&
            Mathf.Approximately(Offset.x, 0f) &&
            Mathf.Approximately(Offset.y, 0f);

        /// <summary>Largest deviation from rest, used to assert the configured clamp holds.</summary>
        public float MaxMagnitude => Mathf.Max(
            Mathf.Abs(1f - Scale.x),
            Mathf.Abs(1f - Scale.y),
            Mathf.Abs(Offset.x),
            Mathf.Abs(Offset.y));
    }

    /// <summary>
    /// Pure, deterministic squish maths. Separate from the MonoBehaviour so it can be asserted
    /// in edit-mode tests with no scene, no prefabs and no frame loop.
    /// </summary>
    public static class SquishSolver
    {
        /// <summary>
        /// Positional offset is capped to this fraction of the maximum deformation so a squished
        /// item can never appear to drift into a grid cell it does not occupy.
        /// </summary>
        public const float OffsetClampFactor = 0.5f;

        public static Deformation Solve(ContactPressure pressure, SquishProfile profile)
        {
            if (profile == null || !profile.enabled)
            {
                return Deformation.Neutral;
            }

            float max = Mathf.Max(0f, profile.maximumDeformation);
            if (max <= 0f)
            {
                return Deformation.Neutral;
            }

            float left = SideAmount(pressure.WallLeft, pressure.ItemLeft, profile);
            float right = SideAmount(pressure.WallRight, pressure.ItemRight, profile);
            float down = SideAmount(pressure.WallDown, pressure.ItemDown, profile);
            float up = SideAmount(pressure.WallUp, pressure.ItemUp, profile);

            float horizontal = Mathf.Clamp(left + right, 0f, max);
            float vertical = Mathf.Clamp(down + up, 0f, max);

            // Squeezing on one axis bulges the other, but the bulge obeys the same clamp.
            float horizontalBulge = Mathf.Clamp(vertical * 0.5f, 0f, max);
            float verticalBulge = Mathf.Clamp(horizontal * 0.5f, 0f, max);

            var scale = new Vector2(
                Mathf.Clamp(1f - horizontal + horizontalBulge, 1f - max, 1f + max),
                Mathf.Clamp(1f - vertical + verticalBulge, 1f - max, 1f + max));

            // Pressure from the left pushes the body to the right, and vice versa.
            float offsetLimit = max * OffsetClampFactor;
            var offset = new Vector2(
                Mathf.Clamp((left - right) * OffsetClampFactor, -offsetLimit, offsetLimit),
                Mathf.Clamp((down - up) * OffsetClampFactor, -offsetLimit, offsetLimit));

            return new Deformation(scale, offset);
        }

        static float SideAmount(bool wall, bool item, SquishProfile profile)
        {
            float amount = 0f;
            if (wall) amount += Mathf.Max(0f, profile.wallCompression);
            if (item) amount += Mathf.Max(0f, profile.itemCompression);
            return amount;
        }

        /// <summary>One-shot impact squash used when a drop is rejected.</summary>
        public static Deformation SolveInvalidImpact(SquishProfile profile)
        {
            if (profile == null || !profile.enabled)
            {
                return Deformation.Neutral;
            }

            float max = Mathf.Max(0f, profile.maximumDeformation);
            float squash = Mathf.Clamp(profile.invalidImpactSquash, 0f, max);
            return new Deformation(new Vector2(1f + squash * 0.5f, 1f - squash), Vector2.zero);
        }
    }

    /// <summary>
    /// Reads the authoritative grid and reports what is pressing on an item. Read-only with
    /// respect to <see cref="GridManager"/> — it calls no mutating method.
    /// </summary>
    public class ContactSquishResolver : MonoBehaviour
    {
        [SerializeField] GridManager grid;

        public GridManager Grid
        {
            get => grid;
            set => grid = value;
        }

        public ContactPressure Resolve(int itemId)
        {
            if (grid == null)
            {
                return ContactPressure.None;
            }

            return Resolve(grid, itemId, grid.GetCellsForItem(itemId));
        }

        /// <summary>
        /// Static so tests can drive it with a grid and a cell list directly.
        /// </summary>
        public static ContactPressure Resolve(GridManager grid, int itemId, IReadOnlyList<Vector2Int> cells)
        {
            if (grid == null || cells == null || cells.Count == 0)
            {
                return ContactPressure.None;
            }

            bool wallLeft = false, wallRight = false, wallDown = false, wallUp = false;
            bool itemLeft = false, itemRight = false, itemDown = false, itemUp = false;

            for (int i = 0; i < cells.Count; i++)
            {
                Vector2Int cell = cells[i];

                Probe(grid, itemId, cell + Vector2Int.left, ref wallLeft, ref itemLeft);
                Probe(grid, itemId, cell + Vector2Int.right, ref wallRight, ref itemRight);
                Probe(grid, itemId, cell + Vector2Int.down, ref wallDown, ref itemDown);
                Probe(grid, itemId, cell + Vector2Int.up, ref wallUp, ref itemUp);
            }

            return new ContactPressure(wallLeft, wallRight, wallDown, wallUp, itemLeft, itemRight, itemDown, itemUp);
        }

        static void Probe(GridManager grid, int itemId, Vector2Int neighbour, ref bool wall, ref bool item)
        {
            // Out of bounds or a blocked cell is elevator structure: a wall, floor or ceiling.
            if (!grid.InBounds(neighbour) || grid.IsBlocked(neighbour))
            {
                wall = true;
                return;
            }

            int occupant = grid.GetOccupant(neighbour);
            if (occupant != GridManager.EmptyCell && occupant != itemId)
            {
                item = true;
            }
        }
    }
}
