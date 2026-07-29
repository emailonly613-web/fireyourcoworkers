using System.Collections;
using CorporateTetris.Items;
using UnityEngine;

namespace CorporateTetris.Presentation
{
    public enum SquishState
    {
        Neutral,
        Grabbed,
        Dragged,
        Rotating,
        WallCompressed,
        ItemCompressed,
        InvalidDropImpact,
        ValidDropSettle,
        Released
    }

    /// <summary>Which visual language an item deforms in.</summary>
    public enum DeformationChannel
    {
        /// <summary>Flesh: squash, stretch, facial compression.</summary>
        Body,
        /// <summary>Equipment: shake and part bending, never flesh-like squash.</summary>
        Equipment
    }

    /// <summary>
    /// Cosmetics only. This component moves and scales a child visual root; it never touches
    /// <see cref="Core.GridManager"/>, never reports placement validity, and never changes the
    /// item's orientation. Removing it would change how the game looks and nothing about how it
    /// plays.
    /// </summary>
    [DisallowMultipleComponent]
    public class ItemSquishController : MonoBehaviour
    {
        [Header("Visual root (never the logical transform)")]
        [SerializeField] Transform visualRoot;

        [Header("Configurable amounts")]
        [SerializeField, Range(0f, 0.5f)] float grabSquashAmount = 0.08f;
        [SerializeField, Range(0f, 0.5f)] float rotationStretchAmount = 0.1f;
        [SerializeField, Range(0f, 0.5f)] float wallCompressionAmount = 0.18f;
        [SerializeField, Range(0f, 0.5f)] float itemCompressionAmount = 0.12f;
        [SerializeField, Range(0f, 0.5f)] float invalidImpactAmount = 0.25f;
        [SerializeField, Min(0.01f)] float settleDuration = 0.18f;
        [SerializeField, Min(0.01f)] float recoveryDuration = 0.25f;
        [SerializeField, Range(0f, 0.5f)] float maximumVisualDeformation = 0.3f;

        [Header("Equipment channel")]
        [SerializeField] float equipmentShakeAmplitude = 0.04f;
        [SerializeField] float equipmentShakeFrequency = 28f;

        SquishProfile _profile;
        DeformationChannel _channel = DeformationChannel.Body;
        SquishState _state = SquishState.Neutral;
        Deformation _target = Deformation.Neutral;
        Deformation _current = Deformation.Neutral;
        ContactPressure _pressure = ContactPressure.None;
        Coroutine _impactRoutine;
        float _shakeTimer;
        float _cellSize = 1f;

        public SquishState State => _state;
        public DeformationChannel Channel => _channel;
        public Deformation CurrentDeformation => _current;
        public ContactPressure Pressure => _pressure;
        public float MaximumVisualDeformation => maximumVisualDeformation;

        public float GrabSquashAmount { get => grabSquashAmount; set => grabSquashAmount = value; }
        public float RotationStretchAmount { get => rotationStretchAmount; set => rotationStretchAmount = value; }
        public float WallCompressionAmount { get => wallCompressionAmount; set => wallCompressionAmount = value; }
        public float ItemCompressionAmount { get => itemCompressionAmount; set => itemCompressionAmount = value; }
        public float InvalidImpactAmount { get => invalidImpactAmount; set => invalidImpactAmount = value; }
        public float SettleDuration { get => settleDuration; set => settleDuration = value; }
        public float RecoveryDuration { get => recoveryDuration; set => recoveryDuration = value; }

        /// <summary>The profile actually in use, after data overrides. Never null after Awake.</summary>
        public SquishProfile ActiveProfile => _profile ??= BuildProfileFromInspector();

        void Awake()
        {
            _profile ??= BuildProfileFromInspector();
            if (visualRoot == null)
            {
                visualRoot = transform;
            }
        }

        SquishProfile BuildProfileFromInspector()
        {
            return new SquishProfile
            {
                enabled = true,
                wallCompression = wallCompressionAmount,
                itemCompression = itemCompressionAmount,
                invalidImpactSquash = invalidImpactAmount,
                maximumDeformation = maximumVisualDeformation,
                supportsFaceCompression = true
            };
        }

        /// <summary>
        /// Adopts the data-driven profile for a character. The copy machine arrives here with
        /// <c>RigidEquipment</c> and face compression switched off, which is what routes it to the
        /// equipment channel instead of body squish.
        /// </summary>
        public void ApplyDefinition(OfficeItemDefinition definition, float cellSize)
        {
            _cellSize = Mathf.Max(0.0001f, cellSize);

            if (definition == null)
            {
                _profile = BuildProfileFromInspector();
                _channel = DeformationChannel.Body;
                return;
            }

            SquishProfile source = definition.ResolveSquishProfile();

            _profile = new SquishProfile
            {
                enabled = source.enabled,
                wallCompression = source.wallCompression,
                itemCompression = source.itemCompression,
                invalidImpactSquash = source.invalidImpactSquash,
                maximumDeformation = source.maximumDeformation,
                supportsFaceCompression = source.supportsFaceCompression
            };

            wallCompressionAmount = _profile.wallCompression;
            itemCompressionAmount = _profile.itemCompression;
            invalidImpactAmount = _profile.invalidImpactSquash;
            maximumVisualDeformation = _profile.maximumDeformation;

            _channel = definition.ResolveDeformationStyle() == DeformationStyle.RigidEquipment
                ? DeformationChannel.Equipment
                : DeformationChannel.Body;

            if (definition.ResolveDeformationStyle() == DeformationStyle.Limited)
            {
                // The CEO squishes, but only a little.
                _profile.maximumDeformation = Mathf.Min(_profile.maximumDeformation, 0.15f);
                maximumVisualDeformation = _profile.maximumDeformation;
            }
        }

        public void SetState(SquishState state)
        {
            _state = state;

            switch (state)
            {
                case SquishState.Neutral:
                case SquishState.Released:
                    _target = Deformation.Neutral;
                    break;

                case SquishState.Grabbed:
                    _target = Clamp(new Deformation(
                        new Vector2(1f + grabSquashAmount * 0.5f, 1f - grabSquashAmount),
                        Vector2.zero));
                    break;

                case SquishState.Dragged:
                    _target = Clamp(new Deformation(
                        new Vector2(1f - grabSquashAmount * 0.25f, 1f + grabSquashAmount * 0.25f),
                        Vector2.zero));
                    break;

                case SquishState.Rotating:
                    _target = Clamp(new Deformation(
                        new Vector2(1f + rotationStretchAmount, 1f - rotationStretchAmount * 0.5f),
                        Vector2.zero));
                    break;

                case SquishState.WallCompressed:
                case SquishState.ItemCompressed:
                    _target = Clamp(SquishSolver.Solve(_pressure, ActiveProfile));
                    break;

                case SquishState.ValidDropSettle:
                    _target = Clamp(SquishSolver.Solve(_pressure, ActiveProfile));
                    break;

                case SquishState.InvalidDropImpact:
                    _target = Clamp(SquishSolver.SolveInvalidImpact(ActiveProfile));
                    break;
            }
        }

        /// <summary>
        /// Feeds the item the pressure derived from the final logical arrangement and picks the
        /// matching compressed state. Called after a successful placement, never during one.
        /// </summary>
        public void ApplyContactPressure(ContactPressure pressure)
        {
            _pressure = pressure;

            if (!pressure.HasAnyPressure)
            {
                SetState(SquishState.ValidDropSettle);
                return;
            }

            bool wallContact = pressure.WallLeft || pressure.WallRight || pressure.WallDown || pressure.WallUp;
            SetState(wallContact ? SquishState.WallCompressed : SquishState.ItemCompressed);
        }

        public void PlayInvalidDropImpact()
        {
            if (_impactRoutine != null)
            {
                StopCoroutine(_impactRoutine);
            }

            if (isActiveAndEnabled)
            {
                _impactRoutine = StartCoroutine(InvalidImpactRoutine());
            }
            else
            {
                SetState(SquishState.InvalidDropImpact);
            }
        }

        IEnumerator InvalidImpactRoutine()
        {
            SetState(SquishState.InvalidDropImpact);
            yield return new WaitForSeconds(settleDuration);
            ResetToNeutral();
            _impactRoutine = null;
        }

        /// <summary>
        /// Returns the visual to rest. Required when an item leaves the grid: an undone item must
        /// look exactly as it did in the tray.
        /// </summary>
        public void ResetToNeutral()
        {
            if (_impactRoutine != null)
            {
                StopCoroutine(_impactRoutine);
                _impactRoutine = null;
            }

            _pressure = ContactPressure.None;
            _state = SquishState.Neutral;
            _target = Deformation.Neutral;
            _current = Deformation.Neutral;
            _shakeTimer = 0f;
            ApplyToTransform(Deformation.Neutral);
        }

        void Update()
        {
            float duration = _state == SquishState.ValidDropSettle ? settleDuration : recoveryDuration;
            float t = Mathf.Clamp01(Time.deltaTime / Mathf.Max(0.0001f, duration));

            _current = new Deformation(
                Vector2.Lerp(_current.Scale, _target.Scale, t),
                Vector2.Lerp(_current.Offset, _target.Offset, t));

            Deformation applied = _current;

            if (_channel == DeformationChannel.Equipment && _pressure.HasAnyPressure)
            {
                // Equipment does not squash; it rattles in place.
                _shakeTimer += Time.deltaTime * equipmentShakeFrequency;
                float shake = Mathf.Sin(_shakeTimer) * equipmentShakeAmplitude;
                float limit = maximumVisualDeformation * SquishSolver.OffsetClampFactor;
                applied = new Deformation(
                    Vector2.one,
                    new Vector2(Mathf.Clamp(_current.Offset.x + shake, -limit, limit), _current.Offset.y));
            }

            ApplyToTransform(applied);
        }

        void ApplyToTransform(Deformation deformation)
        {
            if (visualRoot == null)
            {
                return;
            }

            visualRoot.localScale = new Vector3(deformation.Scale.x, deformation.Scale.y, 1f);
            visualRoot.localPosition = new Vector3(
                deformation.Offset.x * _cellSize,
                deformation.Offset.y * _cellSize,
                visualRoot.localPosition.z);
        }

        Deformation Clamp(Deformation deformation)
        {
            float max = Mathf.Max(0f, maximumVisualDeformation);
            float offsetLimit = max * SquishSolver.OffsetClampFactor;

            return new Deformation(
                new Vector2(
                    Mathf.Clamp(deformation.Scale.x, 1f - max, 1f + max),
                    Mathf.Clamp(deformation.Scale.y, 1f - max, 1f + max)),
                new Vector2(
                    Mathf.Clamp(deformation.Offset.x, -offsetLimit, offsetLimit),
                    Mathf.Clamp(deformation.Offset.y, -offsetLimit, offsetLimit)));
        }

        /// <summary>
        /// Test seam: resolves the deformation for a pressure state without needing a frame loop.
        /// </summary>
        public Deformation EvaluateFor(ContactPressure pressure)
        {
            return Clamp(SquishSolver.Solve(pressure, ActiveProfile));
        }
    }
}
