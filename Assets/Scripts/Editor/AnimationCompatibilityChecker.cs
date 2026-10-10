#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEngine;

namespace Roadbound.Editor
{
    public static class AnimationCompatibilityChecker
    {
        [MenuItem("Roadbound/Check Animation Compatibility")]
        public static void CheckCompatibility()
        {
            Debug.Log("[AnimationCompatibilityChecker] =========================================");
            Debug.Log("[AnimationCompatibilityChecker] Starting Humanoid Rig & Avatar Verification");
            Debug.Log("[AnimationCompatibilityChecker] =========================================");

            string ch15Path = "Assets/Characters/Ch15_nonPBR.fbx";
            GameObject ch15Model = AssetDatabase.LoadAssetAtPath<GameObject>(ch15Path);
            if (ch15Model == null)
            {
                Debug.LogError($"[AnimationCompatibilityChecker] Could not load {ch15Path}");
                return;
            }

            Avatar ch15Avatar = CharacterSetupTool.GetAvatarFromModel(ch15Path);
            Debug.Log($"[AnimationCompatibilityChecker] Ch15 Model: {ch15Model.name}");
            Debug.Log($"[AnimationCompatibilityChecker] Ch15 Avatar: {(ch15Avatar != null ? ch15Avatar.name : "NULL")}, isValid: {ch15Avatar?.isValid}, isHuman: {ch15Avatar?.isHuman}");

            string[] animPaths = new[]
            {
                "Assets/Animations/Combat/swat@Idle.fbx",
                "Assets/Animations/Combat/swat@Walking.fbx",
                "Assets/Animations/Combat/swat@Running.fbx",
                "Assets/Animations/Combat/swat@Firing Rifle.fbx",
                "Assets/Animations/Combat/Swat@Crouch Idle.fbx",
                "Assets/Animations/Combat/Swat@Crouched Walking.fbx",
                "Assets/Animations/Combat/swat@Standing Death Backward 01.fbx"
            };

            foreach (var aPath in animPaths)
            {
                ModelImporter mi = AssetImporter.GetAtPath(aPath) as ModelImporter;
                if (mi == null)
                {
                    Debug.LogWarning($"[AnimationCompatibilityChecker] Could not get importer for {aPath}");
                    continue;
                }

                AnimationClip clip = null;
                var assets = AssetDatabase.LoadAllAssetsAtPath(aPath);
                foreach (var a in assets)
                {
                    if (a is AnimationClip c && !c.name.StartsWith("__preview__"))
                    {
                        clip = c;
                        break;
                    }
                }

                Debug.Log($"[AnimationCompatibilityChecker] {Path.GetFileName(aPath)}:");
                Debug.Log($"    AnimationType: {mi.animationType}, AvatarSetup: {mi.avatarSetup}");
                Debug.Log($"    Clip: {(clip != null ? clip.name : "NULL")}, humanMotion: {clip?.isHumanMotion}, isLooping: {clip?.isLooping}, length: {clip?.length:F2}s");
            }
        }
    }
}
#endif
