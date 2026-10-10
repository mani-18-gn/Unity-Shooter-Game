#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.InputSystem;
using Roadbound.Core;
using Roadbound.Player;
using Roadbound.Combat;
using Roadbound.UI;

namespace Roadbound.Editor
{
    public static class CombatTestSceneBuilder
    {
        private const string ScenePath = "Assets/Scenes/CombatTestScene.unity";

        [MenuItem("Roadbound/Build Combat Test Scene")]
        public static void BuildSceneIfMissing()
        {
            if (!File.Exists(ScenePath))
            {
                BuildScene();
            }
        }

        [MenuItem("Roadbound/Force Rebuild Combat Test Scene")]
        public static void BuildScene()
        {
            Debug.Log("[CombatTestSceneBuilder] Building CombatTestScene...");

            // 1. Create a new empty scene
            var newScene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            // =========================================================================
            // A. ENVIRONMENT HIERARCHY
            // =========================================================================
            GameObject envRoot = new GameObject("Environment");

            // 1. Ground
            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Cube);
            ground.name = "Ground";
            ground.transform.SetParent(envRoot.transform);
            ground.transform.position = new Vector3(0f, -0.5f, 0f);
            ground.transform.localScale = new Vector3(150f, 1f, 150f);

            // Set ground material color (dark asphalt / military slate)
            var groundRenderer = ground.GetComponent<MeshRenderer>();
            if (groundRenderer != null)
            {
                Material groundMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                groundMat.color = new Color(0.22f, 0.24f, 0.26f);
                groundMat.SetFloat("_Smoothness", 0.2f);
                groundRenderer.material = groundMat;
            }

            // 2. Lighting (Directional Sun)
            GameObject lightObj = new GameObject("Lighting");
            lightObj.transform.SetParent(envRoot.transform);
            Light sun = lightObj.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = new Color(1.0f, 0.96f, 0.90f);
            sun.intensity = 1.3f;
            sun.shadows = LightShadows.Soft;
            lightObj.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

            // =========================================================================
            // B. PLAYER HIERARCHY
            // =========================================================================
            GameObject player = new GameObject("Player");
            player.transform.position = new Vector3(0f, 0f, 0f);

            // Character Controller
            var cc = player.AddComponent<CharacterController>();
            cc.height = 1.8f;
            cc.radius = 0.35f;
            cc.center = new Vector3(0f, 0.9f, 0f);
            cc.stepOffset = 0.3f;
            cc.slopeLimit = 45f;

            // Player Scripts
            var playerHealth = player.AddComponent<PlayerHealth>();
            var inputHandler = player.AddComponent<PlayerInputHandler>();
            var playerCtrl = player.AddComponent<PlayerController>();

            // Assign Input Action Asset
            var inputAsset = AssetDatabase.LoadAssetAtPath<InputActionAsset>("Assets/InputSystem_Actions.inputactions");
            var inputSerialized = new SerializedObject(inputHandler);
            inputSerialized.FindProperty("inputActions").objectReferenceValue = inputAsset;
            inputSerialized.ApplyModifiedProperties();

            // Combat Components
            var inventory = player.AddComponent<WeaponInventory>();
            var fireSystem = player.AddComponent<WeaponFireSystem>();
            var recoil = player.AddComponent<WeaponRecoil>();
            var weaponCtrl = player.AddComponent<WeaponController>();

            // Load Step 2 ScriptableObjects for starting weapons
            var ak47Data = AssetDatabase.LoadAssetAtPath<WeaponData>("Assets/ScriptableObjects/Weapons/Weapon_AK47.asset");
            var umpData = AssetDatabase.LoadAssetAtPath<WeaponData>("Assets/ScriptableObjects/Weapons/Weapon_UMP.asset");
            var grenadeData = AssetDatabase.LoadAssetAtPath<WeaponData>("Assets/ScriptableObjects/Weapons/Weapon_Grenade.asset");

            var invSerialized = new SerializedObject(inventory);
            invSerialized.FindProperty("startingPrimary").objectReferenceValue = ak47Data;
            invSerialized.FindProperty("startingSecondary").objectReferenceValue = umpData;
            invSerialized.FindProperty("startingThrowable").objectReferenceValue = grenadeData;
            invSerialized.ApplyModifiedProperties();

            // Player Visual Representation (Capsule + Visor)
            GameObject playerBody = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            playerBody.name = "BodyMesh";
            playerBody.transform.SetParent(player.transform);
            playerBody.transform.localPosition = new Vector3(0f, 0.9f, 0f);
            playerBody.transform.localScale = new Vector3(0.7f, 0.9f, 0.7f);
            Object.DestroyImmediate(playerBody.GetComponent<Collider>()); // CharacterController handles physics

            var bodyRenderer = playerBody.GetComponent<MeshRenderer>();
            if (bodyRenderer != null)
            {
                Material bodyMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                bodyMat.color = new Color(0.18f, 0.22f, 0.16f); // Military green
                bodyRenderer.material = bodyMat;
            }

            // Visor (Facing forward)
            GameObject visor = GameObject.CreatePrimitive(PrimitiveType.Cube);
            visor.name = "Visor";
            visor.transform.SetParent(player.transform);
            visor.transform.localPosition = new Vector3(0f, 1.45f, 0.26f);
            visor.transform.localScale = new Vector3(0.35f, 0.12f, 0.15f);
            Object.DestroyImmediate(visor.GetComponent<Collider>());

            var visorRenderer = visor.GetComponent<MeshRenderer>();
            if (visorRenderer != null)
            {
                Material visorMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                visorMat.color = new Color(0.95f, 0.75f, 0.1f); // Tactical amber
                visorRenderer.material = visorMat;
            }

            // Muzzle Point Hook
            GameObject muzzleHook = new GameObject("MuzzlePoint");
            muzzleHook.transform.SetParent(player.transform);
            muzzleHook.transform.localPosition = new Vector3(0.32f, 1.25f, 0.55f);

            var fireSerialized = new SerializedObject(fireSystem);
            fireSerialized.FindProperty("defaultMuzzlePoint").objectReferenceValue = muzzleHook.transform;
            fireSerialized.ApplyModifiedProperties();

            // =========================================================================
            // C. CAMERA HIERARCHY
            // =========================================================================
            GameObject camObj = new GameObject("Camera");
            camObj.transform.position = new Vector3(0.45f, 1.6f, -3.5f);
            camObj.tag = "MainCamera";

            var cam = camObj.AddComponent<Camera>();
            cam.nearClipPlane = 0.1f;
            cam.farClipPlane = 1000f;
            cam.fieldOfView = 60f;
            camObj.AddComponent<AudioListener>();

            var camCtrl = camObj.AddComponent<PlayerCameraController>();
            var camSerialized = new SerializedObject(camCtrl);
            camSerialized.FindProperty("target").objectReferenceValue = player.transform;
            camSerialized.FindProperty("targetCamera").objectReferenceValue = cam;
            camSerialized.FindProperty("inputHandler").objectReferenceValue = inputHandler;
            camSerialized.ApplyModifiedProperties();

            // Connect camera to PlayerController & WeaponController
            var pCtrlSerialized = new SerializedObject(playerCtrl);
            pCtrlSerialized.FindProperty("cameraController").objectReferenceValue = camCtrl;
            pCtrlSerialized.ApplyModifiedProperties();

            var wCtrlSerialized = new SerializedObject(weaponCtrl);
            wCtrlSerialized.FindProperty("cameraController").objectReferenceValue = camCtrl;
            wCtrlSerialized.ApplyModifiedProperties();

            var recoilSerialized = new SerializedObject(recoil);
            recoilSerialized.FindProperty("cameraController").objectReferenceValue = camCtrl;
            recoilSerialized.ApplyModifiedProperties();

            // =========================================================================
            // D. TARGETS HIERARCHY
            // =========================================================================
            GameObject targetsRoot = new GameObject("Targets");

            CreateTargetDummy(targetsRoot.transform, "Target_01", new Vector3(0f, 0f, 15f), 100f, new Color(0.85f, 0.35f, 0.35f));
            CreateTargetDummy(targetsRoot.transform, "Target_02", new Vector3(-8f, 0f, 35f), 100f, new Color(0.35f, 0.55f, 0.85f));
            CreateTargetDummy(targetsRoot.transform, "Target_03", new Vector3(10f, 0f, 65f), 150f, new Color(0.85f, 0.75f, 0.25f));

            // =========================================================================
            // E. DEBUG UI
            // =========================================================================
            GameObject uiObj = new GameObject("DebugUI");
            uiObj.AddComponent<CombatTestDebugUI>();

            // =========================================================================
            // SAVE SCENE
            // =========================================================================
            string dir = Path.GetDirectoryName(ScenePath);
            if (!Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            EditorSceneManager.SaveScene(newScene, ScenePath);
            AssetDatabase.Refresh();
            Debug.Log($"[CombatTestSceneBuilder] Successfully created and saved scene at: {ScenePath}");
        }

        private static GameObject CreateTargetDummy(Transform parent, string name, Vector3 pos, float hp, Color color)
        {
            GameObject target = new GameObject(name);
            target.transform.SetParent(parent);
            target.transform.position = pos;

            // Rigidbody
            var rb = target.AddComponent<Rigidbody>();
            rb.isKinematic = true;
            rb.mass = 80f;

            // Torso Primitive
            GameObject torso = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            torso.name = "Torso";
            torso.transform.SetParent(target.transform);
            torso.transform.localPosition = new Vector3(0f, 0.9f, 0f);
            torso.transform.localScale = new Vector3(0.7f, 0.9f, 0.7f);

            var torsoRenderer = torso.GetComponent<MeshRenderer>();
            if (torsoRenderer != null)
            {
                Material dummyMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                dummyMat.color = color;
                torsoRenderer.material = dummyMat;
            }

            // Head Primitive (Headshot hit zone)
            GameObject head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            head.name = "Head";
            head.tag = "Untagged"; // Name contains "Head" which WeaponFireSystem recognizes
            head.transform.SetParent(target.transform);
            head.transform.localPosition = new Vector3(0f, 2.05f, 0f);
            head.transform.localScale = new Vector3(0.42f, 0.42f, 0.42f);

            var headRenderer = head.GetComponent<MeshRenderer>();
            if (headRenderer != null)
            {
                Material headMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                headMat.color = new Color(0.95f, 0.85f, 0.65f);
                headRenderer.material = headMat;
            }

            // Target Component
            var dummyComp = target.AddComponent<CombatDummyTarget>();
            var dummySerialized = new SerializedObject(dummyComp);
            dummySerialized.FindProperty("maxHealth").floatValue = hp;
            dummySerialized.FindProperty("currentHealth").floatValue = hp;
            dummySerialized.FindProperty("targetName").stringValue = name;
            dummySerialized.FindProperty("targetRenderer").objectReferenceValue = torsoRenderer;
            dummySerialized.FindProperty("normalColor").colorValue = color;
            dummySerialized.ApplyModifiedProperties();

            return target;
        }
    }
}
#endif
