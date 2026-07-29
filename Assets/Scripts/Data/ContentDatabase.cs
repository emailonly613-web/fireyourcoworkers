using System;
using System.Collections.Generic;
using CorporateTetris.HR;
using CorporateTetris.Items;
using UnityEngine;

namespace CorporateTetris.Data
{
    public enum ContentProblemSeverity
    {
        Warning,
        Error
    }

    public readonly struct ContentProblem
    {
        public readonly ContentProblemSeverity Severity;
        public readonly string Message;

        public ContentProblem(ContentProblemSeverity severity, string message)
        {
            Severity = severity;
            Message = message;
        }

        public override string ToString() => $"[{Severity}] {Message}";
    }

    /// <summary>
    /// The whole content set. Plain data with no Unity object references, so the same JSON can
    /// back a non-Unity client without a rewrite.
    /// </summary>
    [Serializable]
    public class ContentDatabase
    {
        public int schemaVersion = 1;
        public OfficeItemDefinition[] characters = Array.Empty<OfficeItemDefinition>();
        public LevelDefinition[] levels = Array.Empty<LevelDefinition>();

        /// <summary>Schema extension: HR rules live with the content they judge.</summary>
        public HRViolationDefinition[] hrRules = Array.Empty<HRViolationDefinition>();

        Dictionary<string, OfficeItemDefinition> _charactersById;
        Dictionary<string, LevelDefinition> _levelsById;

        public int LevelCount => levels?.Length ?? 0;
        public int CharacterCount => characters?.Length ?? 0;

        public void BuildIndex()
        {
            _charactersById = new Dictionary<string, OfficeItemDefinition>(StringComparer.OrdinalIgnoreCase);
            _levelsById = new Dictionary<string, LevelDefinition>(StringComparer.OrdinalIgnoreCase);

            if (characters != null)
            {
                for (int i = 0; i < characters.Length; i++)
                {
                    OfficeItemDefinition character = characters[i];
                    if (character == null || string.IsNullOrEmpty(character.id))
                    {
                        continue;
                    }

                    character.InvalidateCaches();
                    _charactersById[character.id] = character;
                }
            }

            if (levels != null)
            {
                for (int i = 0; i < levels.Length; i++)
                {
                    if (levels[i] != null && !string.IsNullOrEmpty(levels[i].id))
                    {
                        _levelsById[levels[i].id] = levels[i];
                    }
                }
            }
        }

        public bool TryGetItem(string id, out OfficeItemDefinition definition)
        {
            if (_charactersById == null)
            {
                BuildIndex();
            }

            definition = null;
            return !string.IsNullOrEmpty(id) && _charactersById.TryGetValue(id, out definition);
        }

        public bool TryGetLevel(string id, out LevelDefinition level)
        {
            if (_levelsById == null)
            {
                BuildIndex();
            }

            level = null;
            return !string.IsNullOrEmpty(id) && _levelsById.TryGetValue(id, out level);
        }

        public LevelDefinition GetLevelByIndex(int index)
        {
            if (levels == null || index < 0 || index >= levels.Length)
            {
                return null;
            }

            return levels[index];
        }

        /// <summary>
        /// Every structural problem the spec requires the loader to catch, returned rather than
        /// thrown so bad content degrades to a readable console list instead of a crash.
        /// </summary>
        public List<ContentProblem> Validate()
        {
            var problems = new List<ContentProblem>();

            if (characters == null || characters.Length == 0)
            {
                problems.Add(new ContentProblem(ContentProblemSeverity.Error, "Content database contains no characters."));
            }

            if (levels == null || levels.Length == 0)
            {
                problems.Add(new ContentProblem(ContentProblemSeverity.Error, "Content database contains no levels."));
            }

            ValidateCharacters(problems);
            BuildIndex();
            ValidateLevels(problems);

            return problems;
        }

        void ValidateCharacters(List<ContentProblem> problems)
        {
            if (characters == null)
            {
                return;
            }

            var seenIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            for (int i = 0; i < characters.Length; i++)
            {
                OfficeItemDefinition character = characters[i];

                if (character == null)
                {
                    problems.Add(new ContentProblem(ContentProblemSeverity.Error, $"characters[{i}] is null."));
                    continue;
                }

                if (string.IsNullOrEmpty(character.id))
                {
                    problems.Add(new ContentProblem(ContentProblemSeverity.Error, $"characters[{i}] has no id."));
                }
                else if (!seenIds.Add(character.id))
                {
                    problems.Add(new ContentProblem(ContentProblemSeverity.Error,
                        $"Duplicate character id '{character.id}'."));
                }

                if (string.IsNullOrEmpty(character.prefabAddress))
                {
                    problems.Add(new ContentProblem(ContentProblemSeverity.Error,
                        $"Character '{character.id}' has no prefabAddress."));
                }

                ValidateShape(character, problems);
            }
        }

        static void ValidateShape(OfficeItemDefinition character, List<ContentProblem> problems)
        {
            if (character.shape == null || character.shape.Length == 0)
            {
                problems.Add(new ContentProblem(ContentProblemSeverity.Error,
                    $"Character '{character.id}' has an empty shape."));
                return;
            }

            int expectedWidth = -1;

            for (int r = 0; r < character.shape.Length; r++)
            {
                int[] row = character.shape[r];

                if (row == null || row.Length == 0)
                {
                    problems.Add(new ContentProblem(ContentProblemSeverity.Error,
                        $"Character '{character.id}' shape row {r} is empty."));
                    return;
                }

                if (expectedWidth < 0)
                {
                    expectedWidth = row.Length;
                }
                else if (row.Length != expectedWidth)
                {
                    problems.Add(new ContentProblem(ContentProblemSeverity.Error,
                        $"Character '{character.id}' shape is ragged: row {r} has {row.Length} columns, expected {expectedWidth}."));
                    return;
                }

                for (int c = 0; c < row.Length; c++)
                {
                    if (row[c] != 0 && row[c] != 1)
                    {
                        problems.Add(new ContentProblem(ContentProblemSeverity.Error,
                            $"Character '{character.id}' shape cell [{r},{c}] is {row[c]}; only 0 or 1 are valid."));
                        return;
                    }
                }
            }

            if (character.ShapeCells.Length == 0)
            {
                problems.Add(new ContentProblem(ContentProblemSeverity.Error,
                    $"Character '{character.id}' shape contains no filled cells."));
            }
        }

        void ValidateLevels(List<ContentProblem> problems)
        {
            if (levels == null)
            {
                return;
            }

            var seenIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            for (int i = 0; i < levels.Length; i++)
            {
                LevelDefinition level = levels[i];

                if (level == null)
                {
                    problems.Add(new ContentProblem(ContentProblemSeverity.Error, $"levels[{i}] is null."));
                    continue;
                }

                if (string.IsNullOrEmpty(level.id))
                {
                    problems.Add(new ContentProblem(ContentProblemSeverity.Error, $"levels[{i}] has no id."));
                }
                else if (!seenIds.Add(level.id))
                {
                    problems.Add(new ContentProblem(ContentProblemSeverity.Error, $"Duplicate level id '{level.id}'."));
                }

                if (level.gridWidth <= 0 || level.gridHeight <= 0)
                {
                    problems.Add(new ContentProblem(ContentProblemSeverity.Error,
                        $"Level '{level.id}' has a non-positive grid ({level.gridWidth}x{level.gridHeight})."));
                    continue;
                }

                if (level.requiredCharacterIds == null || level.requiredCharacterIds.Length == 0)
                {
                    problems.Add(new ContentProblem(ContentProblemSeverity.Error,
                        $"Level '{level.id}' spawns no characters."));
                    continue;
                }

                int totalItemCells = 0;

                for (int j = 0; j < level.requiredCharacterIds.Length; j++)
                {
                    string characterId = level.requiredCharacterIds[j];

                    if (!TryGetItem(characterId, out OfficeItemDefinition character))
                    {
                        problems.Add(new ContentProblem(ContentProblemSeverity.Error,
                            $"Level '{level.id}' references unknown character '{characterId}'."));
                        continue;
                    }

                    totalItemCells += character.ShapeCells.Length;
                }

                // A level whose pieces cannot exactly tile the interior can never be completed,
                // because completion requires every required cell to be occupied.
                int requiredCells = level.RequiredCellCount;
                if (totalItemCells != requiredCells)
                {
                    problems.Add(new ContentProblem(ContentProblemSeverity.Error,
                        $"Level '{level.id}' is unsolvable: its characters cover {totalItemCells} cells " +
                        $"but the elevator requires {requiredCells} " +
                        $"({level.gridWidth}x{level.gridHeight} minus {level.blockedCells?.Length ?? 0} blocked). " +
                        "Completion demands every required cell be occupied."));
                }
            }
        }
    }
}
