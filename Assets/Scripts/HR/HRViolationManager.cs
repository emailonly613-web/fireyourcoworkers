using System;
using System.Collections.Generic;
using CorporateTetris.Core;
using CorporateTetris.Items;
using UnityEngine;

namespace CorporateTetris.HR
{
    /// <summary>
    /// Owns the HR score. Arrangement violations live in a keyed set that is diffed on every
    /// recalculation, so a violation that is still true is never charged twice and one that has
    /// stopped being true is refunded. Action violations accumulate separately.
    /// </summary>
    public class HRViolationManager : MonoBehaviour
    {
        [SerializeField] GridManager grid;
        [SerializeField] MonoBehaviour registrySource;
        [SerializeField] bool hrEnabled = true;
        [SerializeField] int warningThreshold = 25;
        [SerializeField] int failureLimit = 60;
        [SerializeField] bool clearActionViolationsOnUndo;

        readonly List<HRViolationDefinition> _rules = new List<HRViolationDefinition>();
        readonly Dictionary<string, HRViolationResult> _arrangementViolations = new Dictionary<string, HRViolationResult>();
        readonly List<HRViolationResult> _actionViolations = new List<HRViolationResult>();
        readonly Dictionary<string, int> _actionOccurrences = new Dictionary<string, int>();
        readonly List<HRViolationResult> _scratch = new List<HRViolationResult>();

        IPlacedItemRegistry _registry;
        int _arrangementScore;
        int _actionScore;
        int _sequence;
        bool _warningRaised;
        bool _failureRaised;

        /// <summary>A level may switch HR off entirely; nothing is then evaluated or scored.</summary>
        public bool HREnabled { get => hrEnabled; set => hrEnabled = value; }

        public int TotalScore => _arrangementScore + _actionScore;
        public int ArrangementScore => _arrangementScore;
        public int ActionScore => _actionScore;
        public int WarningThreshold => warningThreshold;
        public int FailureLimit => failureLimit;
        public HRViolationResult? NewestViolation { get; private set; }

        public IReadOnlyCollection<HRViolationResult> ActiveArrangementViolations => _arrangementViolations.Values;
        public IReadOnlyList<HRViolationResult> ActionViolations => _actionViolations;

        public event Action<int> ScoreChanged;
        public event Action<HRViolationResult> ViolationAdded;
        public event Action<HRViolationResult> ViolationRemoved;
        public event Action<int> WarningThresholdReached;
        public event Action<int> FailureTriggered;

        public void Configure(
            GridManager gridManager,
            IPlacedItemRegistry registry,
            IEnumerable<HRViolationDefinition> rules,
            int warning,
            int failure,
            bool clearActionsOnUndo,
            bool enabled = true)
        {
            grid = gridManager;
            _registry = registry;
            warningThreshold = warning;
            failureLimit = failure;
            clearActionViolationsOnUndo = clearActionsOnUndo;
            hrEnabled = enabled;

            _rules.Clear();
            if (rules != null)
            {
                _rules.AddRange(rules);
            }

            ResetAll();
        }

        void Awake()
        {
            if (_registry == null && registrySource is IPlacedItemRegistry fromInspector)
            {
                _registry = fromInspector;
            }
        }

        /// <summary>Wipes every violation and score. Called on level load and restart.</summary>
        public void ResetAll()
        {
            _arrangementViolations.Clear();
            _actionViolations.Clear();
            _actionOccurrences.Clear();
            _arrangementScore = 0;
            _actionScore = 0;
            _sequence = 0;
            _warningRaised = false;
            _failureRaised = false;
            NewestViolation = null;
            ScoreChanged?.Invoke(TotalScore);
        }

        /// <summary>
        /// Re-derives every arrangement violation from the board and reconciles it against what
        /// was already counted. Safe to call as often as you like — that is the whole point.
        /// </summary>
        public void RecalculateArrangementViolations()
        {
            if (!hrEnabled || grid == null || _registry == null)
            {
                return;
            }

            HRRuleEvaluator.EvaluateArrangement(grid, _registry, _rules, _scratch);

            var current = new Dictionary<string, HRViolationResult>(_scratch.Count);
            for (int i = 0; i < _scratch.Count; i++)
            {
                current[_scratch[i].Key] = _scratch[i];
            }

            List<string> removedKeys = null;
            foreach (KeyValuePair<string, HRViolationResult> existing in _arrangementViolations)
            {
                if (!current.ContainsKey(existing.Key))
                {
                    (removedKeys ??= new List<string>()).Add(existing.Key);
                }
            }

            bool changed = false;

            if (removedKeys != null)
            {
                for (int i = 0; i < removedKeys.Count; i++)
                {
                    HRViolationResult gone = _arrangementViolations[removedKeys[i]];
                    _arrangementViolations.Remove(removedKeys[i]);
                    _arrangementScore -= gone.Score;
                    changed = true;
                    ViolationRemoved?.Invoke(gone);
                }
            }

            foreach (KeyValuePair<string, HRViolationResult> candidate in current)
            {
                if (_arrangementViolations.ContainsKey(candidate.Key))
                {
                    continue;
                }

                _arrangementViolations.Add(candidate.Key, candidate.Value);
                _arrangementScore += candidate.Value.Score;
                NewestViolation = candidate.Value;
                changed = true;
                ViolationAdded?.Invoke(candidate.Value);
            }

            if (changed)
            {
                ScoreChanged?.Invoke(TotalScore);
                EvaluateThresholds();
            }
        }

        /// <summary>
        /// Records a player-behaviour violation. Occurrences are counted per rule and item so
        /// "repeated" rules can require several attempts before they cost anything.
        /// </summary>
        public void RegisterAction(HRTrigger trigger, int itemId, OfficeItemDefinition definition)
        {
            if (!hrEnabled || definition == null)
            {
                return;
            }

            bool changed = false;

            for (int i = 0; i < _rules.Count; i++)
            {
                HRViolationDefinition rule = _rules[i];
                if (rule == null || rule.persistent || rule.ResolveTrigger() != trigger)
                {
                    continue;
                }

                if (!ItemRelationshipEvaluator.MatchesSubject(definition, rule.condition))
                {
                    continue;
                }

                string counterKey = $"{rule.id}|{itemId}";
                _actionOccurrences.TryGetValue(counterKey, out int count);
                count++;
                _actionOccurrences[counterKey] = count;

                if (HRRuleEvaluator.TryEvaluateAction(rule, definition, itemId, trigger, count, ++_sequence, out HRViolationResult result))
                {
                    _actionViolations.Add(result);
                    _actionScore += result.Score;
                    NewestViolation = result;
                    changed = true;
                    ViolationAdded?.Invoke(result);
                }
            }

            if (changed)
            {
                ScoreChanged?.Invoke(TotalScore);
                EvaluateThresholds();
            }
        }

        /// <summary>
        /// Called after an undo. Arrangement violations are always re-derived; action violations
        /// persist until restart unless the level definition says otherwise.
        /// </summary>
        public void HandleUndo()
        {
            if (clearActionViolationsOnUndo && _actionViolations.Count > 0)
            {
                for (int i = 0; i < _actionViolations.Count; i++)
                {
                    ViolationRemoved?.Invoke(_actionViolations[i]);
                }

                _actionViolations.Clear();
                _actionOccurrences.Clear();
                _actionScore = 0;
                ScoreChanged?.Invoke(TotalScore);
            }

            RecalculateArrangementViolations();
        }

        /// <summary>Every rule that produced a currently-active violation, with its explanation.</summary>
        public IEnumerable<string> DescribeActiveViolations()
        {
            foreach (HRViolationResult violation in _arrangementViolations.Values)
            {
                yield return violation.ToString();
            }

            for (int i = 0; i < _actionViolations.Count; i++)
            {
                yield return _actionViolations[i].ToString();
            }
        }

        void EvaluateThresholds()
        {
            int total = TotalScore;

            if (!_failureRaised && failureLimit > 0 && total >= failureLimit)
            {
                _failureRaised = true;
                FailureTriggered?.Invoke(total);
                return;
            }

            if (!_warningRaised && warningThreshold > 0 && total >= warningThreshold)
            {
                _warningRaised = true;
                WarningThresholdReached?.Invoke(total);
            }
            else if (_warningRaised && total < warningThreshold)
            {
                // Dropping back under the threshold re-arms the warning.
                _warningRaised = false;
            }
        }
    }
}
