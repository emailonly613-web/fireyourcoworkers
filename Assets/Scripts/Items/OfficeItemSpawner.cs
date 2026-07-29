using System.Collections.Generic;
using CorporateTetris.Data;
using UnityEngine;

namespace CorporateTetris.Items
{
    [System.Serializable]
    public class ItemPrefabEntry
    {
        /// <summary>Matches <see cref="OfficeItemDefinition.prefabAddress"/> from the content file.</summary>
        public string prefabAddress;
        public OfficeItem prefab;
    }

    /// <summary>
    /// Builds the staging tray for a level: one <see cref="OfficeItem"/> per required character,
    /// laid out in rows beside the elevator.
    /// </summary>
    public class OfficeItemSpawner : MonoBehaviour
    {
        [SerializeField] Transform trayRoot;
        [SerializeField] OfficeItem defaultPrefab;
        [SerializeField] ItemPrefabEntry[] prefabs = System.Array.Empty<ItemPrefabEntry>();

        [Header("Tray layout")]
        [SerializeField] Vector3 trayOrigin = new Vector3(-4f, 1f, 0f);
        [SerializeField] float horizontalSpacing = 1.8f;
        [SerializeField] float verticalSpacing = 2.2f;
        [SerializeField] int itemsPerRow = 2;

        readonly Dictionary<string, OfficeItem> _prefabLookup = new Dictionary<string, OfficeItem>();
        readonly List<OfficeItem> _spawned = new List<OfficeItem>();

        public IReadOnlyList<OfficeItem> Spawned => _spawned;

        void Awake()
        {
            for (int i = 0; i < prefabs.Length; i++)
            {
                if (prefabs[i] != null && !string.IsNullOrEmpty(prefabs[i].prefabAddress) && prefabs[i].prefab != null)
                {
                    _prefabLookup[prefabs[i].prefabAddress] = prefabs[i].prefab;
                }
            }
        }

        /// <summary>
        /// Item ids start at 1: <see cref="Core.GridManager.EmptyCell"/> is 0, so 0 can never be a
        /// valid item id.
        /// </summary>
        public List<OfficeItem> SpawnForLevel(LevelDefinition level, ContentDatabase database, float cellSize)
        {
            DespawnAll();

            if (level?.requiredCharacterIds == null || database == null)
            {
                return _spawned;
            }

            int nextItemId = 1;

            for (int i = 0; i < level.requiredCharacterIds.Length; i++)
            {
                string characterId = level.requiredCharacterIds[i];

                if (!database.TryGetItem(characterId, out OfficeItemDefinition definition))
                {
                    Debug.LogError($"[OfficeItemSpawner] Level '{level.id}' references unknown character '{characterId}'.", this);
                    continue;
                }

                OfficeItem prefab = ResolvePrefab(definition.prefabAddress);
                if (prefab == null)
                {
                    Debug.LogError(
                        $"[OfficeItemSpawner] No prefab registered for '{definition.prefabAddress}' " +
                        $"(character '{definition.id}') and no default prefab is assigned.", this);
                    continue;
                }

                OfficeItem instance = Instantiate(prefab, trayRoot != null ? trayRoot : transform);
                instance.name = $"{definition.id}_{nextItemId}";
                instance.Initialize(nextItemId, definition, GetTrayPosition(_spawned.Count), cellSize);

                _spawned.Add(instance);
                nextItemId++;
            }

            return _spawned;
        }

        OfficeItem ResolvePrefab(string prefabAddress)
        {
            if (!string.IsNullOrEmpty(prefabAddress) && _prefabLookup.TryGetValue(prefabAddress, out OfficeItem prefab))
            {
                return prefab;
            }

            return defaultPrefab;
        }

        public Vector3 GetTrayPosition(int slot)
        {
            int perRow = Mathf.Max(1, itemsPerRow);
            int column = slot % perRow;
            int row = slot / perRow;

            return trayOrigin + new Vector3(column * horizontalSpacing, -row * verticalSpacing, 0f);
        }

        public void DespawnAll()
        {
            for (int i = 0; i < _spawned.Count; i++)
            {
                if (_spawned[i] != null)
                {
                    Destroy(_spawned[i].gameObject);
                }
            }

            _spawned.Clear();
        }
    }
}
