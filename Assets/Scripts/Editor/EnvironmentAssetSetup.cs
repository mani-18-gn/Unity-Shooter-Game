#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEngine;

namespace Roadbound.Editor
{
    public static class EnvironmentAssetSetup
    {
        private static readonly string[] PropNames = new[]
        {
            "ammo_box",
            "old_military_crate",
            "concrete_road_barrier",
            "medical_box",
            "coast_rocks_01"
        };

        [MenuItem("Roadbound/Setup Environment Materials")]
        public static void SetupPropMaterials()
        {
            foreach (string prop in PropNames)
            {
                string dir = $"Assets/Environment/Props/{prop}";
                if (!Directory.Exists(dir)) continue;

                string matPath = $"{dir}/{prop}_URP.mat";
                if (File.Exists(matPath)) continue;

                Shader urpShader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
                Material mat = new Material(urpShader);
                mat.name = $"{prop}_URP";

                // Diffuse
                string diffPath = $"{dir}/{prop}_diff_1k.jpg";
                if (File.Exists(diffPath))
                {
                    Texture2D diff = AssetDatabase.LoadAssetAtPath<Texture2D>(diffPath);
                    if (diff != null) mat.SetTexture("_BaseMap", diff);
                }

                // Normal
                string norPath = $"{dir}/{prop}_nor_gl_1k.exr";
                if (File.Exists(norPath))
                {
                    TextureImporter ni = AssetImporter.GetAtPath(norPath) as TextureImporter;
                    if (ni != null && ni.textureType != TextureImporterType.NormalMap)
                    {
                        ni.textureType = TextureImporterType.NormalMap;
                        ni.SaveAndReimport();
                    }
                    Texture2D nor = AssetDatabase.LoadAssetAtPath<Texture2D>(norPath);
                    if (nor != null)
                    {
                        mat.SetTexture("_BumpMap", nor);
                        mat.EnableKeyword("_NORMALMAP");
                    }
                }

                mat.SetFloat("_Smoothness", 0.35f);
                AssetDatabase.CreateAsset(mat, matPath);
                Debug.Log($"[EnvironmentAssetSetup] Created material: {matPath}");
            }
            AssetDatabase.SaveAssets();
        }
    }
}
#endif
