using CorporateTetris.HR;
using UnityEngine;
using UnityEngine.UI;

namespace CorporateTetris.Presentation
{
    /// <summary>
    /// Shows the HR score, the newest violation and why it happened. Read-only view over
    /// <see cref="HRViolationManager"/>.
    /// </summary>
    public class HRWarningUI : MonoBehaviour
    {
        [SerializeField] HRViolationManager violationManager;
        [SerializeField] Text scoreLabel;
        [SerializeField] Text newestViolationLabel;
        [SerializeField] GameObject warningBanner;
        [SerializeField] GameObject failurePanel;
        [SerializeField] Image scoreFill;

        [SerializeField] Color safeColor = new Color(0.35f, 0.75f, 0.4f);
        [SerializeField] Color warningColor = new Color(0.95f, 0.7f, 0.2f);
        [SerializeField] Color failureColor = new Color(0.9f, 0.3f, 0.3f);

        void OnEnable()
        {
            if (violationManager == null)
            {
                return;
            }

            violationManager.ScoreChanged += HandleScoreChanged;
            violationManager.ViolationAdded += HandleViolationAdded;
            violationManager.ViolationRemoved += HandleViolationRemoved;
            violationManager.WarningThresholdReached += HandleWarning;
            violationManager.FailureTriggered += HandleFailure;

            HandleScoreChanged(violationManager.TotalScore);
        }

        void OnDisable()
        {
            if (violationManager == null)
            {
                return;
            }

            violationManager.ScoreChanged -= HandleScoreChanged;
            violationManager.ViolationAdded -= HandleViolationAdded;
            violationManager.ViolationRemoved -= HandleViolationRemoved;
            violationManager.WarningThresholdReached -= HandleWarning;
            violationManager.FailureTriggered -= HandleFailure;
        }

        void HandleScoreChanged(int total)
        {
            if (scoreLabel != null)
            {
                scoreLabel.text = $"HR: {total} / {violationManager.FailureLimit}";
            }

            if (scoreFill != null && violationManager.FailureLimit > 0)
            {
                scoreFill.fillAmount = Mathf.Clamp01((float)total / violationManager.FailureLimit);
                scoreFill.color = total >= violationManager.FailureLimit
                    ? failureColor
                    : total >= violationManager.WarningThreshold
                        ? warningColor
                        : safeColor;
            }

            if (warningBanner != null && total < violationManager.WarningThreshold)
            {
                warningBanner.SetActive(false);
            }
        }

        void HandleViolationAdded(HRViolationResult violation)
        {
            if (newestViolationLabel != null)
            {
                newestViolationLabel.text = $"{violation.Category}: {violation.Message}";
            }
        }

        void HandleViolationRemoved(HRViolationResult violation)
        {
            if (newestViolationLabel == null)
            {
                return;
            }

            HRViolationResult? newest = violationManager.NewestViolation;
            newestViolationLabel.text = newest.HasValue && newest.Value.Key != violation.Key
                ? $"{newest.Value.Category}: {newest.Value.Message}"
                : string.Empty;
        }

        void HandleWarning(int total)
        {
            if (warningBanner != null)
            {
                warningBanner.SetActive(true);
            }
        }

        void HandleFailure(int total)
        {
            if (failurePanel != null)
            {
                failurePanel.SetActive(true);
            }
        }
    }
}
