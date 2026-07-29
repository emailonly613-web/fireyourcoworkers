using System.Collections.Generic;
using CorporateTetris.Core;
using CorporateTetris.Items;
using NUnit.Framework;
using UnityEngine;

namespace CorporateTetris.Tests
{
    public class PlacementValidationTests
    {
        GridManager _grid;

        [SetUp]
        public void SetUp()
        {
            _grid = TestFixtures.CreateGrid(4, 4);
        }

        [TearDown]
        public void TearDown()
        {
            TestFixtures.Destroy(_grid);
        }

        [Test]
        public void ValidatePlacement_DoesNotMutateOccupancy()
        {
            var shape = new List<Vector2Int>(TestFixtures.LShape());

            PlacementResult result = _grid.ValidatePlacement(1, shape, new Vector2Int(1, 1));

            Assert.IsTrue(result.Success);
            Assert.IsFalse(_grid.IsOccupied(new Vector2Int(1, 1)),
                "Validation is read-only; only TryOccupy may commit.");
            Assert.AreEqual(0, _grid.GetCellsForItem(1).Count);
        }

        [Test]
        public void ValidatePlacement_ReturnsTheAbsoluteCellsOnSuccess()
        {
            PlacementResult result = _grid.ValidatePlacement(1, TestFixtures.Domino(), new Vector2Int(1, 2));

            Assert.IsTrue(result.Success);
            CollectionAssert.AreEquivalent(
                new[] { new Vector2Int(1, 2), new Vector2Int(2, 2) },
                result.Cells);
        }

        [Test]
        public void ValidatePlacement_RejectsEmptyShape()
        {
            PlacementResult result = _grid.ValidatePlacement(1, new List<Vector2Int>(), Vector2Int.zero);

            Assert.IsFalse(result.Success);
            Assert.AreEqual(PlacementFailure.NoShape, result.Failure);
        }

        [Test]
        public void ValidatePlacement_RejectsTheReservedEmptyItemId()
        {
            PlacementResult result = _grid.ValidatePlacement(GridManager.EmptyCell, TestFixtures.SingleCell(), Vector2Int.zero);

            Assert.IsFalse(result.Success);
            Assert.AreEqual(PlacementFailure.UnknownItem, result.Failure);
        }

        [Test]
        public void RotatedShape_FitsWhereTheUnrotatedShapeDoesNot()
        {
            GridManager column = TestFixtures.CreateGrid(1, 4);

            // A horizontal domino cannot fit a 1-wide shaft; the rotated one can.
            Assert.IsFalse(column.ValidatePlacement(1, TestFixtures.Domino(), Vector2Int.zero).Success);

            var rotated = ShapeRotationUtility.Rotate(TestFixtures.Domino(), 1);
            Assert.IsTrue(column.ValidatePlacement(1, rotated, Vector2Int.zero).Success);

            TestFixtures.Destroy(column);
        }

        [Test]
        public void EveryOrientation_ValidatesConsistentlyWithWhatItWouldOccupy()
        {
            for (int orientation = 0; orientation < 4; orientation++)
            {
                var shape = ShapeRotationUtility.Rotate(TestFixtures.LShape(), orientation);

                PlacementResult validation = _grid.ValidatePlacement(1, shape, new Vector2Int(1, 1));
                PlacementResult commit = _grid.TryOccupy(1, shape, new Vector2Int(1, 1));

                Assert.AreEqual(validation.Success, commit.Success,
                    $"Validation and commit disagreed at orientation {orientation}.");

                if (commit.Success)
                {
                    CollectionAssert.AreEquivalent(validation.Cells, commit.Cells);
                    _grid.ClearItem(1);
                }
            }
        }

        [Test]
        public void FailedPlacement_AfterPartialOverlap_LeavesNoResidue()
        {
            _grid.TryOccupy(1, TestFixtures.SingleCell(), new Vector2Int(1, 0));

            // The L-tromino's first cell is free but a later cell collides.
            PlacementResult result = _grid.TryOccupy(2, TestFixtures.LShape(), new Vector2Int(0, 0));

            Assert.IsFalse(result.Success);
            Assert.AreEqual(PlacementFailure.Overlap, result.Failure);
            Assert.IsFalse(_grid.IsOccupied(new Vector2Int(0, 0)),
                "Cells validated before the collision must not be written.");
            Assert.IsFalse(_grid.IsOccupied(new Vector2Int(0, 1)));
            Assert.AreEqual(1, _grid.GetOccupant(new Vector2Int(1, 0)));
        }
    }
}
