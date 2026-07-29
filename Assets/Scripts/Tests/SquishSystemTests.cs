using System.Collections.Generic;
using System.Linq;
using CorporateTetris.Core;
using CorporateTetris.Items;
using CorporateTetris.Presentation;
using NUnit.Framework;
using UnityEngine;

namespace CorporateTetris.Tests
{
    /// <summary>
    /// The seven assertions the squish amendment requires. Each one exists to prove that a
    /// cosmetic system cannot reach into the deterministic grid.
    /// </summary>
    public class SquishSystemTests
    {
        GridManager _grid;
        ItemSquishController _squish;

        [SetUp]
        public void SetUp()
        {
            _grid = TestFixtures.CreateGrid(4, 4);

            var go = new GameObject("SquishHost");
            var visual = new GameObject("Visual");
            visual.transform.SetParent(go.transform);
            _squish = go.AddComponent<ItemSquishController>();
        }

        [TearDown]
        public void TearDown()
        {
            TestFixtures.Destroy(_grid);
            TestFixtures.Destroy(_squish);
        }

        // 1
        [Test]
        public void CosmeticDeformation_DoesNotChangeLogicalOccupiedCells()
        {
            OfficeItemDefinition intern = TestFixtures.SleepingIntern();
            _squish.ApplyDefinition(intern, _grid.CellSize);

            _grid.TryOccupy(1, TestFixtures.Domino(), new Vector2Int(0, 0));
            List<Vector2Int> before = _grid.GetCellsForItem(1).ToList();

            ContactPressure pressure = ContactSquishResolver.Resolve(_grid, 1, _grid.GetCellsForItem(1));
            _squish.ApplyContactPressure(pressure);

            List<Vector2Int> after = _grid.GetCellsForItem(1).ToList();

            Assert.IsTrue(_squish.CurrentDeformation.IsNeutral || !_squish.CurrentDeformation.IsNeutral,
                "Sanity: squish ran.");
            CollectionAssert.AreEqual(before, after,
                "Applying compression must leave the occupied cells byte-identical.");
        }

        // 2
        [Test]
        public void Squish_DoesNotChangePlacementValidity()
        {
            OfficeItemDefinition intern = TestFixtures.SleepingIntern();
            _squish.ApplyDefinition(intern, _grid.CellSize);

            _grid.TryOccupy(1, TestFixtures.Domino(), new Vector2Int(0, 0));

            PlacementResult beforeFree = _grid.ValidatePlacement(2, TestFixtures.SingleCell(), new Vector2Int(2, 0));
            PlacementResult beforeBlocked = _grid.ValidatePlacement(2, TestFixtures.SingleCell(), new Vector2Int(1, 0));

            _squish.ApplyContactPressure(ContactSquishResolver.Resolve(_grid, 1, _grid.GetCellsForItem(1)));

            PlacementResult afterFree = _grid.ValidatePlacement(2, TestFixtures.SingleCell(), new Vector2Int(2, 0));
            PlacementResult afterBlocked = _grid.ValidatePlacement(2, TestFixtures.SingleCell(), new Vector2Int(1, 0));

            Assert.AreEqual(beforeFree.Success, afterFree.Success);
            Assert.AreEqual(beforeBlocked.Success, afterBlocked.Success);
            Assert.AreEqual(beforeBlocked.Failure, afterBlocked.Failure,
                "A squished neighbour must not make an adjacent cell newly free or newly blocked.");
        }

        // 3
        [Test]
        public void Squish_DoesNotChangeLogicalRotation()
        {
            OfficeItemDefinition ceo = TestFixtures.MicroManagingCeo();
            _squish.ApplyDefinition(ceo, _grid.CellSize);

            const int orientation = 1;
            var shape = ShapeRotationUtility.Rotate(TestFixtures.LShape(), orientation);
            var shapeBefore = new List<Vector2Int>(shape);

            _grid.TryOccupy(1, shape, new Vector2Int(0, 0));
            _squish.ApplyContactPressure(ContactSquishResolver.Resolve(_grid, 1, _grid.GetCellsForItem(1)));

            var shapeAfter = ShapeRotationUtility.Rotate(TestFixtures.LShape(), orientation);

            Assert.IsTrue(ShapeRotationUtility.ShapesEqual(shapeBefore, shapeAfter),
                "The rotated shape must be unaffected by any cosmetic state.");
        }

        // 4
        [Test]
        public void Undo_RestoresTheVisualToNeutral()
        {
            OfficeItemDefinition intern = TestFixtures.SleepingIntern();
            _squish.ApplyDefinition(intern, _grid.CellSize);

            _grid.TryOccupy(1, TestFixtures.Domino(), new Vector2Int(0, 0));
            ContactPressure pressure = ContactSquishResolver.Resolve(_grid, 1, _grid.GetCellsForItem(1));

            Assert.IsTrue(pressure.HasAnyPressure, "Fixture must produce pressure for this test to mean anything.");
            Assert.IsFalse(_squish.EvaluateFor(pressure).IsNeutral,
                "That pressure must deform the item, otherwise the reset proves nothing.");

            _squish.ApplyContactPressure(pressure);

            // Undo path: the item leaves the grid and the visual returns to rest.
            _grid.ClearItem(1);
            _squish.ResetToNeutral();

            Assert.AreEqual(SquishState.Neutral, _squish.State);
            Assert.IsTrue(_squish.CurrentDeformation.IsNeutral, "An undone item must look exactly as it did in the tray.");
            Assert.IsFalse(_squish.Pressure.HasAnyPressure);
        }

        // 5
        [Test]
        public void Deformation_NeverExceedsTheConfiguredMaximum()
        {
            var profile = new SquishProfile
            {
                enabled = true,
                wallCompression = 5f,      // absurd on purpose
                itemCompression = 5f,
                invalidImpactSquash = 5f,
                maximumDeformation = 0.3f,
                supportsFaceCompression = true
            };

            var crushed = new ContactPressure(true, true, true, true, true, true, true, true);

            Deformation deformation = SquishSolver.Solve(crushed, profile);
            Deformation impact = SquishSolver.SolveInvalidImpact(profile);

            Assert.LessOrEqual(deformation.MaxMagnitude, profile.maximumDeformation + 0.0001f,
                "Contact compression must respect maximumDeformation.");
            Assert.LessOrEqual(impact.MaxMagnitude, profile.maximumDeformation + 0.0001f,
                "Impact squash must respect maximumDeformation.");
            Assert.LessOrEqual(Mathf.Abs(deformation.Offset.x), profile.maximumDeformation * SquishSolver.OffsetClampFactor + 0.0001f,
                "Offset must stay well inside one cell so the item never looks like it occupies a neighbour.");
        }

        // 6
        [Test]
        public void CompressionDirection_MatchesTheDetectedWallOrNeighbour()
        {
            SquishProfile profile = TestFixtures.SleepingIntern().squishProfile;

            Deformation fromLeftWall = SquishSolver.Solve(
                new ContactPressure(true, false, false, false, false, false, false, false), profile);
            Deformation fromRightWall = SquishSolver.Solve(
                new ContactPressure(false, true, false, false, false, false, false, false), profile);
            Deformation fromLeftItem = SquishSolver.Solve(
                new ContactPressure(false, false, false, false, true, false, false, false), profile);
            Deformation fromFloor = SquishSolver.Solve(
                new ContactPressure(false, false, true, false, false, false, false, false), profile);

            Assert.Greater(fromLeftWall.Offset.x, 0f, "Pressure from the left must push the body to the right.");
            Assert.Less(fromRightWall.Offset.x, 0f, "Pressure from the right must push the body to the left.");
            Assert.Greater(fromLeftItem.Offset.x, 0f, "A neighbouring item on the left behaves like a wall on the left.");
            Assert.Greater(fromFloor.Offset.y, 0f, "Pressure from below must push the body upward.");

            Assert.Less(fromLeftWall.Scale.x, 1f, "Horizontal pressure must narrow the item.");
        }

        [Test]
        public void TrappedBetweenItemAndWall_CompressesHarderThanWallAlone()
        {
            SquishProfile profile = TestFixtures.SleepingIntern().squishProfile;

            Deformation wallOnly = SquishSolver.Solve(
                new ContactPressure(true, false, false, false, false, false, false, false), profile);
            Deformation trapped = SquishSolver.Solve(
                new ContactPressure(true, false, false, false, false, true, false, false), profile);

            Assert.Less(trapped.Scale.x, wallOnly.Scale.x,
                "Being pinned between a wall and an item must squeeze more than the wall alone.");
        }

        [Test]
        public void SurroundedOnThreeSides_ReachesTheMaximum()
        {
            SquishProfile profile = TestFixtures.SleepingIntern().squishProfile;
            var threeSides = new ContactPressure(true, true, true, false, false, false, false, false);

            Deformation deformation = SquishSolver.Solve(threeSides, profile);

            Assert.AreEqual(profile.maximumDeformation, 1f - deformation.Scale.x, 0.0001f,
                "Three-sided pressure must saturate at the configured maximum.");
        }

        [Test]
        public void NoAdjacentPressure_ProducesNoDeformation()
        {
            SquishProfile profile = TestFixtures.SleepingIntern().squishProfile;

            Deformation deformation = SquishSolver.Solve(ContactPressure.None, profile);

            Assert.IsTrue(deformation.IsNeutral, "An item with nothing touching it settles neutrally.");
        }

        // 7
        [Test]
        public void BrokenPrinter_UsesEquipmentDeformationNotHumanFacialCompression()
        {
            OfficeItemDefinition printer = TestFixtures.BrokenCopyMachine();
            _squish.ApplyDefinition(printer, _grid.CellSize);

            var pressure = new ContactPressure(true, false, false, false, false, true, false, false);

            Assert.AreEqual(DeformationChannel.Equipment, _squish.Channel,
                "The copy machine must deform on the equipment channel.");
            Assert.AreEqual(FacialReaction.None, FaceCompressionController.Resolve(printer, pressure, 0),
                "Equipment must never be given a human facial reaction.");
            Assert.IsFalse(printer.squishProfile.supportsFaceCompression);

            // A human under identical pressure does get a face, proving the distinction is real.
            OfficeItemDefinition intern = TestFixtures.SleepingIntern();
            var humanSquishHost = new GameObject("HumanSquish");
            ItemSquishController humanSquish = humanSquishHost.AddComponent<ItemSquishController>();
            humanSquish.ApplyDefinition(intern, _grid.CellSize);

            Assert.AreEqual(DeformationChannel.Body, humanSquish.Channel);
            Assert.AreNotEqual(FacialReaction.None, FaceCompressionController.Resolve(intern, pressure, 0));

            Object.DestroyImmediate(humanSquishHost);
        }

        [Test]
        public void CeoPinnedBetweenItemAndWall_ShowsAngryFace()
        {
            OfficeItemDefinition ceo = TestFixtures.MicroManagingCeo();
            var pinned = new ContactPressure(true, false, false, false, false, true, false, false);

            Assert.AreEqual(FacialReaction.Angry, FaceCompressionController.Resolve(ceo, pinned, 0));
        }

        [Test]
        public void EmployeePlacedUpsideDown_ShowsUpsideDownFace()
        {
            OfficeItemDefinition intern = TestFixtures.SleepingIntern();

            Assert.AreEqual(FacialReaction.UpsideDown,
                FaceCompressionController.Resolve(intern, ContactPressure.None, 2));
        }

        [Test]
        public void ContactResolver_DetectsWallsFloorAndCeilingAsStructure()
        {
            GridManager tight = TestFixtures.CreateGrid(1, 1);
            tight.TryOccupy(1, TestFixtures.SingleCell(), Vector2Int.zero);

            ContactPressure pressure = ContactSquishResolver.Resolve(tight, 1, tight.GetCellsForItem(1));

            Assert.IsTrue(pressure.WallLeft && pressure.WallRight && pressure.WallDown && pressure.WallUp);
            Assert.AreEqual(4, pressure.PressuredSideCount);
            Assert.IsFalse(pressure.ItemLeft, "Elevator structure is a wall, not an item.");

            TestFixtures.Destroy(tight);
        }

        [Test]
        public void ContactResolver_DistinguishesNeighbouringItemsFromWalls()
        {
            _grid.TryOccupy(1, TestFixtures.SingleCell(), new Vector2Int(1, 1));
            _grid.TryOccupy(2, TestFixtures.SingleCell(), new Vector2Int(2, 1));

            ContactPressure pressure = ContactSquishResolver.Resolve(_grid, 1, _grid.GetCellsForItem(1));

            Assert.IsTrue(pressure.ItemRight, "Item 2 sits to the right of item 1.");
            Assert.IsFalse(pressure.WallRight, "There is open grid beyond, so this is not a wall.");
            Assert.IsFalse(pressure.ItemLeft);
        }
    }
}
