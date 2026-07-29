using System;
using System.Collections;
using System.Collections.Generic;
using CorporateTetris.Data;
using CorporateTetris.HR;
using CorporateTetris.Items;
using CorporateTetris.Presentation;
using UnityEngine;

namespace CorporateTetris.Core
{
    /// <summary>
    /// Runs one level: load definition, build grid, fill the tray, arbitrate placement, track
    /// undo, and decide completion. It is also the registry HR reads placed items from.
    /// </summary>
    public class LevelManager : MonoBehaviour, IPlacedItemRegistry
    {
        [SerializeField] GridManager grid;
        [SerializeField] OfficeItemSpawner spawner;
        [SerializeField] GameStateManager gameState;
        [SerializeField] HRViolationManager hrManager;
        [SerializeField] ContentDatabaseLoader contentLoader;
        [SerializeField] HumorAudioController humorAudio;
        [SerializeField] int startingLevelIndex;

        readonly Dictionary<int, OfficeItem> _itemsById = new Dictionary<int, OfficeItem>();
        readonly List<int> _placedOrder = new List<int>();
        readonly List<int> _placedIds = new List<int>();

        ContentDatabase _database;
        LevelDefinition _level;
        int _levelIndex;
        int _requiredItemCount;

        public LevelDefinition CurrentLevel => _level;
        public GridManager Grid => grid;
        public int PlacedCount => _placedOrder.Count;
        public int RequiredItemCount => _requiredItemCount;
        public bool CanUndo => _placedOrder.Count > 0;
        public IReadOnlyList<OfficeItem> Items => spawner != null ? spawner.Spawned : Array.Empty<OfficeItem>();

        public event Action<LevelDefinition> LevelLoaded;
        public event Action<OfficeItem> ItemPlaced;
        public event Action<OfficeItem> ItemUndone;
        public event Action LevelCompleted;

        // IPlacedItemRegistry
        public IReadOnlyList<int> PlacedItemIds => _placedIds;

        public bool TryGetPlacedItem(int itemId, out IPlacedItemView item)
        {
            if (_itemsById.TryGetValue(itemId, out OfficeItem officeItem) && officeItem.IsPlaced)
            {
                item = officeItem;
                return true;
            }

            item = null;
            return false;
        }

        IEnumerator Start()
        {
            if (contentLoader == null)
            {
                Debug.LogError("[LevelManager] No ContentDatabaseLoader assigned.", this);
                yield break;
            }

            gameState?.MarkLoading();

            yield return contentLoader.LoadRoutine();

            if (!contentLoader.IsLoaded)
            {
                Debug.LogError("[LevelManager] Content database failed to load; level not started.", this);
                yield break;
            }

            contentLoader.LogProblemsIfAny();
            _database = contentLoader.Database;
            LoadLevelByIndex(startingLevelIndex);
        }

        public void LoadLevelByIndex(int index)
        {
            if (_database == null)
            {
                return;
            }

            LevelDefinition level = _database.GetLevelByIndex(index);
            if (level == null)
            {
                Debug.LogWarning($"[LevelManager] No level at index {index}.", this);
                return;
            }

            _levelIndex = index;
            LoadLevel(level);
        }

        public void LoadLevel(LevelDefinition level)
        {
            _level = level ?? throw new ArgumentNullException(nameof(level));

            gameState?.MarkLoading();

            grid.Initialize(level.gridWidth, level.gridHeight, level.cellSize, level.blockedCells);

            _itemsById.Clear();
            _placedOrder.Clear();
            _placedIds.Clear();

            humorAudio?.ResetCooldowns();

            List<OfficeItem> spawned = spawner.SpawnForLevel(level, _database, level.cellSize);
            for (int i = 0; i < spawned.Count; i++)
            {
                _itemsById[spawned[i].ItemId] = spawned[i];
                humorAudio?.Subscribe(spawned[i]);
            }

            _requiredItemCount = spawned.Count;

            hrManager?.Configure(
                grid,
                this,
                _database.hrRules,
                level.hrWarningThreshold,
                level.hrFailureLimit,
                level.clearActionViolationsOnUndo,
                level.hrEnabled);

            if (hrManager != null)
            {
                hrManager.FailureTriggered -= HandleHRFailure;
                hrManager.FailureTriggered += HandleHRFailure;
            }

            gameState?.MarkPlaying();
            LevelLoaded?.Invoke(level);
        }

        /// <summary>
        /// The one place a placement is decided. The grid validates and commits atomically; only
        /// after it succeeds does anything cosmetic happen.
        /// </summary>
        public bool TryPlace(OfficeItem item, Vector2Int anchor)
        {
            if (item == null || _level == null || gameState != null && !gameState.AcceptsInput)
            {
                return false;
            }

            PlacementResult result = grid.TryOccupy(item.ItemId, item.CurrentShape, anchor);

            if (!result.Success)
            {
                item.RejectDrop();
                item.ReturnToTray();
                hrManager?.RegisterAction(HRTrigger.OnInvalidDrop, item.ItemId, item.Definition);
                return false;
            }

            item.LockAt(grid, anchor);
            _placedOrder.Add(item.ItemId);
            _placedIds.Add(item.ItemId);

            hrManager?.RegisterAction(HRTrigger.OnValidDrop, item.ItemId, item.Definition);
            hrManager?.RecalculateArrangementViolations();

            RefreshSettledPressure();
            ItemPlaced?.Invoke(item);
            CheckCompletion();
            return true;
        }

        /// <summary>Reverses the most recent successful placement.</summary>
        public bool Undo()
        {
            if (_placedOrder.Count == 0)
            {
                return false;
            }

            int itemId = _placedOrder[_placedOrder.Count - 1];
            _placedOrder.RemoveAt(_placedOrder.Count - 1);
            _placedIds.Remove(itemId);

            grid.ClearItem(itemId);

            if (_itemsById.TryGetValue(itemId, out OfficeItem item))
            {
                item.Unlock();
                item.ReturnToTray();
                ItemUndone?.Invoke(item);
            }

            hrManager?.HandleUndo();
            RefreshSettledPressure();

            if (gameState != null && gameState.State == GameState.LevelComplete)
            {
                gameState.MarkPlaying();
            }

            return true;
        }

        /// <summary>
        /// Recomputes cosmetic pressure for every placed item from the settled arrangement, so a
        /// newly landed neighbour squeezes the pieces already in the elevator.
        /// </summary>
        void RefreshSettledPressure()
        {
            for (int i = 0; i < _placedIds.Count; i++)
            {
                if (!_itemsById.TryGetValue(_placedIds[i], out OfficeItem item))
                {
                    continue;
                }

                ContactPressure pressure = ContactSquishResolver.Resolve(grid, item.ItemId, grid.GetCellsForItem(item.ItemId));
                item.ApplySettledPressure(pressure);
            }
        }

        void CheckCompletion()
        {
            hrManager?.RecalculateArrangementViolations();

            bool allItemsPlaced = _placedOrder.Count >= _requiredItemCount && _requiredItemCount > 0;
            if (!allItemsPlaced || !grid.IsElevatorFull)
            {
                return;
            }

            gameState?.MarkLevelComplete();

            for (int i = 0; i < _placedIds.Count; i++)
            {
                if (_itemsById.TryGetValue(_placedIds[i], out OfficeItem item))
                {
                    item.RaiseLevelComplete();
                }
            }

            LevelCompleted?.Invoke();
        }

        void HandleHRFailure(int total)
        {
            gameState?.MarkHRFailure();
        }

        public void Restart()
        {
            if (_level != null)
            {
                LoadLevel(_level);
            }
        }

        public void NextLevel()
        {
            if (_database == null)
            {
                return;
            }

            int next = _levelIndex + 1;
            if (next >= _database.LevelCount)
            {
                return;
            }

            LoadLevelByIndex(next);
        }

        public bool HasNextLevel => _database != null && _levelIndex + 1 < _database.LevelCount;

        void OnDestroy()
        {
            if (hrManager != null)
            {
                hrManager.FailureTriggered -= HandleHRFailure;
            }

            foreach (KeyValuePair<int, OfficeItem> pair in _itemsById)
            {
                humorAudio?.Unsubscribe(pair.Value);
            }
        }
    }
}
