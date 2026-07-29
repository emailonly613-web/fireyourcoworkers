using System.Collections.Generic;
using CorporateTetris.Core;
using CorporateTetris.Items;
using UnityEngine;

namespace CorporateTetris.HR
{
    /// <summary>
    /// Turns the current grid arrangement into a set of violations. Pure with respect to game
    /// state: it reads the grid and the item registry and returns results. It holds no score and
    /// no memory, so it can be run as often as needed — deduplication is the manager's job.
    /// </summary>
    public static class HRRuleEvaluator
    {
        /// <summary>
        /// Evaluates every arrangement rule against every placed item.
        /// Subject roles are never inferred symmetrically: an item only becomes the subject of a
        /// rule if it satisfies that rule's own subjectTags. This is what stops
        /// <c>intern_touching_ceo</c> firing with the CEO as the subject.
        /// </summary>
        public static void EvaluateArrangement(
            GridManager grid,
            IPlacedItemRegistry registry,
            IReadOnlyList<HRViolationDefinition> rules,
            List<HRViolationResult> output)
        {
            output.Clear();

            if (grid == null || registry == null || rules == null)
            {
                return;
            }

            IReadOnlyList<int> placed = registry.PlacedItemIds;

            for (int s = 0; s < placed.Count; s++)
            {
                int subjectId = placed[s];

                if (!registry.TryGetPlacedItem(subjectId, out IPlacedItemView subject) || subject.Definition == null)
                {
                    continue;
                }

                if (!grid.IsPlaced(subjectId))
                {
                    continue;
                }

                for (int r = 0; r < rules.Count; r++)
                {
                    HRViolationDefinition rule = rules[r];
                    if (rule == null || rule.condition == null)
                    {
                        continue;
                    }

                    if (rule.ResolveTrigger() != HRTrigger.OnArrangementChanged)
                    {
                        continue;
                    }

                    EvaluateRuleForSubject(grid, registry, rule, subject, output);
                }
            }
        }

        static void EvaluateRuleForSubject(
            GridManager grid,
            IPlacedItemRegistry registry,
            HRViolationDefinition rule,
            IPlacedItemView subject,
            List<HRViolationResult> output)
        {
            HRCondition condition = rule.condition;

            if (!ItemRelationshipEvaluator.MatchesSubject(subject.Definition, condition))
            {
                return;
            }

            Vector2Int anchor = ItemRelationshipEvaluator.GetAnchorCell(grid, subject.ItemId);
            int orientation = ShapeRotationUtility.NormalizeOrientation(subject.Orientation);

            switch (condition.ResolveKind())
            {
                case HRConditionKind.RotatedUpsideDown:
                {
                    if (orientation != 2)
                    {
                        return;
                    }

                    if (condition.respectCanBeUpsideDown && subject.Definition.ResolveHRProperties().canBeUpsideDown)
                    {
                        return;
                    }

                    output.Add(Build(rule, subject.ItemId, HRViolationResult.NoNeighbour, anchor, orientation));
                    return;
                }

                case HRConditionKind.AdjacentTag:
                {
                    List<int> neighbours = ItemRelationshipEvaluator.GetOrthogonalNeighbours(grid, subject.ItemId);
                    AddForTaggedNeighbours(registry, rule, subject, neighbours, anchor, orientation, output);
                    return;
                }

                case HRConditionKind.TagDirectlyAbove:
                {
                    List<int> above = ItemRelationshipEvaluator.GetItemsDirectlyAbove(grid, subject.ItemId);
                    AddForTaggedNeighbours(registry, rule, subject, above, anchor, orientation, output);
                    return;
                }

                case HRConditionKind.TagDirectlyBelow:
                {
                    List<int> below = ItemRelationshipEvaluator.GetItemsDirectlyBelow(grid, subject.ItemId);
                    AddForTaggedNeighbours(registry, rule, subject, below, anchor, orientation, output);
                    return;
                }

                case HRConditionKind.PlayerAction:
                    // Action rules are raised by gameplay, not derived from the board.
                    return;
            }
        }

        static void AddForTaggedNeighbours(
            IPlacedItemRegistry registry,
            HRViolationDefinition rule,
            IPlacedItemView subject,
            List<int> candidates,
            Vector2Int anchor,
            int orientation,
            List<HRViolationResult> output)
        {
            string wanted = rule.condition.neighbourTag;
            if (string.IsNullOrEmpty(wanted))
            {
                return;
            }

            for (int i = 0; i < candidates.Count; i++)
            {
                int neighbourId = candidates[i];
                if (neighbourId == subject.ItemId)
                {
                    continue;
                }

                if (!registry.TryGetPlacedItem(neighbourId, out IPlacedItemView neighbour) || neighbour.Definition == null)
                {
                    continue;
                }

                if (!neighbour.Definition.HasTag(wanted))
                {
                    continue;
                }

                output.Add(Build(rule, subject.ItemId, neighbourId, anchor, orientation));
            }
        }

        static HRViolationResult Build(HRViolationDefinition rule, int subjectId, int neighbourId, Vector2Int anchor, int orientation)
        {
            return new HRViolationResult(
                rule.id,
                rule.ResolveCategory(),
                rule.score,
                rule.message,
                subjectId,
                neighbourId,
                anchor,
                orientation,
                rule.persistent);
        }

        /// <summary>
        /// Builds the result for a player-behaviour rule. The caller supplies the occurrence
        /// count so "repeated" rules only score once the threshold is reached.
        /// </summary>
        public static bool TryEvaluateAction(
            HRViolationDefinition rule,
            OfficeItemDefinition subjectDefinition,
            int subjectItemId,
            HRTrigger trigger,
            int occurrenceCount,
            int sequenceNumber,
            out HRViolationResult result)
        {
            result = default;

            if (rule == null || rule.condition == null || rule.ResolveTrigger() != trigger)
            {
                return false;
            }

            if (rule.persistent)
            {
                return false;
            }

            if (!ItemRelationshipEvaluator.MatchesSubject(subjectDefinition, rule.condition))
            {
                return false;
            }

            if (occurrenceCount < Mathf.Max(1, rule.repeatThreshold))
            {
                return false;
            }

            // Action violations are meant to accumulate, so the key carries a sequence number
            // rather than collapsing onto the arrangement key.
            string key = $"{rule.id}|action|{subjectItemId}|{sequenceNumber}";

            result = new HRViolationResult(
                rule.id,
                rule.ResolveCategory(),
                rule.score,
                rule.message,
                subjectItemId,
                HRViolationResult.NoNeighbour,
                Vector2Int.zero,
                0,
                persistent: false,
                keyOverride: key);

            return true;
        }
    }
}
