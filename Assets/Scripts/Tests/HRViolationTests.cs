using System.Collections.Generic;
using System.Linq;
using CorporateTetris.Core;
using CorporateTetris.HR;
using CorporateTetris.Items;
using NUnit.Framework;
using UnityEngine;

namespace CorporateTetris.Tests
{
    /// <summary>
    /// The ten assertions Section 2A requires, plus the role-reversal trap the spec calls out
    /// explicitly.
    /// </summary>
    public class HRViolationTests
    {
        GridManager _grid;
        FakeRegistry _registry;
        HRViolationManager _hr;

        const int InternId = 1;
        const int CeoId = 2;
        const int EmployeeId = 3;
        const int PrinterId = 4;

        [SetUp]
        public void SetUp()
        {
            _grid = TestFixtures.CreateGrid(4, 4);
            _registry = new FakeRegistry();
            _hr = TestFixtures.CreateHRManager(_grid, _registry);
        }

        [TearDown]
        public void TearDown()
        {
            TestFixtures.Destroy(_grid);
            TestFixtures.Destroy(_hr);
        }

        FakePlacedItem Place(int itemId, OfficeItemDefinition definition, Vector2Int anchor, int orientation = 0)
        {
            PlacementResult result = _grid.TryOccupy(itemId, TestFixtures.SingleCell(), anchor);
            Assert.IsTrue(result.Success, $"Fixture placement of item {itemId} at {anchor} failed: {result.Failure}");
            return _registry.Add(itemId, definition, orientation);
        }

        void Remove(int itemId)
        {
            _grid.ClearItem(itemId);
            _registry.Remove(itemId);
        }

        List<HRViolationResult> ActiveOf(string ruleId)
        {
            return _hr.ActiveArrangementViolations.Where(v => v.RuleId == ruleId).ToList();
        }

        // 1
        [Test]
        public void EmployeeUpsideDown_IsDetected()
        {
            Place(EmployeeId, TestFixtures.PlainEmployee(), new Vector2Int(0, 0), orientation: 2);

            _hr.RecalculateArrangementViolations();

            Assert.AreEqual(15, _hr.TotalScore);
            Assert.AreEqual(1, ActiveOf("employee_upside_down").Count);
            Assert.AreEqual(HRViolationCategory.Orientation, ActiveOf("employee_upside_down")[0].Category);
        }

        [Test]
        public void UprightEmployee_ProducesNoViolation()
        {
            Place(EmployeeId, TestFixtures.PlainEmployee(), new Vector2Int(0, 0), orientation: 0);

            _hr.RecalculateArrangementViolations();

            Assert.AreEqual(0, _hr.TotalScore);
        }

        [Test]
        public void ItemThatExplicitlyAllowsInversion_IsExempt()
        {
            // The copy machine may be upside down; the rule must respect that.
            Place(PrinterId, TestFixtures.PlainHeavyEquipment(), new Vector2Int(0, 0), orientation: 2);

            _hr.RecalculateArrangementViolations();

            Assert.AreEqual(0, _hr.TotalScore,
                "canBeUpsideDown must exempt an item from the orientation rule.");
        }

        // 2
        [Test]
        public void InternOrthogonallyAdjacentToManagement_IsDetected()
        {
            Place(InternId, TestFixtures.PlainIntern(), new Vector2Int(0, 0));
            Place(CeoId, TestFixtures.PlainCeo(), new Vector2Int(1, 0));

            _hr.RecalculateArrangementViolations();

            Assert.AreEqual(1, ActiveOf("intern_touching_ceo").Count);
            Assert.AreEqual(10, _hr.TotalScore);
        }

        [Test]
        public void DiagonalAdjacency_DoesNotTriggerTheOrthogonalRule()
        {
            Place(InternId, TestFixtures.PlainIntern(), new Vector2Int(0, 0));
            Place(CeoId, TestFixtures.PlainCeo(), new Vector2Int(1, 1));

            _hr.RecalculateArrangementViolations();

            Assert.AreEqual(0, _hr.TotalScore, "Only orthogonal contact counts as touching.");
        }

        // 3
        [Test]
        public void HeavyEquipmentDirectlyAboveEmployee_IsDetected()
        {
            Place(EmployeeId, TestFixtures.PlainEmployee(), new Vector2Int(1, 0));
            Place(PrinterId, TestFixtures.PlainHeavyEquipment(), new Vector2Int(1, 1));

            _hr.RecalculateArrangementViolations();

            List<HRViolationResult> violations = ActiveOf("employee_under_heavy_equipment");
            Assert.AreEqual(1, violations.Count);
            Assert.AreEqual(25, violations[0].Score);
            Assert.AreEqual(EmployeeId, violations[0].SubjectItemId);
            Assert.AreEqual(PrinterId, violations[0].NeighbourItemId);
        }

        [Test]
        public void HeavyEquipmentBesideEmployee_IsNotAnAboveViolation()
        {
            Place(EmployeeId, TestFixtures.PlainEmployee(), new Vector2Int(1, 0));
            Place(PrinterId, TestFixtures.PlainHeavyEquipment(), new Vector2Int(2, 0));

            _hr.RecalculateArrangementViolations();

            Assert.AreEqual(0, ActiveOf("employee_under_heavy_equipment").Count,
                "Directly above means above, not merely adjacent.");
        }

        [Test]
        public void EmployeeAboveHeavyEquipment_IsNotAViolation()
        {
            Place(PrinterId, TestFixtures.PlainHeavyEquipment(), new Vector2Int(1, 0));
            Place(EmployeeId, TestFixtures.PlainEmployee(), new Vector2Int(1, 1));

            _hr.RecalculateArrangementViolations();

            Assert.AreEqual(0, ActiveOf("employee_under_heavy_equipment").Count,
                "The hazard is equipment overhead, not equipment underfoot.");
        }

        // 4
        [Test]
        public void SubjectAndNeighbourRoles_AreNotReversed()
        {
            Place(InternId, TestFixtures.PlainIntern(), new Vector2Int(0, 0));
            Place(CeoId, TestFixtures.PlainCeo(), new Vector2Int(1, 0));

            _hr.RecalculateArrangementViolations();

            List<HRViolationResult> violations = ActiveOf("intern_touching_ceo");

            Assert.AreEqual(1, violations.Count,
                "The pair must produce exactly one violation, not one per direction.");
            Assert.AreEqual(InternId, violations[0].SubjectItemId,
                "The intern is the subject.");
            Assert.AreEqual(CeoId, violations[0].NeighbourItemId,
                "The CEO is the neighbour.");
            Assert.IsFalse(violations.Any(v => v.SubjectItemId == CeoId),
                "The CEO must never be treated as the intern subject.");
        }

        [Test]
        public void TwoManagersTouching_ProducesNoInternViolation()
        {
            Place(CeoId, TestFixtures.PlainCeo("ceo_a"), new Vector2Int(0, 0));
            Place(EmployeeId, TestFixtures.PlainCeo("ceo_b"), new Vector2Int(1, 0));

            _hr.RecalculateArrangementViolations();

            Assert.AreEqual(0, ActiveOf("intern_touching_ceo").Count,
                "Neither item carries the intern tag, so the rule must not fire.");
        }

        // 5 and 8
        [Test]
        public void PersistentViolation_IsCountedOnlyOnce_AcrossManyReevaluations()
        {
            Place(EmployeeId, TestFixtures.PlainEmployee(), new Vector2Int(0, 0), orientation: 2);

            for (int i = 0; i < 10; i++)
            {
                _hr.RecalculateArrangementViolations();
            }

            Assert.AreEqual(15, _hr.TotalScore,
                "Re-running the evaluator must not add another 15 points each time.");
            Assert.AreEqual(1, _hr.ActiveArrangementViolations.Count);
        }

        [Test]
        public void UnrelatedPlacement_DoesNotRescoreAnExistingViolation()
        {
            Place(EmployeeId, TestFixtures.PlainEmployee(), new Vector2Int(0, 0), orientation: 2);
            _hr.RecalculateArrangementViolations();
            Assert.AreEqual(15, _hr.TotalScore);

            // Somewhere else entirely, touching nothing.
            Place(PrinterId, TestFixtures.PlainHeavyEquipment(), new Vector2Int(3, 3));
            _hr.RecalculateArrangementViolations();

            Assert.AreEqual(15, _hr.TotalScore,
                "An unrelated placement must not re-charge the standing violation.");
        }

        // 6
        [Test]
        public void ArrangementViolation_DisappearsAfterUndo()
        {
            Place(EmployeeId, TestFixtures.PlainEmployee(), new Vector2Int(0, 0), orientation: 2);
            _hr.RecalculateArrangementViolations();
            Assert.AreEqual(15, _hr.TotalScore);

            Remove(EmployeeId);
            _hr.HandleUndo();

            Assert.AreEqual(0, _hr.TotalScore, "Undoing the offending item must refund its violation.");
            Assert.IsEmpty(_hr.ActiveArrangementViolations);
        }

        [Test]
        public void RelationshipViolation_DisappearsWhenTheNeighbourIsRemoved()
        {
            Place(InternId, TestFixtures.PlainIntern(), new Vector2Int(0, 0));
            Place(CeoId, TestFixtures.PlainCeo(), new Vector2Int(1, 0));
            _hr.RecalculateArrangementViolations();
            Assert.AreEqual(10, _hr.TotalScore);

            Remove(CeoId);
            _hr.RecalculateArrangementViolations();

            Assert.AreEqual(0, _hr.TotalScore, "Removing the violating neighbour clears the violation.");
        }

        // 7
        [Test]
        public void ArrangementViolation_DisappearsAfterCorrectiveRotation()
        {
            FakePlacedItem employee = Place(EmployeeId, TestFixtures.PlainEmployee(), new Vector2Int(0, 0), orientation: 2);
            _hr.RecalculateArrangementViolations();
            Assert.AreEqual(15, _hr.TotalScore);

            employee.Orientation = 0;
            _hr.RecalculateArrangementViolations();

            Assert.AreEqual(0, _hr.TotalScore, "Rotating back upright must clear the orientation violation.");
        }

        [Test]
        public void MovingTheSubject_RetiresTheOldViolationKey()
        {
            Place(EmployeeId, TestFixtures.PlainEmployee(), new Vector2Int(0, 0), orientation: 2);
            _hr.RecalculateArrangementViolations();
            string firstKey = _hr.ActiveArrangementViolations.First().Key;

            Remove(EmployeeId);
            Place(EmployeeId, TestFixtures.PlainEmployee(), new Vector2Int(2, 2), orientation: 2);
            _hr.RecalculateArrangementViolations();

            Assert.AreEqual(1, _hr.ActiveArrangementViolations.Count,
                "The moved item holds exactly one violation, not two.");
            Assert.AreNotEqual(firstKey, _hr.ActiveArrangementViolations.First().Key,
                "Grid position is part of the key, so moving must mint a new one.");
            Assert.AreEqual(15, _hr.TotalScore);
        }

        // 9
        [Test]
        public void Restart_ClearsEveryActiveViolationAndScore()
        {
            Place(EmployeeId, TestFixtures.PlainEmployee(), new Vector2Int(0, 0), orientation: 2);
            Place(InternId, TestFixtures.PlainIntern(), new Vector2Int(2, 0));
            Place(CeoId, TestFixtures.PlainCeo(), new Vector2Int(3, 0));
            _hr.RecalculateArrangementViolations();
            Assert.Greater(_hr.TotalScore, 0);

            _hr.ResetAll();

            Assert.AreEqual(0, _hr.TotalScore);
            Assert.AreEqual(0, _hr.ActionScore);
            Assert.AreEqual(0, _hr.ArrangementScore);
            Assert.IsEmpty(_hr.ActiveArrangementViolations);
            Assert.IsEmpty(_hr.ActionViolations);
            Assert.IsNull(_hr.NewestViolation);
        }

        // 10
        [Test]
        public void DisabledHR_CalculatesNoViolations()
        {
            _hr.HREnabled = false;

            Place(EmployeeId, TestFixtures.PlainEmployee(), new Vector2Int(0, 0), orientation: 2);
            Place(InternId, TestFixtures.PlainIntern(), new Vector2Int(2, 0));
            Place(CeoId, TestFixtures.PlainCeo(), new Vector2Int(3, 0));

            _hr.RecalculateArrangementViolations();
            _hr.RegisterAction(HRTrigger.OnInvalidDrop, EmployeeId, TestFixtures.PlainEmployee());

            Assert.AreEqual(0, _hr.TotalScore, "A level with HR disabled must never accumulate score.");
            Assert.IsEmpty(_hr.ActiveArrangementViolations);
        }

        // ---- Action violations and thresholds ----

        [Test]
        public void ActionViolation_ScoresEachOccurrenceAndSurvivesUndo()
        {
            var actionRule = new HRViolationDefinition
            {
                id = "repeated_invalid_employee_drop",
                category = nameof(HRViolationCategory.Action),
                trigger = nameof(HRTrigger.OnInvalidDrop),
                score = 5,
                persistent = false,
                message = "Please stop dropping personnel.",
                repeatThreshold = 1,
                condition = new HRCondition
                {
                    kind = nameof(HRConditionKind.PlayerAction),
                    subjectTags = new[] { "human" }
                }
            };

            HRViolationManager manager = TestFixtures.CreateHRManager(
                _grid, _registry, new List<HRViolationDefinition> { actionRule });

            OfficeItemDefinition employee = TestFixtures.PlainEmployee();

            manager.RegisterAction(HRTrigger.OnInvalidDrop, EmployeeId, employee);
            manager.RegisterAction(HRTrigger.OnInvalidDrop, EmployeeId, employee);

            Assert.AreEqual(10, manager.TotalScore, "Each invalid drop scores separately.");

            manager.HandleUndo();
            Assert.AreEqual(10, manager.TotalScore,
                "Action violations persist through undo unless the level opts out.");

            TestFixtures.Destroy(manager);
        }

        [Test]
        public void ActionRuleWithRepeatThreshold_OnlyScoresAfterTheThreshold()
        {
            var actionRule = new HRViolationDefinition
            {
                id = "repeated_invalid_employee_drop",
                category = nameof(HRViolationCategory.Action),
                trigger = nameof(HRTrigger.OnInvalidDrop),
                score = 5,
                persistent = false,
                message = "Please stop dropping personnel.",
                repeatThreshold = 3,
                condition = new HRCondition
                {
                    kind = nameof(HRConditionKind.PlayerAction),
                    subjectTags = new[] { "human" }
                }
            };

            HRViolationManager manager = TestFixtures.CreateHRManager(
                _grid, _registry, new List<HRViolationDefinition> { actionRule });

            OfficeItemDefinition employee = TestFixtures.PlainEmployee();

            manager.RegisterAction(HRTrigger.OnInvalidDrop, EmployeeId, employee);
            Assert.AreEqual(0, manager.TotalScore, "One slip is not yet 'repeated'.");
            manager.RegisterAction(HRTrigger.OnInvalidDrop, EmployeeId, employee);
            Assert.AreEqual(0, manager.TotalScore);
            manager.RegisterAction(HRTrigger.OnInvalidDrop, EmployeeId, employee);
            Assert.AreEqual(5, manager.TotalScore, "The third occurrence crosses the threshold.");

            TestFixtures.Destroy(manager);
        }

        [Test]
        public void FailureLimit_FiresOnceWhenTheScoreReachesIt()
        {
            HRViolationManager manager = TestFixtures.CreateHRManager(
                _grid, _registry, TestFixtures.AllInitialRules(), warning: 10, failure: 25);

            int failureCount = 0;
            manager.FailureTriggered += _ => failureCount++;

            // 25 points in one shot: employee under heavy equipment.
            Place(EmployeeId, TestFixtures.PlainEmployee(), new Vector2Int(1, 0));
            Place(PrinterId, TestFixtures.PlainHeavyEquipment(), new Vector2Int(1, 1));

            manager.RecalculateArrangementViolations();
            manager.RecalculateArrangementViolations();

            Assert.AreEqual(25, manager.TotalScore);
            Assert.AreEqual(1, failureCount, "The failure sequence must trigger exactly once.");

            TestFixtures.Destroy(manager);
        }

        [Test]
        public void EveryActiveViolation_ExplainsItsRule()
        {
            Place(EmployeeId, TestFixtures.PlainEmployee(), new Vector2Int(0, 0), orientation: 2);
            _hr.RecalculateArrangementViolations();

            List<string> explanations = _hr.DescribeActiveViolations().ToList();

            Assert.AreEqual(1, explanations.Count);
            StringAssert.Contains("employee_upside_down", explanations[0]);
            StringAssert.Contains("Employees must remain reasonably upright.", explanations[0]);
        }
    }
}
