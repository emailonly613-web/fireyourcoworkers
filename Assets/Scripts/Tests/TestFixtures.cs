using System.Collections.Generic;
using CorporateTetris.Core;
using CorporateTetris.HR;
using CorporateTetris.Items;
using UnityEngine;

namespace CorporateTetris.Tests
{
    /// <summary>
    /// Shared builders. Everything here constructs plain data or a bare GameObject, so the whole
    /// suite runs in EditMode with no scene, no prefabs and no art.
    /// </summary>
    public static class TestFixtures
    {
        public static GridManager CreateGrid(int width = 6, int height = 8, float cellSize = 1f, IEnumerable<Vector2Int> blocked = null)
        {
            var go = new GameObject("TestGrid");
            GridManager grid = go.AddComponent<GridManager>();
            grid.Initialize(width, height, cellSize, blocked);
            return grid;
        }

        public static void Destroy(Component component)
        {
            if (component != null)
            {
                Object.DestroyImmediate(component.gameObject);
            }
        }

        // ---- Cell-list shapes, for driving GridManager directly ----

        public static Vector2Int[] SingleCell() => new[] { new Vector2Int(0, 0) };

        public static Vector2Int[] Domino() => new[] { new Vector2Int(0, 0), new Vector2Int(1, 0) };

        /// <summary>An L-tromino: asymmetric, so rotation is observable.</summary>
        public static Vector2Int[] LShape() => new[]
        {
            new Vector2Int(0, 0),
            new Vector2Int(0, 1),
            new Vector2Int(1, 0)
        };

        // ---- Row shapes, matching the content schema (first row is the TOP) ----

        public static int[][] SingleCellRows() => new[] { new[] { 1 } };

        public static int[][] DominoRows() => new[] { new[] { 1, 1 } };

        /// <summary>Same L-tromino, authored the way the content file authors it.</summary>
        public static int[][] LShapeRows() => new[]
        {
            new[] { 1, 0 },
            new[] { 1, 1 }
        };

        /// <summary>Vertical 1x3, the Sleeping Intern's real shape.</summary>
        public static int[][] VerticalTriRows() => new[]
        {
            new[] { 1 },
            new[] { 1 },
            new[] { 1 }
        };

        /// <summary>2x2, the Broken Copy Machine's real shape.</summary>
        public static int[][] SquareRows() => new[]
        {
            new[] { 1, 1 },
            new[] { 1, 1 }
        };

        /// <summary>T-tetromino, the Micro-Managing CEO's real shape.</summary>
        public static int[][] TetrominoTRows() => new[]
        {
            new[] { 1, 1, 1 },
            new[] { 0, 1, 0 }
        };

        public static OfficeItemDefinition MakeDefinition(
            string id,
            string[] tags = null,
            int[][] shapeRows = null,
            string category = "coworker",
            string weightClass = "medium",
            bool canBeUpsideDown = false,
            bool supportsFaceCompression = true,
            float maxDeformation = 0.3f)
        {
            var definition = new OfficeItemDefinition
            {
                id = id,
                displayName = id,
                category = category,
                prefabAddress = $"OfficeItems/{id}",
                shape = shapeRows ?? SingleCellRows(),
                allowedRotations = new[] { 0, 90, 180, 270 },
                weightClass = weightClass,
                tags = tags ?? new string[0],
                squishProfile = new SquishProfile
                {
                    enabled = true,
                    wallCompression = 0.18f,
                    itemCompression = 0.12f,
                    invalidImpactSquash = 0.25f,
                    maximumDeformation = maxDeformation,
                    supportsFaceCompression = supportsFaceCompression
                },
                hrProperties = new HRProperties
                {
                    canBeUpsideDown = canBeUpsideDown,
                    isManagement = System.Array.IndexOf(tags ?? new string[0], "management") >= 0,
                    isHeavyEquipment = System.Array.IndexOf(tags ?? new string[0], "heavy_equipment") >= 0
                }
            };

            return definition;
        }

        public static OfficeItemDefinition SleepingIntern() => MakeDefinition(
            "sleeping_intern",
            new[] { "human", "employee", "intern", "sleeping" },
            VerticalTriRows(),
            category: "coworker",
            weightClass: "light");

        public static OfficeItemDefinition MicroManagingCeo() => MakeDefinition(
            "micromanaging_ceo",
            new[] { "human", "employee", "management", "ceo" },
            TetrominoTRows(),
            category: "executive",
            weightClass: "medium",
            maxDeformation: 0.15f);

        public static OfficeItemDefinition BrokenCopyMachine() => MakeDefinition(
            "broken_copy_machine",
            new[] { "equipment", "heavy_equipment", "electrical" },
            SquareRows(),
            category: "equipment",
            weightClass: "heavy",
            canBeUpsideDown: true,
            supportsFaceCompression: false,
            maxDeformation: 0.1f);

        /// <summary>A plain employee with a one-cell shape, for isolating HR orientation rules.</summary>
        public static OfficeItemDefinition PlainEmployee(string id = "employee") => MakeDefinition(
            id,
            new[] { "human", "employee" },
            SingleCellRows());

        public static OfficeItemDefinition PlainIntern(string id = "intern") => MakeDefinition(
            id,
            new[] { "human", "employee", "intern" },
            SingleCellRows());

        public static OfficeItemDefinition PlainCeo(string id = "ceo") => MakeDefinition(
            id,
            new[] { "human", "employee", "management", "ceo" },
            SingleCellRows(),
            category: "executive");

        public static OfficeItemDefinition PlainHeavyEquipment(string id = "printer") => MakeDefinition(
            id,
            new[] { "equipment", "heavy_equipment" },
            SingleCellRows(),
            category: "equipment",
            weightClass: "heavy",
            canBeUpsideDown: true,
            supportsFaceCompression: false);

        public static HRViolationDefinition RuleEmployeeUpsideDown() => new HRViolationDefinition
        {
            id = "employee_upside_down",
            category = nameof(HRViolationCategory.Orientation),
            trigger = nameof(HRTrigger.OnArrangementChanged),
            score = 15,
            persistent = true,
            message = "Employees must remain reasonably upright.",
            condition = new HRCondition
            {
                kind = nameof(HRConditionKind.RotatedUpsideDown),
                subjectTags = new[] { "human", "employee" },
                respectCanBeUpsideDown = true
            }
        };

        public static HRViolationDefinition RuleInternTouchingCeo() => new HRViolationDefinition
        {
            id = "intern_touching_ceo",
            category = nameof(HRViolationCategory.CharacterRelationship),
            trigger = nameof(HRTrigger.OnArrangementChanged),
            score = 10,
            persistent = true,
            message = "The intern has not completed executive-contact training.",
            condition = new HRCondition
            {
                kind = nameof(HRConditionKind.AdjacentTag),
                subjectTags = new[] { "intern" },
                neighbourTag = "management"
            }
        };

        public static HRViolationDefinition RuleEmployeeUnderHeavyEquipment() => new HRViolationDefinition
        {
            id = "employee_under_heavy_equipment",
            category = nameof(HRViolationCategory.EquipmentSafety),
            trigger = nameof(HRTrigger.OnArrangementChanged),
            score = 25,
            persistent = true,
            message = "Heavy office equipment may not be stored above personnel.",
            condition = new HRCondition
            {
                kind = nameof(HRConditionKind.TagDirectlyAbove),
                subjectTags = new[] { "human", "employee" },
                neighbourTag = "heavy_equipment"
            }
        };

        public static List<HRViolationDefinition> AllInitialRules() => new List<HRViolationDefinition>
        {
            RuleEmployeeUpsideDown(),
            RuleInternTouchingCeo(),
            RuleEmployeeUnderHeavyEquipment()
        };

        public static HRViolationManager CreateHRManager(
            GridManager grid,
            IPlacedItemRegistry registry,
            IEnumerable<HRViolationDefinition> rules = null,
            int warning = 25,
            int failure = 60,
            bool clearActionsOnUndo = false)
        {
            var go = new GameObject("TestHRManager");
            HRViolationManager manager = go.AddComponent<HRViolationManager>();
            manager.Configure(grid, registry, rules ?? AllInitialRules(), warning, failure, clearActionsOnUndo);
            return manager;
        }
    }

    public class FakePlacedItem : IPlacedItemView
    {
        public FakePlacedItem(int itemId, OfficeItemDefinition definition, int orientation)
        {
            ItemId = itemId;
            Definition = definition;
            Orientation = orientation;
        }

        public int ItemId { get; }
        public OfficeItemDefinition Definition { get; }
        public int Orientation { get; set; }
    }

    /// <summary>Registry backed by a dictionary so HR can be tested without MonoBehaviours.</summary>
    public class FakeRegistry : IPlacedItemRegistry
    {
        readonly Dictionary<int, FakePlacedItem> _items = new Dictionary<int, FakePlacedItem>();
        readonly List<int> _ids = new List<int>();

        public IReadOnlyList<int> PlacedItemIds => _ids;

        public FakePlacedItem Add(int itemId, OfficeItemDefinition definition, int orientation = 0)
        {
            var item = new FakePlacedItem(itemId, definition, orientation);
            _items[itemId] = item;
            if (!_ids.Contains(itemId))
            {
                _ids.Add(itemId);
            }
            return item;
        }

        public void Remove(int itemId)
        {
            _items.Remove(itemId);
            _ids.Remove(itemId);
        }

        public bool TryGetPlacedItem(int itemId, out IPlacedItemView item)
        {
            if (_items.TryGetValue(itemId, out FakePlacedItem found))
            {
                item = found;
                return true;
            }

            item = null;
            return false;
        }
    }
}
