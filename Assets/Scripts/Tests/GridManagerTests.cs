using CorporateTetris.Core;
using NUnit.Framework;
using UnityEngine;

namespace CorporateTetris.Tests
{
    public class GridManagerTests
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
        public void WorldAndGridConversions_RoundTrip()
        {
            for (int y = 0; y < 4; y++)
            {
                for (int x = 0; x < 4; x++)
                {
                    var cell = new Vector2Int(x, y);
                    Assert.AreEqual(cell, _grid.WorldToGrid(_grid.GridToWorld(cell)),
                        $"Cell {cell} must survive a world round trip.");
                }
            }
        }

        [Test]
        public void TryOccupy_MarksEveryCellOfTheShape()
        {
            PlacementResult result = _grid.TryOccupy(1, TestFixtures.Domino(), new Vector2Int(1, 1));

            Assert.IsTrue(result.Success);
            Assert.IsTrue(_grid.IsOccupied(new Vector2Int(1, 1)));
            Assert.IsTrue(_grid.IsOccupied(new Vector2Int(2, 1)));
            Assert.AreEqual(2, _grid.GetCellsForItem(1).Count);
        }

        [Test]
        public void TryOccupy_OutOfBounds_LeavesGridCompletelyUntouched()
        {
            // The second cell of the domino falls outside a 4-wide grid.
            PlacementResult result = _grid.TryOccupy(1, TestFixtures.Domino(), new Vector2Int(3, 0));

            Assert.IsFalse(result.Success);
            Assert.AreEqual(PlacementFailure.OutOfBounds, result.Failure);
            Assert.IsFalse(_grid.IsOccupied(new Vector2Int(3, 0)),
                "A rejected placement must not partially occupy the grid.");
            Assert.AreEqual(0, _grid.GetCellsForItem(1).Count);
        }

        [Test]
        public void TryOccupy_Overlap_IsRejectedAndDoesNotDisturbTheExistingItem()
        {
            Assert.IsTrue(_grid.TryOccupy(1, TestFixtures.Domino(), new Vector2Int(0, 0)).Success);

            PlacementResult result = _grid.TryOccupy(2, TestFixtures.Domino(), new Vector2Int(1, 0));

            Assert.IsFalse(result.Success);
            Assert.AreEqual(PlacementFailure.Overlap, result.Failure);
            Assert.AreEqual(1, _grid.GetOccupant(new Vector2Int(1, 0)), "The original owner must keep the cell.");
            Assert.AreEqual(0, _grid.GetCellsForItem(2).Count);
        }

        [Test]
        public void ClearItem_FreesExactlyItsOwnCells()
        {
            _grid.TryOccupy(1, TestFixtures.Domino(), new Vector2Int(0, 0));
            _grid.TryOccupy(2, TestFixtures.Domino(), new Vector2Int(2, 0));

            Assert.IsTrue(_grid.ClearItem(1));

            Assert.IsFalse(_grid.IsOccupied(new Vector2Int(0, 0)));
            Assert.IsFalse(_grid.IsOccupied(new Vector2Int(1, 0)));
            Assert.IsTrue(_grid.IsOccupied(new Vector2Int(2, 0)), "Clearing one item must not disturb another.");
        }

        [Test]
        public void IsElevatorFull_OnlyWhenEveryRequiredCellIsOccupied()
        {
            GridManager small = TestFixtures.CreateGrid(2, 1);

            Assert.IsFalse(small.IsElevatorFull);
            small.TryOccupy(1, TestFixtures.SingleCell(), new Vector2Int(0, 0));
            Assert.IsFalse(small.IsElevatorFull, "One of two cells filled is not a full elevator.");
            small.TryOccupy(2, TestFixtures.SingleCell(), new Vector2Int(1, 0));
            Assert.IsTrue(small.IsElevatorFull);

            TestFixtures.Destroy(small);
        }

        [Test]
        public void BlockedCells_AreNeitherPlaceableNorRequiredForCompletion()
        {
            GridManager blocked = TestFixtures.CreateGrid(2, 1, 1f, new[] { new Vector2Int(1, 0) });

            Assert.AreEqual(1, blocked.RequiredCellCount, "A blocked cell must not count toward completion.");

            PlacementResult result = blocked.TryOccupy(1, TestFixtures.SingleCell(), new Vector2Int(1, 0));
            Assert.IsFalse(result.Success);
            Assert.AreEqual(PlacementFailure.CellBlocked, result.Failure);

            blocked.TryOccupy(2, TestFixtures.SingleCell(), new Vector2Int(0, 0));
            Assert.IsTrue(blocked.IsElevatorFull, "Filling every unblocked cell completes the elevator.");

            TestFixtures.Destroy(blocked);
        }

        [Test]
        public void TryOccupy_SameItemTwice_IsRejected()
        {
            Assert.IsTrue(_grid.TryOccupy(1, TestFixtures.SingleCell(), new Vector2Int(0, 0)).Success);

            PlacementResult second = _grid.TryOccupy(1, TestFixtures.SingleCell(), new Vector2Int(2, 2));

            Assert.IsFalse(second.Success);
            Assert.AreEqual(PlacementFailure.ItemAlreadyPlaced, second.Failure);
        }
    }
}
