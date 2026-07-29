using System;
using UnityEngine;

namespace CorporateTetris.Core
{
    /// <summary>
    /// Single source of truth for what phase the slice is in. Input asks it whether interaction
    /// is allowed rather than each system tracking its own flags.
    /// </summary>
    public class GameStateManager : MonoBehaviour
    {
        [SerializeField] GameState state = GameState.Loading;

        public GameState State => state;
        public bool AcceptsInput => state == GameState.Playing;

        public event Action<GameState> StateChanged;

        public void SetState(GameState next)
        {
            if (state == next)
            {
                return;
            }

            state = next;
            StateChanged?.Invoke(state);
        }

        public void MarkPlaying() => SetState(GameState.Playing);
        public void MarkLoading() => SetState(GameState.Loading);
        public void MarkLevelComplete() => SetState(GameState.LevelComplete);
        public void MarkHRFailure() => SetState(GameState.HRFailure);
    }
}
