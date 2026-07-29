using System.Globalization;
using UnityEngine;

namespace CorporateTetris.HR
{
    /// <summary>
    /// One detected violation. <see cref="Key"/> is the stable identity used to stop a persistent
    /// violation being scored more than once while its arrangement is unchanged.
    /// </summary>
    public readonly struct HRViolationResult
    {
        public readonly string RuleId;
        public readonly string Key;
        public readonly HRViolationCategory Category;
        public readonly int Score;
        public readonly string Message;
        public readonly int SubjectItemId;
        public readonly int NeighbourItemId;
        public readonly Vector2Int GridPosition;
        public readonly int Orientation;
        public readonly bool Persistent;

        public const int NoNeighbour = 0;

        public HRViolationResult(
            string ruleId,
            HRViolationCategory category,
            int score,
            string message,
            int subjectItemId,
            int neighbourItemId,
            Vector2Int gridPosition,
            int orientation,
            bool persistent,
            string keyOverride = null)
        {
            RuleId = ruleId;
            Category = category;
            Score = score;
            Message = message;
            SubjectItemId = subjectItemId;
            NeighbourItemId = neighbourItemId;
            GridPosition = gridPosition;
            Orientation = orientation;
            Persistent = persistent;
            Key = keyOverride ?? BuildKey(ruleId, subjectItemId, neighbourItemId, gridPosition, orientation);
        }

        /// <summary>
        /// Rule + subject + neighbour + position + rotation. Because position and rotation are
        /// part of the key, moving or rotating the subject retires the old violation and the
        /// arrangement diff removes it; re-running the evaluator on an unchanged board reproduces
        /// the identical key and scores nothing further.
        /// </summary>
        public static string BuildKey(string ruleId, int subjectItemId, int neighbourItemId, Vector2Int gridPosition, int orientation)
        {
            return string.Concat(
                ruleId, "|",
                subjectItemId.ToString(CultureInfo.InvariantCulture), "|",
                neighbourItemId.ToString(CultureInfo.InvariantCulture), "|",
                gridPosition.x.ToString(CultureInfo.InvariantCulture), ",",
                gridPosition.y.ToString(CultureInfo.InvariantCulture), "|",
                orientation.ToString(CultureInfo.InvariantCulture));
        }

        public override string ToString()
        {
            return $"[{Category}] {RuleId} (+{Score}): {Message}";
        }
    }
}
