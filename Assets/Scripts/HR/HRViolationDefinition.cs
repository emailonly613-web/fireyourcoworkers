using System;
using CorporateTetris.Core;

namespace CorporateTetris.HR
{
    public enum HRViolationCategory
    {
        Orientation,
        Adjacency,
        Position,
        Action,
        CharacterRelationship,
        EquipmentSafety,
        ManagementAbuse,
        AnimalPolicy
    }

    /// <summary>
    /// The shape of an arrangement condition. Adding a rule is a data change; adding a new *kind*
    /// of condition is the only thing that requires code.
    /// </summary>
    public enum HRConditionKind
    {
        /// <summary>Subject is rotated 180 degrees.</summary>
        RotatedUpsideDown,
        /// <summary>An orthogonally adjacent item carries <see cref="HRCondition.neighbourTag"/>.</summary>
        AdjacentTag,
        /// <summary>An item carrying <see cref="HRCondition.neighbourTag"/> sits directly above the subject.</summary>
        TagDirectlyAbove,
        /// <summary>An item carrying <see cref="HRCondition.neighbourTag"/> sits directly below the subject.</summary>
        TagDirectlyBelow,
        /// <summary>Raised by gameplay rather than derived from the grid.</summary>
        PlayerAction
    }

    [Serializable]
    public class HRCondition
    {
        public string kind = nameof(HRConditionKind.RotatedUpsideDown);

        /// <summary>Every tag here must be present on the subject for the rule to apply.</summary>
        public string[] subjectTags = Array.Empty<string>();

        /// <summary>Any tag here on the subject disqualifies it.</summary>
        public string[] subjectExcludeTags = Array.Empty<string>();

        public string neighbourTag;

        /// <summary>
        /// When true an item whose hrProperties.canBeUpsideDown is set is exempt. Rule 1 relies
        /// on this: "the subject does not explicitly allow upside-down placement".
        /// </summary>
        public bool respectCanBeUpsideDown = true;

        public HRConditionKind ResolveKind()
        {
            return Enum.TryParse(kind, true, out HRConditionKind parsed)
                ? parsed
                : HRConditionKind.RotatedUpsideDown;
        }
    }

    [Serializable]
    public class HRViolationDefinition
    {
        public string id;
        public string category = nameof(HRViolationCategory.Orientation);
        public string trigger = nameof(HRTrigger.OnArrangementChanged);
        public int score;

        /// <summary>
        /// Persistent violations live only while their arrangement holds and are deduplicated by
        /// key. Non-persistent (action) violations score once, each time they happen.
        /// </summary>
        public bool persistent = true;

        /// <summary>Player-facing explanation of why HR objected.</summary>
        public string message;

        public HRCondition condition = new HRCondition();

        /// <summary>
        /// For action rules: how many occurrences before it scores. 1 means every occurrence.
        /// Used by "repeated invalid drop" style rules.
        /// </summary>
        public int repeatThreshold = 1;

        public HRViolationCategory ResolveCategory()
        {
            return Enum.TryParse(category, true, out HRViolationCategory parsed)
                ? parsed
                : HRViolationCategory.Orientation;
        }

        public HRTrigger ResolveTrigger()
        {
            return Enum.TryParse(trigger, true, out HRTrigger parsed)
                ? parsed
                : HRTrigger.OnArrangementChanged;
        }
    }
}
