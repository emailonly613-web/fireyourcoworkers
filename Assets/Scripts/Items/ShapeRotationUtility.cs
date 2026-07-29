using System.Collections.Generic;
using UnityEngine;

namespace CorporateTetris.Items
{
    /// <summary>
    /// Pure shape maths. No Unity object access, no side effects — every method here is
    /// deterministic and unit-testable without a scene.
    /// </summary>
    public static class ShapeRotationUtility
    {
        public const int OrientationCount = 4;

        public static int NormalizeOrientation(int orientation)
        {
            return ((orientation % OrientationCount) + OrientationCount) % OrientationCount;
        }

        public static Vector2Int RotateClockwise(Vector2Int cell)
        {
            return new Vector2Int(cell.y, -cell.x);
        }

        /// <summary>
        /// Rotates a shape clockwise by <paramref name="orientation"/> quarter turns and
        /// normalizes it so its minimum cell is (0,0).
        /// </summary>
        public static List<Vector2Int> Rotate(IReadOnlyList<Vector2Int> baseShape, int orientation)
        {
            int steps = NormalizeOrientation(orientation);
            var rotated = new List<Vector2Int>(baseShape.Count);

            for (int i = 0; i < baseShape.Count; i++)
            {
                Vector2Int cell = baseShape[i];
                for (int step = 0; step < steps; step++)
                {
                    cell = RotateClockwise(cell);
                }
                rotated.Add(cell);
            }

            Normalize(rotated);
            return rotated;
        }

        /// <summary>Shifts cells in place so the minimum x and minimum y are both zero.</summary>
        public static void Normalize(List<Vector2Int> cells)
        {
            if (cells.Count == 0)
            {
                return;
            }

            int minX = int.MaxValue;
            int minY = int.MaxValue;
            for (int i = 0; i < cells.Count; i++)
            {
                if (cells[i].x < minX) minX = cells[i].x;
                if (cells[i].y < minY) minY = cells[i].y;
            }

            if (minX == 0 && minY == 0)
            {
                return;
            }

            var shift = new Vector2Int(minX, minY);
            for (int i = 0; i < cells.Count; i++)
            {
                cells[i] -= shift;
            }
        }

        public static Vector2Int GetBoundsSize(IReadOnlyList<Vector2Int> cells)
        {
            if (cells.Count == 0)
            {
                return Vector2Int.zero;
            }

            int minX = int.MaxValue, minY = int.MaxValue;
            int maxX = int.MinValue, maxY = int.MinValue;
            for (int i = 0; i < cells.Count; i++)
            {
                if (cells[i].x < minX) minX = cells[i].x;
                if (cells[i].y < minY) minY = cells[i].y;
                if (cells[i].x > maxX) maxX = cells[i].x;
                if (cells[i].y > maxY) maxY = cells[i].y;
            }

            return new Vector2Int(maxX - minX + 1, maxY - minY + 1);
        }

        /// <summary>
        /// Offset, in cell units, from the anchor cell's centre to the centre of the shape's
        /// bounding box. Positioning the visual root at anchorWorld + this * cellSize keeps a
        /// piece visually centred across rotations, which is what stops it drifting when the
        /// bounding box changes shape.
        /// </summary>
        public static Vector2 GetBoundsCenterOffset(IReadOnlyList<Vector2Int> cells)
        {
            Vector2Int size = GetBoundsSize(cells);
            return new Vector2((size.x - 1) * 0.5f, (size.y - 1) * 0.5f);
        }

        public static bool ShapesEqual(IReadOnlyList<Vector2Int> a, IReadOnlyList<Vector2Int> b)
        {
            if (a.Count != b.Count)
            {
                return false;
            }

            for (int i = 0; i < a.Count; i++)
            {
                bool found = false;
                for (int j = 0; j < b.Count; j++)
                {
                    if (a[i] == b[j]) { found = true; break; }
                }
                if (!found) return false;
            }

            return true;
        }
    }
}
