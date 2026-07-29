namespace CorporateTetris.Core
{
    /// <summary>
    /// Gameplay moments that presentation and audio subscribe to. Gameplay classes raise these;
    /// they never contain spoken lines or clip references themselves.
    /// </summary>
    public enum HumorEvent
    {
        OnGrab,
        OnDragHeld,
        OnRotate,
        OnInvalidRotation,
        OnValidDrop,
        OnInvalidDrop,
        OnSquished,
        OnLevelComplete
    }

    /// <summary>Moments at which HR rules are evaluated.</summary>
    public enum HRTrigger
    {
        OnGrab,
        OnRotate,
        OnInvalidDrop,
        OnValidDrop,
        OnUndo,
        OnArrangementChanged,
        OnLevelCompletionAttempt
    }

    public enum GameState
    {
        Loading,
        Playing,
        LevelComplete,
        HRFailure
    }
}
