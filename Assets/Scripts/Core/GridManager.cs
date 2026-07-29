using System;
using System.Collections.Generic;
using UnityEngine;

namespace CorporateTetris.Core
{
    /// <summary>
    /// The authoritative elevator grid. This is the only thing in the project allowed to decide
    /// whether a placement is legal or which cells an item occupies. Presentation code — squish,
    /// faces, animation — reads from it and never writes to it.
    /// </summary>
    public class GridManager : MonoBehaviour
    {
        public const int EmptyCell = 0;

        [SerializeField] int width = 6;
        [SerializeField] int height = 8;
        [SerializeField] float cellSize = 1f;
        [SerializeField] Vector2 originOffset = Vector2.zero;

        [Header("Editor")]
        [SerializeField] bool drawGizmos = true;
        [SerializeField] Color gridColor = new Color(1f, 1f, 1f, 0.25f);
        [SerializeField] Color occupiedColor = new Color(0.2f, 0.8f, 0.4f, 0.35f);
        [SerializeField] Color blockedColor = new Color(0.9f, 0.2f, 0.2f, 0.35f);

        int[] _occupants;
        bool[] _blocked;
        readonly Dictionary<int, List<Vector2Int>> _itemCells = new Dictionary<int, List<Vector2Int>>();
        int _requiredCellCount;
        int _occupiedRequiredCells;
        bool _initialized;

        public int Width => width;
        public int Height => height;
        public float CellSize => cellSize;
        public int RequiredCellCount => _requiredCellCount;
        public int OccupiedRequiredCells => _occupiedRequiredCells;
        public bool IsElevatorFull => _initialized && _occupiedRequiredCells >= _requiredCellCount;

        /// <summary>Raised after any committed change to occupancy. Presentation listens; it never writes.</summary>
        public event Action GridChanged;

        void Awake()
        {
            if (!_initialized)
            {
                Initialize(width, height, cellSize, null);
            }
        }

        public void Initialize(int gridWidth, int gridHeight, float worldCellSize, IEnumerable<Vector2Int> blockedCells)
        {
            if (gridWidth <= 0 || gridHeight <= 0)
            {
                throw new ArgumentException($"Grid dimensions must be positive (got {gridWidth}x{gridHeight}).");
            }

            width = gridWidth;
            height = gridHeight;
            cellSize = worldCellSize;

            _occupants = new int[width * height];
            _blocked = new bool[width * height];
            _itemCells.Clear();
            _occupiedRequiredCells = 0;

            if (blockedCells != null)
            {
                foreach (Vector2Int cell in blockedCells)
                {
                    if (InBounds(cell))
                    {
                        _blocked[Index(cell)] = true;
                    }
                }
            }

            _requiredCellCount = 0;
            for (int i = 0; i < _blocked.Length; i++)
            {
                if (!_blocked[i]) _requiredCellCount++;
            }

            _initialized = true;
            GridChanged?.Invoke();
        }

        public void Clear()
        {
            EnsureInitialized();
            Array.Clear(_occupants, 0, _occupants.Length);
            _itemCells.Clear();
            _occupiedRequiredCells = 0;
            GridChanged?.Invoke();
        }

        int Index(Vector2Int cell) => cell.y * width + cell.x;

        public bool InBounds(Vector2Int cell)
        {
            return cell.x >= 0 && cell.x < width && cell.y >= 0 && cell.y < height;
        }

        public bool IsBlocked(Vector2Int cell)
        {
            EnsureInitialized();
            return !InBounds(cell) || _blocked[Index(cell)];
        }

        public int GetOccupant(Vector2Int cell)
        {
            EnsureInitialized();
            return InBounds(cell) ? _occupants[Index(cell)] : EmptyCell;
        }

        public bool IsOccupied(Vector2Int cell)
        {
            return GetOccupant(cell) != EmptyCell;
        }

        public Vector3 GridToWorld(Vector2Int cell)
        {
            var local = new Vector3(
                originOffset.x + (cell.x + 0.5f) * cellSize,
                originOffset.y + (cell.y + 0.5f) * cellSize,
                0f);
            return transform.TransformPoint(local);
        }

        public Vector2Int WorldToGrid(Vector3 world)
        {
            Vector3 local = transform.InverseTransformPoint(world);
            return new Vector2Int(
                Mathf.FloorToInt((local.x - originOffset.x) / cellSize),
                Mathf.FloorToInt((local.y - originOffset.y) / cellSize));
        }

        /// <summary>
        /// Checks a whole shape without touching occupancy. Returns the absolute cells on success
        /// so callers (preview, placement) do not have to recompute them.
        /// </summary>
        public PlacementResult ValidatePlacement(int itemId, IReadOnlyList<Vector2Int> shapeCells, Vector2Int anchor)
        {
            EnsureInitialized();

            if (shapeCells == null || shapeCells.Count == 0)
            {
                return PlacementResult.Fail(PlacementFailure.NoShape, anchor);
            }

            if (itemId == EmptyCell)
            {
                return PlacementResult.Fail(PlacementFailure.UnknownItem, anchor);
            }

            var absolute = new List<Vector2Int>(shapeCells.Count);
            for (int i = 0; i < shapeCells.Count; i++)
            {
                Vector2Int cell = anchor + shapeCells[i];

                if (!InBounds(cell))
                {
                    return PlacementResult.Fail(PlacementFailure.OutOfBounds, cell);
                }

                int index = Index(cell);

                if (_blocked[index])
                {
                    return PlacementResult.Fail(PlacementFailure.CellBlocked, cell);
                }

                int occupant = _occupants[index];
                if (occupant != EmptyCell && occupant != itemId)
                {
                    return PlacementResult.Fail(PlacementFailure.Overlap, cell, absolute);
                }

                absolute.Add(cell);
            }

            return PlacementResult.Ok(absolute);
        }

        /// <summary>
        /// Validates the complete shape first, then commits. Occupancy is never partially written:
        /// if any cell is invalid the grid is untouched.
        /// </summary>
        public PlacementResult TryOccupy(int itemId, IReadOnlyList<Vector2Int> shapeCells, Vector2Int anchor)
        {
            EnsureInitialized();

            if (_itemCells.ContainsKey(itemId))
            {
                return PlacementResult.Fail(PlacementFailure.ItemAlreadyPlaced, anchor);
            }

            PlacementResult validation = ValidatePlacement(itemId, shapeCells, anchor);
            if (!validation.Success)
            {
                return validation;
            }

            var committed = new List<Vector2Int>(validation.Cells.Count);
            for (int i = 0; i < validation.Cells.Count; i++)
            {
                Vector2Int cell = validation.Cells[i];
                _occupants[Index(cell)] = itemId;
                committed.Add(cell);
                _occupiedRequiredCells++;
            }

            _itemCells[itemId] = committed;
            GridChanged?.Invoke();
            return PlacementResult.Ok(committed);
        }

        public bool ClearItem(int itemId)
        {
            EnsureInitialized();

            if (!_itemCells.TryGetValue(itemId, out List<Vector2Int> cells))
            {
                return false;
            }

            for (int i = 0; i < cells.Count; i++)
            {
                int index = Index(cells[i]);
                if (_occupants[index] == itemId)
                {
                    _occupants[index] = EmptyCell;
                    _occupiedRequiredCells--;
                }
            }

            _itemCells.Remove(itemId);
            GridChanged?.Invoke();
            return true;
        }

        public bool IsPlaced(int itemId)
        {
            EnsureInitialized();
            return _itemCells.ContainsKey(itemId);
        }

        /// <summary>Cells occupied by an item, or an empty list if it is not on the grid.</summary>
        public IReadOnlyList<Vector2Int> GetCellsForItem(int itemId)
        {
            EnsureInitialized();
            return _itemCells.TryGetValue(itemId, out List<Vector2Int> cells)
                ? cells
                : Array.Empty<Vector2Int>();
        }

        public IEnumerable<int> PlacedItemIds
        {
            get
            {
                EnsureInitialized();
                return _itemCells.Keys;
            }
        }

        void EnsureInitialized()
        {
            if (!_initialized)
            {
                Initialize(width, height, cellSize, null);
            }
        }

        void OnDrawGizmos()
        {
            if (!drawGizmos)
            {
                return;
            }

            var cellExtent = new Vector3(cellSize, cellSize, 0.01f);

            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    var cell = new Vector2Int(x, y);
                    Vector3 center = GridToWorld(cell);

                    if (_initialized && _blocked[Index(cell)])
                    {
                        Gizmos.color = blockedColor;
                        Gizmos.DrawCube(center, cellExtent);
                    }
                    else if (_initialized && _occupants[Index(cell)] != EmptyCell)
                    {
                        Gizmos.color = occupiedColor;
                        Gizmos.DrawCube(center, cellExtent);
                    }

                    Gizmos.color = gridColor;
                    Gizmos.DrawWireCube(center, cellExtent);
                }
            }
        }
    }
}
