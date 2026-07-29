using System.Collections.Generic;
using CorporateTetris.Core;
using CorporateTetris.Items;
using UnityEngine;

namespace CorporateTetris.Presentation
{
    [System.Serializable]
    public class VoiceClipEntry
    {
        public string lineId;
        public AudioClip clip;
    }

    /// <summary>
    /// Resolves voice-line IDs to clips and enforces anti-spam. No gameplay class contains a
    /// spoken line; they raise a <see cref="HumorEvent"/> and this decides whether anything is
    /// heard.
    /// </summary>
    public class HumorAudioController : MonoBehaviour
    {
        [SerializeField] AudioSource source;
        [SerializeField] VoiceClipEntry[] clips = System.Array.Empty<VoiceClipEntry>();

        [Header("Anti-spam")]
        [Tooltip("Minimum seconds between two lines for the same event on the same item.")]
        [SerializeField] float perEventCooldown = 1.5f;
        [Tooltip("Minimum seconds between any two lines, across all items.")]
        [SerializeField] float globalCooldown = 0.35f;
        [Tooltip("GAP-01 unconfirmed: block replaying the same line back-to-back.")]
        [SerializeField] bool blockImmediateRepeat = true;

        readonly Dictionary<string, float> _lastPlayedByEvent = new Dictionary<string, float>();
        readonly Dictionary<string, AudioClip> _clipLookup = new Dictionary<string, AudioClip>();
        string _lastLineId;
        float _lastGlobalPlay = -999f;
        int _rotatingIndex;

        void Awake()
        {
            for (int i = 0; i < clips.Length; i++)
            {
                if (clips[i] != null && !string.IsNullOrEmpty(clips[i].lineId) && !_clipLookup.ContainsKey(clips[i].lineId))
                {
                    _clipLookup.Add(clips[i].lineId, clips[i].clip);
                }
            }
        }

        public void Subscribe(OfficeItem item)
        {
            if (item != null)
            {
                item.HumorEventRaised += HandleHumorEvent;
            }
        }

        public void Unsubscribe(OfficeItem item)
        {
            if (item != null)
            {
                item.HumorEventRaised -= HandleHumorEvent;
            }
        }

        void HandleHumorEvent(OfficeItem item, HumorEvent humorEvent)
        {
            if (item?.Definition == null)
            {
                return;
            }

            IReadOnlyList<string> lineIds = item.Definition.GetVoiceLineIds(humorEvent);
            if (lineIds.Count == 0)
            {
                return;
            }

            string cooldownKey = $"{item.ItemId}|{humorEvent}";
            float now = Time.time;

            if (_lastPlayedByEvent.TryGetValue(cooldownKey, out float last) && now - last < perEventCooldown)
            {
                return;
            }

            if (now - _lastGlobalPlay < globalCooldown)
            {
                return;
            }

            string lineId = lineIds[_rotatingIndex++ % lineIds.Count];

            if (blockImmediateRepeat && lineId == _lastLineId && lineIds.Count > 1)
            {
                lineId = lineIds[_rotatingIndex++ % lineIds.Count];
            }

            _lastPlayedByEvent[cooldownKey] = now;
            _lastGlobalPlay = now;
            _lastLineId = lineId;

            if (source != null && _clipLookup.TryGetValue(lineId, out AudioClip clip) && clip != null)
            {
                source.PlayOneShot(clip);
            }
        }

        public void ResetCooldowns()
        {
            _lastPlayedByEvent.Clear();
            _lastGlobalPlay = -999f;
            _lastLineId = null;
        }
    }
}
