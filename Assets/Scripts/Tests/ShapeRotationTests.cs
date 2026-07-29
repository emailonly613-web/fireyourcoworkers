using CorporateTetris.Items;
using NUnit.Framework;
using UnityEngine;

namespace CorporateTetris.Tests
{
    public class ShapeRotationTests
    {
        [Test]
        public void Rotate_FourTimes_ReturnsToOriginalShape()
        {
            Vector2Int[] baseShape = TestFixtures.LShape();

            var rotated = ShapeRotationUtility.Rotate(baseShape, 4);

            Assert.IsTrue(ShapeRotationUtility.ShapesEqual(baseShape, rotated),
                "Four quarter turns must reproduce the original shape.");
        }

        [Test]
        public void Rotate_NormalizesToOriginEveryOrientation()
        {
            Vector2Int[] baseShape = TestFixtures.LShape();

            for (int orientation = 0; orientation < 4; orientation++)
            {
                var rotated = ShapeRotationUtility.Rotate(baseShape, orientation);

                int minX = int.MaxValue;
                int minY = int.MaxValue;
                foreach (Vector2Int cell in rotated)
                {
                    minX = Mathf.Min(minX, cell.x);
                    minY = Mathf.Min(minY, cell.y);
                }

                Assert.AreEqual(0, minX, $"Orientation {orientation} must start at local x = 0.");
                Assert.AreEqual(0, minY, $"Orientation {orientation} must start at local y = 0.");
            }
        }

        [Test]
        public void Rotate_PreservesCellCount()
        {
            Vector2Int[] baseShape = TestFixtures.LShape();

            for (int orientation = 0; orientation < 4; orientation++)
            {
                Assert.AreEqual(baseShape.Length, ShapeRotationUtility.Rotate(baseShape, orientation).Count,
                    "Rotation must never add or drop cells.");
            }
        }

        [Test]
        public void Rotate_DominoBecomesVertical()
        {
            var rotated = ShapeRotationUtility.Rotate(TestFixtures.Domino(), 1);
            Vector2Int size = ShapeRotationUtility.GetBoundsSize(rotated);

            Assert.AreEqual(new Vector2Int(1, 2), size, "A horizontal domino rotated once must be vertical.");
        }

        [Test]
        public void NormalizeOrientation_HandlesNegativeAndOverflow()
        {
            Assert.AreEqual(3, ShapeRotationUtility.NormalizeOrientation(-1));
            Assert.AreEqual(0, ShapeRotationUtility.NormalizeOrientation(4));
            Assert.AreEqual(2, ShapeRotationUtility.NormalizeOrientation(-6));
        }

        [Test]
        public void BoundsCenterOffset_KeepsPieceCentredAcrossRotation()
        {
            // A 1x2 domino centred at +0.5 on x becomes 2x1 centred at +0.5 on y.
            Vector2 horizontal = ShapeRotationUtility.GetBoundsCenterOffset(
                ShapeRotationUtility.Rotate(TestFixtures.Domino(), 0));
            Vector2 vertical = ShapeRotationUtility.GetBoundsCenterOffset(
                ShapeRotationUtility.Rotate(TestFixtures.Domino(), 1));

            Assert.AreEqual(0.5f, horizontal.x, 0.0001f);
            Assert.AreEqual(0f, horizontal.y, 0.0001f);
            Assert.AreEqual(0f, vertical.x, 0.0001f);
            Assert.AreEqual(0.5f, vertical.y, 0.0001f);
        }
    }
}
