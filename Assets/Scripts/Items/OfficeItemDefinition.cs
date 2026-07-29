using System;
using System.Collections.Generic;
using UnityEngine;

namespace CorporateTetris.Items
{
    /// <summary>How an item is allowed to deform. Drives which visual channel reacts to pressure.</summary>
    public enum DeformationStyle
    {
        /// <summary>Full soft-body squash and stretch. Sleeping Intern.</summary>
        SoftBody,
        /// <summary>Reduced squash. Micro-Managing CEO.</summary>
        Limited,
        /// <summary>Rigid: shake, part bending, no flesh-like squash. Broken Copy Machine.</summary>
        RigidEquipment
    }

    [Serializable]
    public class VoiceLine
    {
        public string id;
        public string text;
        public string audioAddress;
    }

    /// <summary>Voice-line IDs per humor event, exactly as named in the content schema.</summary>
    [Serializable]
    public class VoiceLineTable
    {
        public VoiceLine[] onGrab = Array.Empty<VoiceLine>();
        public VoiceLine[] onDragHeld = Array.Empty<VoiceLine>();
        public VoiceLine[] onRotate = Array.Empty<VoiceLine>();
        public VoiceLine[] onInvalidRotation = Array.Empty<VoiceLine>();
        public VoiceLine[] onValidDrop = Array.Empty<VoiceLine>();
        public VoiceLine[] onInvalidDrop = Array.Empty<VoiceLine>();
        public VoiceLine[] onSquished = Array.Empty<VoiceLine>();
        public VoiceLine[] onLevelComplete = Array.Empty<VoiceLine>();

        public VoiceLine[] For(Core.HumorEvent humorEvent)
        {
            switch (humorEvent)
            {
                case Core.HumorEvent.OnGrab: return onGrab;
                case Core.HumorEvent.OnDragHeld: return onDragHeld;
                case Core.HumorEvent.OnRotate: return onRotate;
                case Core.HumorEvent.OnInvalidRotation: return onInvalidRotation;
                case Core.HumorEvent.OnValidDrop: return onValidDrop;
                case Core.HumorEvent.OnInvalidDrop: return onInvalidDrop;
                case Core.HumorEvent.OnSquished: return onSquished;
                case Core.HumorEvent.OnLevelComplete: return onLevelComplete;
                default: return Array.Empty<VoiceLine>();
            }
        }
    }

    [Serializable]
    public class AnimationTriggers
    {
        public string grab = "Grabbed";
        public string rotate = "Rotated";
        public string validDrop = "Placed";
        public string invalidDrop = "Rejected";
    }

    [Serializable]
    public class ItemEffects
    {
        public bool spawnSleepBubbleWhenHorizontal;
        public int paperBurstCount;
    }

    [Serializable]
    public class SquishProfile
    {
        public bool enabled = true;
        public float wallCompression = 0.18f;
        public float itemCompression = 0.12f;
        public float invalidImpactSquash = 0.25f;
        public float maximumDeformation = 0.3f;
        public bool supportsFaceCompression = true;
    }

    [Serializable]
    public class HRProperties
    {
        public bool canBeUpsideDown;
        public bool isManagement;
        public bool isHeavyEquipment;
    }

    /// <summary>
    /// One character or object, deserialized from corporate_tetris_content.json.
    ///
    /// Field names mirror the authoritative schema exactly. <c>shape</c> arrives as rows of 0/1
    /// read top-to-bottom, which is convenient to author but not what the grid uses, so
    /// <see cref="BuildShapeCells"/> converts it once into bottom-up cell coordinates.
    /// </summary>
    [Serializable]
    public class OfficeItemDefinition
    {
        public string id;
        public string displayName;
        public string category;
        public string prefabAddress;

        /// <summary>Rows of 0/1, first row is the TOP of the item.</summary>
        public int[][] shape;

        public int[] allowedRotations = { 0, 90, 180, 270 };
        public string weightClass = "medium";
        public AnimationTriggers animationTriggers = new AnimationTriggers();
        public VoiceLineTable voiceLines = new VoiceLineTable();
        public ItemEffects effects = new ItemEffects();

        /// <summary>
        /// Schema extension required by HR rules 1-3, which match on tags the base schema does
        /// not define. When absent, tags are derived from category and weightClass.
        /// See docs/CLAUDE-STATUS.md, open question OQ-2.
        /// </summary>
        public string[] tags;

        /// <summary>Optional per-character override; defaults are derived from category.</summary>
        public SquishProfile squishProfile;

        /// <summary>Optional per-character override; defaults are derived from tags.</summary>
        public HRProperties hrProperties;

        Vector2Int[] _shapeCells;
        HashSet<string> _tagLookup;

        /// <summary>Normalized cell offsets, minimum (0,0), y increasing upward.</summary>
        public Vector2Int[] ShapeCells => _shapeCells ??= BuildShapeCells(shape);

        /// <summary>
        /// Converts row-major 0/1 rows (top row first) into grid cells (y up), normalized so the
        /// lowest-leftmost occupied cell is (0,0).
        /// </summary>
        public static Vector2Int[] BuildShapeCells(int[][] rows)
        {
            if (rows == null || rows.Length == 0)
            {
                return Array.Empty<Vector2Int>();
            }

            int rowCount = rows.Length;
            var cells = new List<Vector2Int>();

            for (int r = 0; r < rowCount; r++)
            {
                int[] row = rows[r];
                if (row == null)
                {
                    continue;
                }

                for (int c = 0; c < row.Length; c++)
                {
                    if (row[c] != 0)
                    {
                        // Row 0 is the top, so it maps to the highest y.
                        cells.Add(new Vector2Int(c, rowCount - 1 - r));
                    }
                }
            }

            ShapeRotationUtility.Normalize(cells);
            return cells.ToArray();
        }

        public DeformationStyle ResolveDeformationStyle()
        {
            if (HasTag("heavy_equipment") || string.Equals(category, "equipment", StringComparison.OrdinalIgnoreCase))
            {
                return DeformationStyle.RigidEquipment;
            }

            if (HasTag("management") || string.Equals(category, "executive", StringComparison.OrdinalIgnoreCase))
            {
                return DeformationStyle.Limited;
            }

            return DeformationStyle.SoftBody;
        }

        public SquishProfile ResolveSquishProfile()
        {
            if (squishProfile != null)
            {
                return squishProfile;
            }

            switch (ResolveDeformationStyle())
            {
                case DeformationStyle.RigidEquipment:
                    // Equipment does not squash and has no face.
                    squishProfile = new SquishProfile
                    {
                        enabled = true,
                        wallCompression = 0.05f,
                        itemCompression = 0.04f,
                        invalidImpactSquash = 0.08f,
                        maximumDeformation = 0.1f,
                        supportsFaceCompression = false
                    };
                    break;

                case DeformationStyle.Limited:
                    squishProfile = new SquishProfile
                    {
                        enabled = true,
                        wallCompression = 0.1f,
                        itemCompression = 0.08f,
                        invalidImpactSquash = 0.15f,
                        maximumDeformation = 0.15f,
                        supportsFaceCompression = true
                    };
                    break;

                default:
                    squishProfile = new SquishProfile
                    {
                        enabled = true,
                        wallCompression = 0.18f,
                        itemCompression = 0.12f,
                        invalidImpactSquash = 0.25f,
                        maximumDeformation = 0.3f,
                        supportsFaceCompression = true
                    };
                    break;
            }

            return squishProfile;
        }

        public HRProperties ResolveHRProperties()
        {
            return hrProperties ??= new HRProperties
            {
                // Only equipment may legitimately be inverted.
                canBeUpsideDown = !HasTag("human"),
                isManagement = HasTag("management"),
                isHeavyEquipment = HasTag("heavy_equipment")
            };
        }

        /// <summary>
        /// Derives tags from category and weightClass when the content file does not supply them,
        /// so HR rules still have something to match on.
        /// </summary>
        IEnumerable<string> DeriveTags()
        {
            if (string.Equals(category, "coworker", StringComparison.OrdinalIgnoreCase))
            {
                yield return "human";
                yield return "employee";
            }
            else if (string.Equals(category, "executive", StringComparison.OrdinalIgnoreCase))
            {
                yield return "human";
                yield return "employee";
                yield return "management";
            }
            else if (string.Equals(category, "equipment", StringComparison.OrdinalIgnoreCase))
            {
                yield return "equipment";
                if (string.Equals(weightClass, "heavy", StringComparison.OrdinalIgnoreCase))
                {
                    yield return "heavy_equipment";
                }
            }
            else if (string.Equals(category, "animal", StringComparison.OrdinalIgnoreCase))
            {
                yield return "animal";
            }
        }

        public bool HasTag(string tag)
        {
            if (string.IsNullOrEmpty(tag))
            {
                return false;
            }

            if (_tagLookup == null)
            {
                _tagLookup = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                if (tags != null && tags.Length > 0)
                {
                    for (int i = 0; i < tags.Length; i++)
                    {
                        if (!string.IsNullOrEmpty(tags[i]))
                        {
                            _tagLookup.Add(tags[i]);
                        }
                    }
                }
                else
                {
                    foreach (string derived in DeriveTags())
                    {
                        _tagLookup.Add(derived);
                    }
                }
            }

            return _tagLookup.Contains(tag);
        }

        public bool AllowsRotation(int degrees)
        {
            if (allowedRotations == null || allowedRotations.Length == 0)
            {
                return true;
            }

            for (int i = 0; i < allowedRotations.Length; i++)
            {
                if (allowedRotations[i] == degrees)
                {
                    return true;
                }
            }

            return false;
        }

        /// <summary>Voice-line IDs for an event. Never returns spoken text to gameplay code.</summary>
        public IReadOnlyList<string> GetVoiceLineIds(Core.HumorEvent humorEvent)
        {
            VoiceLine[] lines = (voiceLines ?? new VoiceLineTable()).For(humorEvent);
            if (lines == null || lines.Length == 0)
            {
                return Array.Empty<string>();
            }

            var ids = new string[lines.Length];
            for (int i = 0; i < lines.Length; i++)
            {
                ids[i] = lines[i]?.id;
            }

            return ids;
        }

        public VoiceLine FindVoiceLine(string lineId)
        {
            if (voiceLines == null || string.IsNullOrEmpty(lineId))
            {
                return null;
            }

            foreach (Core.HumorEvent humorEvent in Enum.GetValues(typeof(Core.HumorEvent)))
            {
                VoiceLine[] lines = voiceLines.For(humorEvent);
                if (lines == null)
                {
                    continue;
                }

                for (int i = 0; i < lines.Length; i++)
                {
                    if (lines[i] != null && lines[i].id == lineId)
                    {
                        return lines[i];
                    }
                }
            }

            return null;
        }

        public void InvalidateCaches()
        {
            _tagLookup = null;
            _shapeCells = null;
        }
    }
}
