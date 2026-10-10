#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.InputSystem;
using Roadbound.Core;
using Roadbound.Player;
using Roadbound.Combat;
using Roadbound.Vehicles;
using Roadbound.AI;
using Roadbound.World;
using Roadbound.UI;

namespace Roadbound.Editor
{
    public static class MilitaryOpenWorldSceneBuilder
    {
        private const string CombatTestScenePath = "Assets/Scenes/CombatTestScene.unity";
        private const string OpenWorldScenePath = "Assets/Scenes/MilitaryOpenWorld.unity";

        [MenuItem("Roadbound/Upgrade Combat Test Scene (AAA Military)")]
        public static void UpgradeCombatTestScene()
        {
            if (!File.Exists(CombatTestScenePath))
            {
                Debug.LogError($"[MilitaryOpenWorldSceneBuilder] CombatTestScene not found at {CombatTestScenePath}! Aborting upgrade.");
                return;
            }

            Debug.Log("[MilitaryOpenWorldSceneBuilder] Upgrading CombatTestScene to AAA Military standard...");
            var scene = EditorSceneManager.OpenScene(CombatTestScenePath, OpenSceneMode.Single);

            // 1. Upgrade Player with SWAT Visuals, Audio & Effects
            var player = GameObject.Find("Player");
            if (player == null)
            {
                Debug.LogError("[MilitaryOpenWorldSceneBuilder] Player GameObject not found in CombatTestScene! Aborting upgrade.");
                return;
            }

            // Add CombatAudioManager if missing
            if (player.GetComponent<CombatAudioManager>() == null)
            {
                player.AddComponent<CombatAudioManager>();
            }

            // Add CombatEffectsSystem if missing
            if (player.GetComponent<CombatEffectsSystem>() == null)
            {
                player.AddComponent<CombatEffectsSystem>();
            }

            // Attach Swat Visual if not attached yet
            Transform existingSwat = player.transform.Find("SwatVisual");
            if (existingSwat == null)
            {
                GameObject swatPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/SwatPlayer.prefab");
                if (swatPrefab != null)
                {
                    var prefabAnim = swatPrefab.GetComponent<Animator>();
                    if (prefabAnim == null)
                    {
                        Debug.LogWarning("[MilitaryOpenWorldSceneBuilder] SwatPlayer.prefab lacks an Animator component. Skipping visual attach.");
                    }
                    else
                    {
                        GameObject swatInstance = PrefabUtility.InstantiatePrefab(swatPrefab) as GameObject;
                        if (swatInstance != null)
                        {
                            swatInstance.name = "SwatVisual";
                            swatInstance.transform.SetParent(player.transform, false);
                            swatInstance.transform.localPosition = Vector3.zero;
                            swatInstance.transform.localRotation = Quaternion.identity;

                            // Add HumanoidAnimationBridge safely
                            var anim = swatInstance.GetComponent<Animator>();
                            if (anim == null)
                            {
                                anim = swatInstance.AddComponent<Animator>();
                            }
                            var bridge = swatInstance.GetComponent<HumanoidAnimationBridge>();
                            if (bridge == null)
                            {
                                bridge = swatInstance.AddComponent<HumanoidAnimationBridge>();
                            }

                            // Hide capsule placeholder mesh renderer while keeping GameObject intact for validator
                            var bodyMesh = player.transform.Find("BodyMesh");
                            if (bodyMesh != null)
                            {
                                var r = bodyMesh.GetComponent<MeshRenderer>();
                                if (r != null) r.enabled = false;
                            }

                            var visor = player.transform.Find("Visor");
                            if (visor != null)
                            {
                                var r = visor.GetComponent<MeshRenderer>();
                                if (r != null) r.enabled = false;
                            }

                            // Attach 3D AK47 to RightHandSocket
                            Transform rightHandSocket = FindDeepChild(swatInstance.transform, "RightHandSocket");
                            GameObject ak47Model = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Weapons/AK47.obj");
                            if (rightHandSocket != null && ak47Model != null)
                            {
                                GameObject ak47Instance = Object.Instantiate(ak47Model, rightHandSocket);
                                ak47Instance.name = "AK47_Model";
                                ak47Instance.transform.localPosition = new Vector3(-0.02f, 0.08f, 0.12f);
                                ak47Instance.transform.localRotation = Quaternion.Euler(0f, 0f, 0f);
                                ak47Instance.transform.localScale = Vector3.one * 0.012f; // Scale OBJ to realistic rifle scale

                                // Reposition MuzzlePoint to AK47 barrel tip
                                var muzzle = player.transform.Find("MuzzlePoint");
                                if (muzzle != null)
                                {
                                    muzzle.position = ak47Instance.transform.position + ak47Instance.transform.forward * 0.65f;
                                }
                            }
                        }
                    }
                }
                else
                {
                    Debug.LogWarning("[MilitaryOpenWorldSceneBuilder] SwatPlayer.prefab not found. Run 'Roadbound/Setup SWAT Character & Animations' first if humanoid visual is desired.");
                }
            }

            // 2. Add Military Props to Environment
            var env = GameObject.Find("Environment");
            if (env != null && env.transform.Find("MilitaryProps") == null)
            {
                GameObject propsRoot = new GameObject("MilitaryProps");
                propsRoot.transform.SetParent(env.transform);

                // Checkpoint Concrete Barriers
                SpawnProp("Assets/Environment/Props/concrete_road_barrier/concrete_road_barrier.fbx", propsRoot.transform, new Vector3(-6f, 0f, 8f), Quaternion.Euler(0, 15, 0));
                SpawnProp("Assets/Environment/Props/concrete_road_barrier/concrete_road_barrier.fbx", propsRoot.transform, new Vector3(6f, 0f, 8f), Quaternion.Euler(0, -15, 0));

                // Ammo and Military Crates Supply Position
                SpawnProp("Assets/Environment/Props/old_military_crate/old_military_crate.fbx", propsRoot.transform, new Vector3(-3.5f, 0f, 2f), Quaternion.Euler(0, 45, 0));
                SpawnProp("Assets/Environment/Props/ammo_box/ammo_box.fbx", propsRoot.transform, new Vector3(-3.5f, 0.8f, 2f), Quaternion.Euler(0, 10, 0));
                SpawnProp("Assets/Environment/Props/medical_box/medical_box.fbx", propsRoot.transform, new Vector3(-2.6f, 0f, 2.2f), Quaternion.Euler(0, 30, 0));

                // Boulders Cover on left and right flanks
                SpawnProp("Assets/Environment/Props/coast_rocks_01/coast_rocks_01.fbx", propsRoot.transform, new Vector3(-18f, 0f, 25f), Quaternion.identity, 0.25f);
                SpawnProp("Assets/Environment/Props/coast_rocks_01/coast_rocks_01.fbx", propsRoot.transform, new Vector3(20f, 0f, 40f), Quaternion.Euler(0, 110, 0), 0.3f);
            }

            // 3. Add Military Tactical HUD & Zone Manager
            if (GameObject.Find("MilitarySystems") == null)
            {
                GameObject milRoot = new GameObject("MilitarySystems");
                milRoot.AddComponent<BattleRoyaleZoneManager>();
                milRoot.AddComponent<MilitaryHUD>();
            }

            // 4. Add Drivable Tactical Vehicle
            if (GameObject.Find("TacticalVehicle") == null)
            {
                CreateTacticalVehicle(new Vector3(12f, 0f, 6f));
            }

            // 5. Add Tactical Enemy AI Patrol
            if (GameObject.Find("EnemyPatrol") == null)
            {
                CreateEnemyAI(new Vector3(0f, 0f, 45f));
            }

            EditorSceneManager.SaveScene(scene, CombatTestScenePath);
            Debug.Log("[MilitaryOpenWorldSceneBuilder] Successfully upgraded CombatTestScene!");
        }

        private static void SpawnProp(string fbxPath, Transform parent, Vector3 pos, Quaternion rot, float scaleMultiplier = 1f)
        {
            if (!File.Exists(fbxPath)) return;
            GameObject fbx = AssetDatabase.LoadAssetAtPath<GameObject>(fbxPath);
            if (fbx == null) return;

            GameObject prop = Object.Instantiate(fbx, parent);
            prop.name = Path.GetFileNameWithoutExtension(fbxPath);
            prop.transform.position = pos;
            prop.transform.rotation = rot;
            prop.transform.localScale = Vector3.one * scaleMultiplier;

            // Ensure BoxCollider or MeshCollider
            if (prop.GetComponentInChildren<Collider>() == null)
            {
                foreach (var mf in prop.GetComponentsInChildren<MeshFilter>())
                {
                    var mc = mf.gameObject.AddComponent<MeshCollider>();
                    mc.convex = false;
                }
            }
        }

        private static void CreateTacticalVehicle(Vector3 pos)
        {
            GameObject vehicle = new GameObject("TacticalVehicle");
            vehicle.transform.position = pos;

            var rb = vehicle.AddComponent<Rigidbody>();
            rb.mass = 1800f;

            // Vehicle Body Visual
            GameObject body = GameObject.CreatePrimitive(PrimitiveType.Cube);
            body.name = "VehicleChassis";
            body.transform.SetParent(vehicle.transform, false);
            body.transform.localPosition = new Vector3(0f, 0.7f, 0f);
            body.transform.localScale = new Vector3(2.1f, 1.1f, 4.2f);

            var bRen = body.GetComponent<MeshRenderer>();
            if (bRen != null)
            {
                Material vMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                vMat.color = new Color(0.22f, 0.28f, 0.20f); // Military Olive Drab
                vMat.SetFloat("_Metallic", 0.6f);
                vMat.SetFloat("_Smoothness", 0.35f);
                bRen.material = vMat;
            }

            // Cabin Roof
            GameObject cabin = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cabin.name = "Cabin";
            cabin.transform.SetParent(vehicle.transform, false);
            cabin.transform.localPosition = new Vector3(0f, 1.45f, -0.4f);
            cabin.transform.localScale = new Vector3(1.85f, 0.85f, 2.2f);

            var cRen = cabin.GetComponent<MeshRenderer>();
            if (cRen != null && bRen != null) cRen.material = bRen.material;

            // Wheels setup (FL, FR, RL, RR)
            var vCtrl = vehicle.AddComponent<MilitaryVehicleController>();
            vCtrl.AutoSetupCollidersIfMissing();
        }

        private static void CreateEnemyAI(Vector3 pos)
        {
            GameObject enemyObj = new GameObject("Enemy_Tactical_01");
            enemyObj.transform.position = pos;

            // Character Controller & Collider
            var col = enemyObj.AddComponent<CapsuleCollider>();
            col.height = 1.8f;
            col.radius = 0.35f;
            col.center = new Vector3(0f, 0.9f, 0f);

            var rb = enemyObj.AddComponent<Rigidbody>();
            rb.isKinematic = true;

            // Attach Swat Visual or Warrior
            GameObject swatPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/SwatPlayer.prefab");
            if (swatPrefab != null)
            {
                GameObject vis = Object.Instantiate(swatPrefab, enemyObj.transform);
                vis.name = "Visual";
                vis.transform.localPosition = Vector3.zero;
            }

            // AI Script
            enemyObj.AddComponent<UnityEngine.AI.NavMeshAgent>();
            enemyObj.AddComponent<TacticalEnemyAI>();
        }

        [MenuItem("Roadbound/Build Military Open-World Scene")]
        public static void BuildDedicatedOpenWorldScene()
        {
            if (File.Exists(OpenWorldScenePath)) return;

            Debug.Log("[MilitaryOpenWorldSceneBuilder] Building MilitaryOpenWorld.unity...");
            var newScene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            // Large Terrain Ground
            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Cube);
            ground.name = "OpenWorldTerrain";
            ground.transform.position = new Vector3(0f, -0.5f, 0f);
            ground.transform.localScale = new Vector3(300f, 1f, 300f);

            var grRen = ground.GetComponent<MeshRenderer>();
            if (grRen != null)
            {
                Material gMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                gMat.color = new Color(0.24f, 0.26f, 0.22f); // Tactical military landscape
                grRen.material = gMat;
            }

            // Sun & Sky
            GameObject sunObj = new GameObject("Sun");
            var sun = sunObj.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = new Color(1.0f, 0.95f, 0.88f);
            sun.intensity = 1.35f;
            sun.shadows = LightShadows.Soft;
            sunObj.transform.rotation = Quaternion.Euler(45f, -35f, 0f);

            // Save Scene
            string dir = Path.GetDirectoryName(OpenWorldScenePath);
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

            EditorSceneManager.SaveScene(newScene, OpenWorldScenePath);
            AssetDatabase.Refresh();
            Debug.Log($"[MilitaryOpenWorldSceneBuilder] Created {OpenWorldScenePath}!");
        }

        private static Transform FindDeepChild(Transform parent, string childName)
        {
            if (parent == null) return null;
            if (parent.name == childName) return parent;
            for (int i = 0; i < parent.childCount; i++)
            {
                Transform found = FindDeepChild(parent.GetChild(i), childName);
                if (found != null) return found;
            }
            return null;
        }
    }
}
#endif
