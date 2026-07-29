using CorporateTetris.Items;
using UnityEngine;

namespace CorporateTetris.Presentation
{
    /// <summary>
    /// Thin wrapper over an Animator so gameplay can request an animation by intent without
    /// knowing state names, and so the slice still runs with no Animator assigned.
    /// </summary>
    public class OfficeItemAnimator : MonoBehaviour
    {
        [SerializeField] Animator animator;

        [Header("Trigger names")]
        [SerializeField] string grabTrigger = "Grab";
        [SerializeField] string rotateTrigger = "Rotate";
        [SerializeField] string placedTrigger = "Placed";
        [SerializeField] string rejectTrigger = "Reject";
        [SerializeField] string celebrateTrigger = "Celebrate";

        [Header("Sleep bubble")]
        [SerializeField] GameObject sleepBubble;
        [SerializeField] Transform sleepBubbleRoot;

        bool _supportsSleepBubble;

        public void Initialize(OfficeItemDefinition definition)
        {
            _supportsSleepBubble = definition != null && definition.HasTag("sleeping");

            if (sleepBubble != null)
            {
                sleepBubble.SetActive(_supportsSleepBubble);
            }
        }

        public void PlayGrab() => Fire(grabTrigger);
        public void PlayRotate() => Fire(rotateTrigger);
        public void PlayPlaced() => Fire(placedTrigger);
        public void PlayReject() => Fire(rejectTrigger);
        public void PlayCelebrate() => Fire(celebrateTrigger);

        /// <summary>
        /// The Sleeping Intern's bubble shows while they are horizontal and flattens, then pops,
        /// as compression rises. Purely cosmetic — it reads pressure, it never produces it.
        /// </summary>
        public void UpdateSleepBubble(bool isHorizontal, float compression, float maxCompression)
        {
            if (!_supportsSleepBubble || sleepBubble == null)
            {
                return;
            }

            bool popped = maxCompression > 0f && compression >= maxCompression * 0.85f;
            sleepBubble.SetActive(isHorizontal && !popped);

            if (sleepBubbleRoot != null && sleepBubble.activeSelf)
            {
                float flatten = maxCompression > 0f ? Mathf.Clamp01(compression / maxCompression) : 0f;
                sleepBubbleRoot.localScale = new Vector3(1f + flatten * 0.3f, 1f - flatten * 0.6f, 1f);
            }
        }

        void Fire(string trigger)
        {
            if (animator != null && !string.IsNullOrEmpty(trigger))
            {
                animator.SetTrigger(trigger);
            }
        }
    }
}
