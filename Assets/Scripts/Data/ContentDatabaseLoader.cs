using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;

namespace CorporateTetris.Data
{
    /// <summary>
    /// Loads corporate_tetris_content.json from StreamingAssets.
    ///
    /// Uses Newtonsoft rather than JsonUtility because the schema's <c>shape</c> field is a jagged
    /// array of rows, which JsonUtility cannot deserialize at all.
    ///
    /// Invalid content never throws into gameplay: problems are collected, logged as clear
    /// console errors, and the loader reports failure so the caller can stop cleanly.
    /// </summary>
    public class ContentDatabaseLoader : MonoBehaviour
    {
        [SerializeField] string fileName = "corporate_tetris_content.json";
        [SerializeField] TextAsset fallbackContent;
        [SerializeField] bool refuseToLoadOnValidationError = true;

        public ContentDatabase Database { get; private set; }
        public IReadOnlyList<ContentProblem> Problems { get; private set; } = Array.Empty<ContentProblem>();
        public bool IsLoaded => Database != null;

        public event Action<ContentDatabase> Loaded;
        public event Action<string> LoadFailed;

        public string ResolvedPath => Path.Combine(Application.streamingAssetsPath, fileName);

        public IEnumerator LoadRoutine()
        {
            string path = ResolvedPath;
            string json = null;

            // On Android and WebGL, StreamingAssets is inside a compressed archive and is only
            // reachable through UnityWebRequest.
            if (path.Contains("://"))
            {
                using (UnityWebRequest request = UnityWebRequest.Get(path))
                {
                    yield return request.SendWebRequest();

                    if (request.result == UnityWebRequest.Result.Success)
                    {
                        json = request.downloadHandler.text;
                    }
                    else
                    {
                        Debug.LogError($"[ContentDatabase] Request for '{path}' failed: {request.error}", this);
                    }
                }
            }
            else if (File.Exists(path))
            {
                json = File.ReadAllText(path);
            }
            else
            {
                Debug.LogError($"[ContentDatabase] No content file at '{path}'.", this);
            }

            if (string.IsNullOrEmpty(json) && fallbackContent != null)
            {
                Debug.LogWarning("[ContentDatabase] Falling back to the assigned TextAsset.", this);
                json = fallbackContent.text;
            }

            if (string.IsNullOrEmpty(json))
            {
                Fail($"Content database not found at '{path}' and no fallback TextAsset is assigned.");
                yield break;
            }

            if (!TryParse(json, out ContentDatabase database, out List<ContentProblem> problems, out string parseError))
            {
                Problems = problems;
                LogProblems(problems);
                Fail(parseError);
                yield break;
            }

            Problems = problems;
            LogProblems(problems);

            bool hasErrors = false;
            for (int i = 0; i < problems.Count; i++)
            {
                if (problems[i].Severity == ContentProblemSeverity.Error)
                {
                    hasErrors = true;
                    break;
                }
            }

            if (hasErrors && refuseToLoadOnValidationError)
            {
                Fail($"Content database at '{path}' has {CountErrors(problems)} validation error(s); refusing to start a level with invalid content.");
                yield break;
            }

            Database = database;
            Loaded?.Invoke(database);
        }

        /// <summary>
        /// Parses and validates. Static and Unity-free so tests can exercise every rejection path
        /// without a scene.
        /// </summary>
        public static bool TryParse(
            string json,
            out ContentDatabase database,
            out List<ContentProblem> problems,
            out string parseError)
        {
            database = null;
            problems = new List<ContentProblem>();
            parseError = null;

            if (string.IsNullOrWhiteSpace(json))
            {
                parseError = "Content database JSON is empty.";
                problems.Add(new ContentProblem(ContentProblemSeverity.Error, parseError));
                return false;
            }

            try
            {
                var settings = new JsonSerializerSettings
                {
                    MissingMemberHandling = MissingMemberHandling.Ignore,
                    NullValueHandling = NullValueHandling.Ignore
                };

                database = JsonConvert.DeserializeObject<ContentDatabase>(json, settings);
            }
            catch (JsonException exception)
            {
                parseError = $"Content database JSON is malformed: {exception.Message}";
                problems.Add(new ContentProblem(ContentProblemSeverity.Error, parseError));
                return false;
            }

            if (database == null)
            {
                parseError = "Content database JSON parsed to null.";
                problems.Add(new ContentProblem(ContentProblemSeverity.Error, parseError));
                return false;
            }

            database.BuildIndex();
            problems.AddRange(database.Validate());
            return true;
        }

        public static int CountErrors(IReadOnlyList<ContentProblem> problems)
        {
            int count = 0;
            for (int i = 0; i < problems.Count; i++)
            {
                if (problems[i].Severity == ContentProblemSeverity.Error)
                {
                    count++;
                }
            }
            return count;
        }

        void LogProblems(IReadOnlyList<ContentProblem> problems)
        {
            for (int i = 0; i < problems.Count; i++)
            {
                if (problems[i].Severity == ContentProblemSeverity.Error)
                {
                    Debug.LogError($"[ContentDatabase] {problems[i].Message}", this);
                }
                else
                {
                    Debug.LogWarning($"[ContentDatabase] {problems[i].Message}", this);
                }
            }
        }

        void Fail(string message)
        {
            Debug.LogError($"[ContentDatabase] {message}", this);
            LoadFailed?.Invoke(message);
        }

        void OnValidate()
        {
            if (string.IsNullOrEmpty(fileName))
            {
                fileName = "corporate_tetris_content.json";
            }
        }
    }
}
