using CorporateTetris.Core;
using CorporateTetris.HR;
using CorporateTetris.Items;
using CorporateTetris.Presentation;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;

namespace CorporateTetris.InputControl
{
    /// <summary>
    /// One pointer, one item. Reads the Input System's unified <see cref="Pointer"/> so mouse and
    /// touch take the identical path, and refuses to start a drag that began over UI.
    /// </summary>
    public class PlacementInputController : MonoBehaviour
    {
        [SerializeField] Camera worldCamera;
        [SerializeField] GridManager grid;
        [SerializeField] LevelManager levelManager;
        [SerializeField] GameStateManager gameState;
        [SerializeField] HRViolationManager hrManager;
        [SerializeField] PlacementPreview preview;

        [Header("Picking")]
        [SerializeField] LayerMask itemLayers = ~0;
        [SerializeField] float pickRadius = 0.4f;

        [Header("Gestures")]
        [SerializeField] bool enableTwoFingerRotate = true;
        [SerializeField] float twoFingerTapMaxDuration = 0.3f;
        [SerializeField] float dragHeldInterval = 2.5f;

        OfficeItem _active;
        Vector3 _grabOffset;
        float _twoFingerStartTime = -1f;
        bool _twoFingerConsumed;
        float _nextDragHeldTime;

        public OfficeItem ActiveItem => _active;
        public bool HasActiveItem => _active != null;

        void Update()
        {
            if (gameState != null && !gameState.AcceptsInput)
            {
                CancelActive();
                return;
            }

            HandleTwoFingerRotate();

            Pointer pointer = Pointer.current;
            if (pointer == null)
            {
                return;
            }

            Vector2 screenPosition = pointer.position.ReadValue();

            if (pointer.press.wasPressedThisFrame)
            {
                TryBeginDrag(screenPosition);
            }
            else if (pointer.press.isPressed && _active != null)
            {
                ContinueDrag(screenPosition);
            }
            else if (pointer.press.wasReleasedThisFrame && _active != null)
            {
                EndDrag(screenPosition);
            }
        }

        void TryBeginDrag(Vector2 screenPosition)
        {
            // Only one item may be controlled at a time.
            if (_active != null)
            {
                return;
            }

            if (IsPointerOverUI(screenPosition))
            {
                return;
            }

            Vector3 world = ScreenToWorld(screenPosition);
            OfficeItem hit = PickItem(world);

            if (hit == null || hit.IsPlaced)
            {
                return;
            }

            _active = hit;
            _grabOffset = hit.transform.position - world;
            _nextDragHeldTime = Time.time + dragHeldInterval;

            hit.Grab();
            hrManager?.RegisterAction(HRTrigger.OnGrab, hit.ItemId, hit.Definition);
        }

        void ContinueDrag(Vector2 screenPosition)
        {
            Vector3 world = ScreenToWorld(screenPosition) + _grabOffset;
            _active.Drag(world);

            UpdatePreview(world);

            if (Time.time >= _nextDragHeldTime)
            {
                _active.NotifyDragHeld();
                _nextDragHeldTime = Time.time + dragHeldInterval;
            }
        }

        void EndDrag(Vector2 screenPosition)
        {
            OfficeItem item = _active;
            _active = null;
            preview?.Hide();

            Vector3 world = ScreenToWorld(screenPosition) + _grabOffset;
            Vector2Int anchor = ResolveAnchor(item, world);

            if (!levelManager.TryPlace(item, anchor))
            {
                // TryPlace already returned the item to the tray and scored the invalid drop.
                return;
            }
        }

        void CancelActive()
        {
            if (_active == null)
            {
                return;
            }

            _active.ReturnToTray();
            _active = null;
            preview?.Hide();
        }

        void UpdatePreview(Vector3 world)
        {
            if (preview == null || _active == null)
            {
                return;
            }

            Vector2Int anchor = ResolveAnchor(_active, world);
            preview.Show(_active.ItemId, _active.CurrentShape, anchor);
        }

        /// <summary>
        /// Converts the visual centre back to the shape's anchor cell, undoing the centring
        /// offset applied when drawing so the piece lands where it looks like it will.
        /// </summary>
        Vector2Int ResolveAnchor(OfficeItem item, Vector3 world)
        {
            Vector2 centerOffset = ShapeRotationUtility.GetBoundsCenterOffset(item.CurrentShape);
            float cellSize = grid.CellSize;
            var anchorWorld = new Vector3(
                world.x - centerOffset.x * cellSize,
                world.y - centerOffset.y * cellSize,
                world.z);

            return grid.WorldToGrid(anchorWorld);
        }

        /// <summary>Rotation entry point shared by the on-screen button and the touch gesture.</summary>
        public void RotateActiveItem()
        {
            if (_active == null || gameState != null && !gameState.AcceptsInput)
            {
                return;
            }

            _active.Rotate();
            hrManager?.RegisterAction(HRTrigger.OnRotate, _active.ItemId, _active.Definition);

            // The preview must reflect the new shape immediately, not on the next pointer move.
            UpdatePreview(_active.transform.position);
        }

        void HandleTwoFingerRotate()
        {
            if (!enableTwoFingerRotate)
            {
                return;
            }

            int activeTouches = CountActiveTouches();

            if (activeTouches == 2)
            {
                if (_twoFingerStartTime < 0f)
                {
                    _twoFingerStartTime = Time.time;
                    _twoFingerConsumed = false;
                }
            }
            else
            {
                bool wasTwoFingerTap =
                    _twoFingerStartTime >= 0f &&
                    !_twoFingerConsumed &&
                    Time.time - _twoFingerStartTime <= twoFingerTapMaxDuration;

                if (wasTwoFingerTap && activeTouches <= 1)
                {
                    _twoFingerConsumed = true;
                    RotateActiveItem();
                }

                if (activeTouches == 0)
                {
                    _twoFingerStartTime = -1f;
                    _twoFingerConsumed = false;
                }
            }
        }

        static int CountActiveTouches()
        {
            if (Touchscreen.current == null)
            {
                return 0;
            }

            int count = 0;
            var touches = Touchscreen.current.touches;
            for (int i = 0; i < touches.Count; i++)
            {
                if (touches[i].press.isPressed)
                {
                    count++;
                }
            }

            return count;
        }

        bool IsPointerOverUI(Vector2 screenPosition)
        {
            if (EventSystem.current == null)
            {
                return false;
            }

            var eventData = new PointerEventData(EventSystem.current) { position = screenPosition };
            var results = new System.Collections.Generic.List<RaycastResult>();
            EventSystem.current.RaycastAll(eventData, results);
            return results.Count > 0;
        }

        Vector3 ScreenToWorld(Vector2 screenPosition)
        {
            Camera cam = worldCamera != null ? worldCamera : Camera.main;
            if (cam == null)
            {
                return Vector3.zero;
            }

            float depth = cam.orthographic ? 0f : Mathf.Abs(cam.transform.position.z);
            Vector3 world = cam.ScreenToWorldPoint(new Vector3(screenPosition.x, screenPosition.y, depth));
            world.z = 0f;
            return world;
        }

        OfficeItem PickItem(Vector3 world)
        {
            Collider2D hit = Physics2D.OverlapCircle(world, pickRadius, itemLayers);
            if (hit != null)
            {
                OfficeItem item = hit.GetComponentInParent<OfficeItem>();
                if (item != null)
                {
                    return item;
                }
            }

            // Fallback so the slice is playable before colliders are authored on the prefabs.
            OfficeItem nearest = null;
            float nearestDistance = pickRadius;

            var items = levelManager != null ? levelManager.Items : null;
            if (items != null)
            {
                for (int i = 0; i < items.Count; i++)
                {
                    if (items[i] == null || items[i].IsPlaced)
                    {
                        continue;
                    }

                    float distance = Vector2.Distance(items[i].transform.position, world);
                    if (distance < nearestDistance)
                    {
                        nearestDistance = distance;
                        nearest = items[i];
                    }
                }
            }

            return nearest;
        }
    }
}
