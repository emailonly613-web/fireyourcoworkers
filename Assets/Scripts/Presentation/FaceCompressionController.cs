using CorporateTetris.Items;
using UnityEngine;

namespace CorporateTetris.Presentation
{
    /// <summary>
    /// Data-driven facial reaction IDs. <see cref="None"/> is not a face — it is the result for
    /// items that do not have one (equipment), and is what proves the copy machine is not being
    /// given human facial compression.
    /// </summary>
    public enum FacialReaction
    {
        None,
        Neutral,
        Concerned,
        CompressedLeft,
        CompressedRight,
        CompressedVertical,
        UpsideDown,
        Panicked,
        Smug,
        Sleeping,
        Angry
    }

    public static class FacialReactionIds
    {
        public const string None = "none";
        public const string Neutral = "neutral";
        public const string Concerned = "concerned";
        public const string CompressedLeft = "compressed_left";
        public const string CompressedRight = "compressed_right";
        public const string CompressedVertical = "compressed_vertical";
        public const string UpsideDown = "upside_down";
        public const string Panicked = "panicked";
        public const string Smug = "smug";
        public const string Sleeping = "sleeping";
        public const string Angry = "angry";

        public static string ToId(FacialReaction reaction)
        {
            switch (reaction)
            {
                case FacialReaction.Neutral: return Neutral;
                case FacialReaction.Concerned: return Concerned;
                case FacialReaction.CompressedLeft: return CompressedLeft;
                case FacialReaction.CompressedRight: return CompressedRight;
                case FacialReaction.CompressedVertical: return CompressedVertical;
                case FacialReaction.UpsideDown: return UpsideDown;
                case FacialReaction.Panicked: return Panicked;
                case FacialReaction.Smug: return Smug;
                case FacialReaction.Sleeping: return Sleeping;
                case FacialReaction.Angry: return Angry;
                default: return None;
            }
        }
    }

    /// <summary>
    /// Chooses a facial reaction from logical pressure and orientation. Placeholder art is
    /// expected: the controller drives a sprite swap, an Animator parameter, or nothing at all,
    /// and the system is provable without final artwork.
    /// </summary>
    public class FaceCompressionController : MonoBehaviour
    {
        [SerializeField] SpriteRenderer faceRenderer;
        [SerializeField] Animator animator;
        [SerializeField] string animatorParameter = "FacialReaction";
        [SerializeField] Sprite[] reactionSprites;

        FacialReaction _current = FacialReaction.Neutral;

        public FacialReaction Current => _current;

        /// <summary>
        /// Reaction naming convention: <c>CompressedLeft</c> means pressure arrives FROM the left,
        /// so the face squashes toward the right. The direction always names the pressure source.
        /// </summary>
        public static FacialReaction Resolve(
            OfficeItemDefinition definition,
            ContactPressure pressure,
            int orientation)
        {
            if (definition == null || !definition.ResolveSquishProfile().supportsFaceCompression)
            {
                return FacialReaction.None;
            }

            bool upsideDown = ShapeRotationUtility.NormalizeOrientation(orientation) == 2;
            if (upsideDown && !definition.ResolveHRProperties().canBeUpsideDown)
            {
                return FacialReaction.UpsideDown;
            }

            int sides = pressure.PressuredSideCount;

            if (sides >= 3)
            {
                return FacialReaction.Panicked;
            }

            // Management pinned between two surfaces is angry rather than merely concerned.
            bool isManagement = definition.HasTag("management") || definition.ResolveHRProperties().isManagement;
            if (isManagement && sides >= 2)
            {
                return FacialReaction.Angry;
            }

            if (pressure.IsTrappedVertically || (pressure.AnyDown && pressure.AnyUp))
            {
                return FacialReaction.CompressedVertical;
            }

            if (pressure.AnyLeft && !pressure.AnyRight)
            {
                return FacialReaction.CompressedLeft;
            }

            if (pressure.AnyRight && !pressure.AnyLeft)
            {
                return FacialReaction.CompressedRight;
            }

            if (pressure.IsTrappedHorizontally)
            {
                return isManagement ? FacialReaction.Angry : FacialReaction.Concerned;
            }

            if (definition.HasTag("sleeping"))
            {
                return FacialReaction.Sleeping;
            }

            return FacialReaction.Neutral;
        }

        public void Apply(FacialReaction reaction)
        {
            _current = reaction;

            if (reaction == FacialReaction.None)
            {
                if (faceRenderer != null)
                {
                    faceRenderer.enabled = false;
                }
                return;
            }

            if (faceRenderer != null)
            {
                faceRenderer.enabled = true;

                int index = (int)reaction;
                if (reactionSprites != null && index >= 0 && index < reactionSprites.Length && reactionSprites[index] != null)
                {
                    faceRenderer.sprite = reactionSprites[index];
                }
            }

            if (animator != null && !string.IsNullOrEmpty(animatorParameter))
            {
                animator.SetInteger(animatorParameter, (int)reaction);
            }
        }

        public void ResetToNeutral()
        {
            Apply(faceRenderer == null && animator == null ? FacialReaction.Neutral : FacialReaction.Neutral);
        }
    }
}
