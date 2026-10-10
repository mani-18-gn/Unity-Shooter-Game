#if UNITY_EDITOR
using System.IO;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace Roadbound.Editor
{
    public static class AssetInspectorUtility
    {
        [MenuItem("Roadbound/Inspect Character Assets")]
        public static void InspectCharacters()
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendLine("=== CHARACTER ASSET INSPECTION REPORT ===");

            string[] paths = new[]
            {
                "Assets/Characters/Ch15_nonPBR.fbx",
                "Assets/Characters/[Male Warrior].fbx"
            };

            foreach (string p in paths)
            {
                sb.AppendLine($"\n--- Path: {p} ---");
                if (!File.Exists(p))
                {
                    sb.AppendLine("File does not exist!");
                    continue;
                }

                var mainObj = AssetDatabase.LoadMainAssetAtPath(p);
                sb.AppendLine($"Main Asset: {mainObj?.name} ({mainObj?.GetType().Name})");

                var allAssets = AssetDatabase.LoadAllAssetsAtPath(p);
                sb.AppendLine($"Total Sub-assets: {allAssets.Length}");

                int clipCount = 0;
                int meshCount = 0;
                int avatarCount = 0;
                int matCount = 0;

                foreach (var obj in allAssets)
                {
                    if (obj is AnimationClip clip)
                    {
                        clipCount++;
                        sb.AppendLine($"  - Clip: {clip.name} (length: {clip.length:F2}s, isLooping: {clip.isLooping})");
                    }
                    else if (obj is Avatar avatar)
                    {
                        avatarCount++;
                        sb.AppendLine($"  - Avatar: {avatar.name} (isValid: {avatar.isValid}, isHuman: {avatar.isHuman})");
                    }
                    else if (obj is Mesh mesh)
                    {
                        meshCount++;
                        sb.AppendLine($"  - Mesh: {mesh.name} (verts: {mesh.vertexCount})");
                    }
                    else if (obj is Material mat)
                    {
                        matCount++;
                        sb.AppendLine($"  - Material: {mat.name} (shader: {mat.shader?.name})");
                    }
                }
                sb.AppendLine($"Summary: {meshCount} meshes, {avatarCount} avatars, {clipCount} clips, {matCount} materials.");
            }

            string outPath = "Assets/character_inspection.txt";
            File.WriteAllText(outPath, sb.ToString());
            Debug.Log($"[AssetInspectorUtility] Report written to {outPath}\n" + sb.ToString());
        }
    }
}
#endif
