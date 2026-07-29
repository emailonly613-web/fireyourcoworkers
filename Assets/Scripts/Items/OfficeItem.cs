using System;
using System.Collections.Generic;
using CorporateTetris.Core;
using CorporateTetris.HR;
using CorporateTetris.Presentation;
using UnityEngine;

namespace CorporateTetris.Items
{
    /// <summary>
    /// One office item. Holds the logical state (id, shape, orientation, placement) and owns —
    /// but is never driven by — its cosmetic components.
    /// </summary>
    [DisallowMultipleComponent]
    public class OfficeItem : MonoBehaviour, IPlacedItemView
    {
        [SerializeField] ItemSquishController squish;
        [SerializeField] FaceCompressionController face;
        [SerializeField] OfficeItemAnimator itemAnimator;
        [SerializeField] PaperNuisanceEffect paperEffect;

        readonly List<Vector2Int> _currentShape = new List<Vector2Int>();

        OfficeItemDefinition _definition;
        int _itemId;
        int _orientation;
        Vector3 _trayPosition;
        Vector2Int _placedAnchor;
        bool _isPlaced;
        float _cellSize = 1f;

        public int ItemId => _itemId;
        public OfficeItemDefinition Definition => _definition;
        public int Orientation => _orientation;
        public bool IsPlaced => _isPlaced;
        public bool IsLocked => _isPlaced;
        public Vector2Int PlacedAnchor => _placedAnchor;
        public Vector3 TrayPosition => _trayPosition;
        public IReadOnlyList<Vector2Int> CurrentShape => _currentShape;
        public ItemSquishController Squish => squish;
        public FaceCompressionController Face => face;

        /// <summary>Raised so audio and HR can react without this class knowing about either.</summary>
        public event Action<OfficeItem, HumorEvent> HumorEventRaised;

        public void Initialize(int itemId, OfficeItemDefinition definition, Vector3 trayPosition, float cellSize)
        {
            _itemId = itemId;
            _definition = definition;
            _trayPosition = trayPosition;
            _cellSize = Mathf.Max(0.0001f, cellSize);
            _orientation = 0;
            _isPlaced = false;

            RebuildShape();

            transform.position = trayPosition;

            if (squish != null)
            {
                squish.ApplyDefinition(definition, _cellSize);
                squish.ResetToNeutral();
            }

            if (itemAnimator != null)
            {
                itemAnimator.Initialize(definition);
            }

            if (paperEffect != null)
            {
                paperEffect.SetEnabled(definition != null && definition.ResolveDeformationStyle() == DeformationStyle.RigidEquipment);
            }

            RefreshFace(ContactPressure.None);
        }

        void RebuildShape()
        {
            _currentShape.Clear();

            if (_definition == null || _definition.ShapeCells.Length == 0)
            {
                return;
            }

            _currentShape.AddRange(ShapeRotationUtility.Rotate(_definition.ShapeCells, _orientation));
        }

        public void Grab()
        {
            if (_isPlaced)
            {
                return;
            }

            squish?.SetState(SquishState.Grabbed);
            itemAnimator?.PlayGrab();
            HumorEventRaised?.Invoke(this, HumorEvent.OnGrab);
        }

        public void Drag(Vector3 worldPosition)
        {
            if (_isPlaced)
            {
                return;
            }

            transform.position = worldPosition;
            squish?.SetState(SquishState.Dragged);
        }

        public void NotifyDragHeld()
        {
            HumorEventRaised?.Invoke(this, HumorEvent.OnDragHeld);
        }

        /// <summary>
        /// Rotates the logical shape one quarter turn clockwise. Cosmetics react to this; they
        /// never cause it.
        /// </summary>
        public void Rotate()
        {
            if (_isPlaced)
            {
                HumorEventRaised?.Invoke(this, HumorEvent.OnInvalidRotation);
                return;
            }

            _orientation = ShapeRotationUtility.NormalizeOrientation(_orientation + 1);
            RebuildShape();

            squish?.SetState(SquishState.Rotating);
            itemAnimator?.PlayRotate();
            HumorEventRaised?.Invoke(this, HumorEvent.OnRotate);
            RefreshFace(ContactPressure.None);
        }

        /// <summary>
        /// World position for the visual so the piece stays centred on its bounding box after a
        /// rotation instead of drifting toward one corner.
        /// </summary>
        public Vector3 GetCenteredWorldPosition(GridManager grid, Vector2Int anchor)
        {
            Vector3 anchorWorld = grid.GridToWorld(anchor);
            Vector2 centerOffset = ShapeRotationUtility.GetBoundsCenterOffset(_currentShape);
            return anchorWorld + new Vector3(centerOffset.x * _cellSize, centerOffset.y * _cellSize, 0f);
        }

        public void LockAt(GridManager grid, Vector2Int anchor)
        {
            _placedAnchor = anchor;
            _isPlaced = true;
            transform.position = GetCenteredWorldPosition(grid, anchor);
            itemAnimator?.PlayPlaced();
            HumorEventRaised?.Invoke(this, HumorEvent.OnValidDrop);
        }

        /// <summary>Applies cosmetic compression derived from the settled arrangement.</summary>
        public void ApplySettledPressure(ContactPressure pressure)
        {
            squish?.ApplyContactPressure(pressure);
            RefreshFace(pressure);

            if (pressure.PressuredSideCount >= 3)
            {
                HumorEventRaised?.Invoke(this, HumorEvent.OnSquished);
            }

            paperEffect?.ApplyPressure(pressure);
        }

        public void RejectDrop()
        {
            squish?.PlayInvalidDropImpact();
            itemAnimator?.PlayReject();
            HumorEventRaised?.Invoke(this, HumorEvent.OnInvalidDrop);
        }

        /// <summary>
        /// Removes the item from play and restores it to exactly the state it had in the tray,
        /// including a fully neutral visual.
        /// </summary>
        public void ReturnToTray()
        {
            _isPlaced = false;
            transform.position = _trayPosition;
            squish?.ResetToNeutral();
            paperEffect?.ResetToNeutral();
            RefreshFace(ContactPressure.None);
        }

        public void Unlock()
        {
            _isPlaced = false;
            squish?.ResetToNeutral();
            paperEffect?.ResetToNeutral();
            RefreshFace(ContactPressure.None);
        }

        void RefreshFace(ContactPressure pressure)
        {
            if (face == null)
            {
                return;
            }

            face.Apply(FaceCompressionController.Resolve(_definition, pressure, _orientation));
        }

        public void RaiseLevelComplete()
        {
            HumorEventRaised?.Invoke(this, HumorEvent.OnLevelComplete);
        }
    }
}
