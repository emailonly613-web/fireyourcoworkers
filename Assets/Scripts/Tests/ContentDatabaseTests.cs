using System.Collections.Generic;
using System.Linq;
using CorporateTetris.Data;
using CorporateTetris.Items;
using NUnit.Framework;
using UnityEngine;

namespace CorporateTetris.Tests
{
    public class ContentDatabaseTests
    {
        const string MinimalValidJson = @"{
          ""schemaVersion"": 1,
          ""characters"": [
            {
              ""id"": ""a"",
              ""displayName"": ""A"",
              ""category"": ""coworker"",
              ""prefabAddress"": ""OfficeItems/A"",
              ""shape"": [[1],[1]]
            }
          ],
          ""levels"": [
            {
              ""id"": ""l1"",
              ""displayName"": ""L1"",
              ""gridWidth"": 1,
              ""gridHeight"": 2,
              ""requiredCharacterIds"": [""a""]
            }
          ]
        }";

        static List<ContentProblem> ParseProblems(string json)
        {
            ContentDatabaseLoader.TryParse(json, out _, out List<ContentProblem> problems, out _);
            return problems;
        }

        static bool HasErrorContaining(IEnumerable<ContentProblem> problems, string fragment)
        {
            return problems.Any(p => p.Severity == ContentProblemSeverity.Error && p.Message.Contains(fragment));
        }

        [Test]
        public void ValidContent_ParsesWithNoProblems()
        {
            bool ok = ContentDatabaseLoader.TryParse(MinimalValidJson, out ContentDatabase database, out List<ContentProblem> problems, out string error);

            Assert.IsTrue(ok, error);
            Assert.AreEqual(0, ContentDatabaseLoader.CountErrors(problems),
                "Unexpected errors: " + string.Join("; ", problems.Select(p => p.Message)));
            Assert.AreEqual(1, database.CharacterCount);
            Assert.AreEqual(1, database.LevelCount);
        }

        [Test]
        public void MalformedJson_IsRejectedWithoutThrowing()
        {
            bool ok = ContentDatabaseLoader.TryParse("{ this is not json", out _, out List<ContentProblem> problems, out string error);

            Assert.IsFalse(ok);
            Assert.IsNotNull(error);
            Assert.Greater(ContentDatabaseLoader.CountErrors(problems), 0);
        }

        [Test]
        public void EmptyJson_IsRejected()
        {
            Assert.IsFalse(ContentDatabaseLoader.TryParse("", out _, out _, out _));
            Assert.IsFalse(ContentDatabaseLoader.TryParse("   ", out _, out _, out _));
        }

        [Test]
        public void DuplicateCharacterIds_AreReported()
        {
            string json = MinimalValidJson.Replace(
                @"""levels"": [",
                @"""levelsPlaceholder"": [], ""levels"": [")
                .Replace(
                @"""shape"": [[1],[1]]
            }
          ],",
                @"""shape"": [[1],[1]]
            },
            {
              ""id"": ""a"",
              ""displayName"": ""A duplicate"",
              ""category"": ""coworker"",
              ""prefabAddress"": ""OfficeItems/A2"",
              ""shape"": [[1]]
            }
          ],");

            Assert.IsTrue(HasErrorContaining(ParseProblems(json), "Duplicate character id 'a'"));
        }

        [Test]
        public void LevelReferencingUnknownCharacter_IsReported()
        {
            string json = MinimalValidJson.Replace(@"""requiredCharacterIds"": [""a""]", @"""requiredCharacterIds"": [""ghost""]");

            Assert.IsTrue(HasErrorContaining(ParseProblems(json), "unknown character 'ghost'"));
        }

        [Test]
        public void EmptyShape_IsReported()
        {
            string json = MinimalValidJson.Replace(@"""shape"": [[1],[1]]", @"""shape"": []");

            Assert.IsTrue(HasErrorContaining(ParseProblems(json), "empty shape"));
        }

        [Test]
        public void AllZeroShape_IsReported()
        {
            string json = MinimalValidJson.Replace(@"""shape"": [[1],[1]]", @"""shape"": [[0],[0]]");

            Assert.IsTrue(HasErrorContaining(ParseProblems(json), "no filled cells"));
        }

        [Test]
        public void RaggedShape_IsReported()
        {
            string json = MinimalValidJson.Replace(@"""shape"": [[1],[1]]", @"""shape"": [[1,1],[1]]");

            Assert.IsTrue(HasErrorContaining(ParseProblems(json), "ragged"));
        }

        [Test]
        public void ShapeWithValuesOtherThanZeroOrOne_IsReported()
        {
            string json = MinimalValidJson.Replace(@"""shape"": [[1],[1]]", @"""shape"": [[2],[1]]");

            Assert.IsTrue(HasErrorContaining(ParseProblems(json), "only 0 or 1 are valid"));
        }

        [Test]
        public void MissingPrefabAddress_IsReported()
        {
            string json = MinimalValidJson.Replace(@"""prefabAddress"": ""OfficeItems/A"",", string.Empty);

            Assert.IsTrue(HasErrorContaining(ParseProblems(json), "no prefabAddress"));
        }

        [Test]
        public void LevelWhosePiecesCannotFillTheElevator_IsReportedAsUnsolvable()
        {
            // Two cells of character, but a 1x3 elevator needs three.
            string json = MinimalValidJson.Replace(@"""gridHeight"": 2", @"""gridHeight"": 3");

            Assert.IsTrue(HasErrorContaining(ParseProblems(json), "unsolvable"),
                "Completion requires every required cell to be occupied, so a mismatch is fatal.");
        }

        // ---- Shape conversion ----

        [Test]
        public void ShapeRows_ConvertTopDownToBottomUpCells()
        {
            // Row 0 is the TOP, so it must map to the highest y.
            int[][] rows =
            {
                new[] { 1, 1, 1 },
                new[] { 0, 1, 0 }
            };

            Vector2Int[] cells = OfficeItemDefinition.BuildShapeCells(rows);

            CollectionAssert.AreEquivalent(
                new[]
                {
                    new Vector2Int(0, 1),
                    new Vector2Int(1, 1),
                    new Vector2Int(2, 1),
                    new Vector2Int(1, 0)
                },
                cells,
                "The CEO's T must sit bar-up, stem-down.");
        }

        [Test]
        public void ShapeRows_AreNormalizedToOrigin()
        {
            int[][] rows =
            {
                new[] { 0, 1 },
                new[] { 0, 1 }
            };

            Vector2Int[] cells = OfficeItemDefinition.BuildShapeCells(rows);

            Assert.AreEqual(0, cells.Min(c => c.x), "Shapes must be normalized so minimum x is 0.");
            Assert.AreEqual(0, cells.Min(c => c.y), "Shapes must be normalized so minimum y is 0.");
            Assert.AreEqual(2, cells.Length);
        }

        [Test]
        public void SleepingInternShape_IsAVerticalTriomino()
        {
            Vector2Int[] cells = OfficeItemDefinition.BuildShapeCells(TestFixtures.VerticalTriRows());

            Assert.AreEqual(3, cells.Length);
            Assert.IsTrue(cells.All(c => c.x == 0), "A 1-wide column stays 1 wide.");
        }

        // ---- Tag derivation ----

        [Test]
        public void ExplicitTags_TakePrecedenceOverDerivedOnes()
        {
            OfficeItemDefinition intern = TestFixtures.PlainIntern();

            Assert.IsTrue(intern.HasTag("intern"));
            Assert.IsTrue(intern.HasTag("employee"));
            Assert.IsFalse(intern.HasTag("management"));
        }

        [Test]
        public void MissingTags_AreDerivedFromCategoryAndWeightClass()
        {
            var executive = new OfficeItemDefinition
            {
                id = "exec",
                category = "executive",
                weightClass = "medium",
                prefabAddress = "x",
                shape = TestFixtures.SingleCellRows()
            };

            var heavyEquipment = new OfficeItemDefinition
            {
                id = "machine",
                category = "equipment",
                weightClass = "heavy",
                prefabAddress = "x",
                shape = TestFixtures.SingleCellRows()
            };

            Assert.IsTrue(executive.HasTag("human"));
            Assert.IsTrue(executive.HasTag("employee"));
            Assert.IsTrue(executive.HasTag("management"));

            Assert.IsTrue(heavyEquipment.HasTag("equipment"));
            Assert.IsTrue(heavyEquipment.HasTag("heavy_equipment"));
            Assert.IsFalse(heavyEquipment.HasTag("human"));
        }

        [Test]
        public void EquipmentDefaults_HaveNoFaceAndDeformRigidly()
        {
            var machine = new OfficeItemDefinition
            {
                id = "machine",
                category = "equipment",
                weightClass = "heavy",
                prefabAddress = "x",
                shape = TestFixtures.SquareRows()
            };

            Assert.AreEqual(DeformationStyle.RigidEquipment, machine.ResolveDeformationStyle());
            Assert.IsFalse(machine.ResolveSquishProfile().supportsFaceCompression);
            Assert.IsTrue(machine.ResolveHRProperties().canBeUpsideDown,
                "Only humans are required to stay upright.");
        }
    }
}
