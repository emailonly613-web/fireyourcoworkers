using UnityEngine;

namespace CorporateTetris.Presentation
{
    /// <summary>
    /// Loose paper spilling from the broken copy machine. Deliberately has no collider and no
    /// reference to the grid: paper is scenery and must never influence placement.
    /// </summary>
    public class PaperNuisanceEffect : MonoBehaviour
    {
        [SerializeField] ParticleSystem paperParticles;
        [SerializeField] Transform paperTray;
        [SerializeField] float trayBendPerSide = 6f;
        [SerializeField] float maxTrayBend = 18f;

        bool _enabled;
        Quaternion _trayRest = Quaternion.identity;

        void Awake()
        {
            if (paperTray != null)
            {
                _trayRest = paperTray.localRotation;
            }
        }

        public void SetEnabled(bool value)
        {
            _enabled = value;

            if (!_enabled)
            {
                ResetToNeutral();
            }
        }

        /// <summary>Bends the tray and puffs paper in proportion to how boxed in the machine is.</summary>
        public void ApplyPressure(ContactPressure pressure)
        {
            if (!_enabled)
            {
                return;
            }

            int sides = pressure.PressuredSideCount;

            if (paperTray != null)
            {
                float bend = Mathf.Clamp(sides * trayBendPerSide, 0f, maxTrayBend);
                float direction = pressure.AnyLeft && !pressure.AnyRight ? -1f : 1f;
                paperTray.localRotation = _trayRest * Quaternion.Euler(0f, 0f, bend * direction);
            }

            if (paperParticles != null && sides >= 2 && !paperParticles.isPlaying)
            {
                paperParticles.Play();
            }
        }

        public void ResetToNeutral()
        {
            if (paperTray != null)
            {
                paperTray.localRotation = _trayRest;
            }

            if (paperParticles != null && paperParticles.isPlaying)
            {
                paperParticles.Stop();
            }
        }
    }
}
