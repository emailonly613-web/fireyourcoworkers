using System.Collections.Generic;
using CorporateTetris.Core;
using UnityEngine;

namespace CorporateTetris.Presentation
{
    /// <summary>
    /// Ghost cells shown under a dragged item. Calls only <see cref="GridManager.ValidatePlacement"/>,
    /// which is read-only — the preview can never leave occupancy behind.
    /// </summary>
    public class PlacementPreview : MonoBehaviour
    {
        [SerializeField] GridManager grid;
        [SerializeField] SpriteRenderer cellPrototype;
        [SerializeField] int poolSize = 16;
        [SerializeField] Color validColor = new Color(0.3f, 0.9f, 0.45f, 0.55f);
        [SerializeField] Color invalidColor = new Color(0.95f, 0.3f, 0.3f, 0.55f);

        readonly List<SpriteRenderer> _pool = new List<SpriteRenderer>();
        bool _visible;

        public bool IsVisible => _visible;
        public bool LastPlacementWasValid { get; private set; }

        public GridManager Grid
        {
            get => grid;
            set => grid = value;
        }

        void Awake()
        {
            EnsurePool(poolSize);
            Hide();
        }

        void EnsurePool(int size)
        {
            if (cellPrototype == null)
            {
                return;
            }

            while (_pool.Count < size)
            {
                SpriteRenderer instance = Instantiate(cellPrototype, transform);
                instance.gameObject.SetActive(false);
                _pool.Add(instance);
            }
        }

        /// <summary>
        /// Shows every cell the item would occupy, coloured by whether the whole shape fits.
        /// Call again after a rotation to refresh immediately.
        /// </summary>
        public void Show(int itemId, IReadOnlyList<Vector2Int> shapeCells, Vector2Int anchor)
        {
            if (grid == null || shapeCells == null || shapeCells.Count == 0)
            {
                Hide();
                return;
            }

            PlacementResult result = grid.ValidatePlacement(itemId, shapeCells, anchor);
            LastPlacementWasValid = result.Success;

            // Out of bounds means the pointer has left the playable grid entirely.
            if (!result.Success && result.Failure == PlacementFailure.OutOfBounds && !AnyCellInBounds(shapeCells, anchor))
            {
                Hide();
                return;
            }

            EnsurePool(shapeCells.Count);

            Color color = result.Success ? validColor : invalidColor;
            int used = 0;

            for (int i = 0; i < shapeCells.Count && i < _pool.Count; i++)
            {
                Vector2Int cell = anchor + shapeCells[i];
                SpriteRenderer renderer = _pool[i];

                renderer.gameObject.SetActive(true);
                renderer.transform.position = grid.GridToWorld(cell);
                renderer.color = color;
                used++;
            }

            for (int i = used; i < _pool.Count; i++)
            {
                _pool[i].gameObject.SetActive(false);
            }

            _visible = used > 0;
        }

        bool AnyCellInBounds(IReadOnlyList<Vector2Int> shapeCells, Vector2Int anchor)
        {
            for (int i = 0; i < shapeCells.Count; i++)
            {
                if (grid.InBounds(anchor + shapeCells[i]))
                {
                    return true;
                }
            }

            return false;
        }

        public void Hide()
        {
            for (int i = 0; i < _pool.Count; i++)
            {
                _pool[i].gameObject.SetActive(false);
            }

            _visible = false;
            LastPlacementWasValid = false;
        }
    }
}
