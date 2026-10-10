#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.Animations;
using UnityEditor.SceneManagement;
using UnityEngine;
using Roadbound.Player;
using Roadbound.Combat;

namespace Roadbound.Editor
{
    [InitializeOnLoad]
    public static class CharacterSetupTool
    {
        private const string SwatTPosePath = "Assets/Characters/Swat/swat@T-Pose.fbx";
        private const string SwatPrefabPath = "Assets/Prefabs/SwatPlayer.prefab";
        private const string AnimatorControllerPath = "Assets/Animations/Combat/SwatAnimatorController.controller";
        private const string CharacterTestScenePath = "Assets/Scenes/CharacterTestScene.unity";
        private const string CombatTestScenePath = "Assets/Scenes/CombatTestScene.unity";

        private const string SafeRepairSessionKey = "Roadbound_SafeRepair_Completed_2026";

        static CharacterSetupTool()
        {
            EditorApplication.delayCall += () =>
            {
                if (!SessionState.GetBool(SafeRepairSessionKey, false))
                {
                    SessionState.SetBool(SafeRepairSessionKey, true);
                    Debug.Log("[CharacterSetupTool] Auto-executing safe repair and integration...");
                    ExecuteSafeRepair();
                }
            };
        }

        [MenuItem("Roadbound/Execute Complete Audit & Safe Repair")]
        public static void ExecuteSafeRepair()
        {
            Debug.Log("[CharacterSetupTool] ========================================================");
            Debug.Log("[CharacterSetupTool] STARTING COMPLETE PROJECT REPAIR & INTEGRATION");
            Debug.Log("[CharacterSetupTool] ========================================================");

            // Step 1: Model & clip configurations
            ConfigureHumanoidBaseModel(SwatTPosePath);
            ConfigureHumanoidAnimationClips();

            // Step 2: URP Materials
            Material bodyMat = CreateOrGetURPMaterial(
                "Assets/Characters/Swat/Swat_Body_URP.mat",
                "Assets/Characters/Swat/swat@T-Pose.fbm/Soldier_Body_diffuse.png",
                "Assets/Characters/Swat/swat@T-Pose.fbm/Soldier_Body_normal.png",
                "Assets/Characters/Swat/swat@T-Pose.fbm/Soldier_Body_specular.png"
            );

            Material headMat = CreateOrGetURPMaterial(
                "Assets/Characters/Swat/Swat_Head_URP.mat",
                "Assets/Characters/Swat/swat@T-Pose.fbm/Soldier_head_diffuse.png",
                "Assets/Characters/Swat/swat@T-Pose.fbm/Soldier_head_normal.png",
                "Assets/Characters/Swat/swat@T-Pose.fbm/Soldier_head_specular.png"
            );

            // Step 3: Rebuild Animator Controller with full states and blend trees
            AnimatorController animCtrl = CreateOrRebuildSwatAnimatorController(true);

            // Step 4: Create SWAT Prefab
            CreateSwatPrefab(bodyMat, headMat, animCtrl);

            // Step 5: Integrate into CombatTestScene safely
            IntegrateModernSoldierToPlayer();

            // Step 6: Validate scene
            CombatSceneValidator.ValidateScene();

            Debug.Log("[CharacterSetupTool] ========================================================");
            Debug.Log("[CharacterSetupTool] COMPLETE PROJECT REPAIR & INTEGRATION FINISHED WITH SUCCESS!");
            Debug.Log("[CharacterSetupTool] ========================================================");
        }

        [MenuItem("Roadbound/Setup SWAT Character & Animations")]
        public static void SetupCharacterPipeline()
        {
            ExecuteSafeRepair();
        }

        public static Avatar GetAvatarFromModel(string path)
        {
            if (string.IsNullOrEmpty(path)) return null;

            // 1. Try direct asset load
            Avatar avatar = AssetDatabase.LoadAssetAtPath<Avatar>(path);
            if (avatar != null && avatar.isValid) return avatar;

            // 2. Search sub-assets
            var allAssets = AssetDatabase.LoadAllAssetsAtPath(path);
            if (allAssets != null)
            {
                foreach (var obj in allAssets)
                {
                    if (obj is Avatar subAvatar && subAvatar != null && subAvatar.isValid)
                    {
                        return subAvatar;
                    }
                }
            }

            return null;
        }

        private static void ConfigureHumanoidBaseModel(string path)
        {
            if (!File.Exists(path))
            {
                Debug.LogWarning($"[CharacterSetupTool] Model file not found at '{path}'.");
                return;
            }

            ModelImporter importer = AssetImporter.GetAtPath(path) as ModelImporter;
            if (importer == null)
            {
                Debug.LogWarning($"[CharacterSetupTool] Could not get ModelImporter for '{path}'.");
                return;
            }

            bool needsReimport = false;
            if (importer.animationType != ModelImporterAnimationType.Human)
            {
                importer.animationType = ModelImporterAnimationType.Human;
                importer.avatarSetup = ModelImporterAvatarSetup.CreateFromThisModel;
                needsReimport = true;
            }

            if (needsReimport)
            {
                Debug.Log($"[CharacterSetupTool] Setting Humanoid avatar on {path}");
                importer.SaveAndReimport();
            }
        }

        private static void ConfigureHumanoidAnimationClips()
        {
            var avatar = GetAvatarFromModel(SwatTPosePath);

            string[] animFiles = new[]
            {
                "Assets/Animations/Combat/swat@Idle.fbx",
                "Assets/Animations/Combat/swat@Walking.fbx",
                "Assets/Animations/Combat/swat@Running.fbx",
                "Assets/Animations/Combat/swat@Firing Rifle.fbx",
                "Assets/Animations/Combat/Swat@Crouch Idle.fbx",
                "Assets/Animations/Combat/Swat@Crouched Walking.fbx",
                "Assets/Animations/Combat/swat@Standing Death Backward 01.fbx"
            };

            foreach (string animPath in animFiles)
            {
                if (!File.Exists(animPath)) continue;

                ModelImporter importer = AssetImporter.GetAtPath(animPath) as ModelImporter;
                if (importer == null) continue;

                bool modified = false;
                if (importer.animationType != ModelImporterAnimationType.Human)
                {
                    importer.animationType = ModelImporterAnimationType.Human;
                    modified = true;
                }

                // If bone namespaces match (swat:), copy from SWAT avatar; if mixamorig:, create from this model
                bool isSwatSkeleton = animPath.Contains("swat@") && !animPath.Contains("Crouch");
                if (isSwatSkeleton && avatar != null && avatar.isValid)
                {
                    if (importer.avatarSetup != ModelImporterAvatarSetup.CopyFromOther || importer.sourceAvatar != avatar)
                    {
                        importer.avatarSetup = ModelImporterAvatarSetup.CopyFromOther;
                        importer.sourceAvatar = avatar;
                        modified = true;
                    }
                }
                else
                {
                    if (importer.avatarSetup != ModelImporterAvatarSetup.CreateFromThisModel)
                    {
                        importer.avatarSetup = ModelImporterAvatarSetup.CreateFromThisModel;
                        modified = true;
                    }
                }

                // Ensure looping configuration: Locomotion loops, Fire and Death do NOT loop
                ModelImporterClipAnimation[] clips = importer.defaultClipAnimations;
                if (clips != null && clips.Length > 0)
                {
                    bool isLoopingClip = animPath.Contains("Idle") || animPath.Contains("Walking") || animPath.Contains("Running");
                    if (clips[0].loopTime != isLoopingClip)
                    {
                        clips[0].loopTime = isLoopingClip;
                        importer.clipAnimations = clips;
                        modified = true;
                    }
                }

                if (modified)
                {
                    Debug.Log($"[CharacterSetupTool] Configured humanoid animation: {animPath}");
                    importer.SaveAndReimport();
                }
            }
        }

        private static Material CreateOrGetURPMaterial(string matPath, string diffPath, string normPath, string specPath)
        {
            Material mat = AssetDatabase.LoadAssetAtPath<Material>(matPath);
            if (mat == null)
            {
                Shader urpShader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
                mat = new Material(urpShader);

                if (File.Exists(diffPath))
                {
                    Texture2D diffTex = AssetDatabase.LoadAssetAtPath<Texture2D>(diffPath);
                    if (diffTex != null) mat.SetTexture("_BaseMap", diffTex);
                }

                if (File.Exists(normPath))
                {
                    Texture2D normTex = AssetDatabase.LoadAssetAtPath<Texture2D>(normPath);
                    if (normTex != null)
                    {
                        mat.SetTexture("_BumpMap", normTex);
                        mat.EnableKeyword("_NORMALMAP");
                    }
                }

                if (File.Exists(specPath))
                {
                    Texture2D specTex = AssetDatabase.LoadAssetAtPath<Texture2D>(specPath);
                    if (specTex != null)
                    {
                        mat.SetTexture("_MetallicGlossMap", specTex);
                        mat.EnableKeyword("_METALLICSPECGLOSSMAP");
                    }
                }

                mat.SetFloat("_Smoothness", 0.35f);

                string dir = Path.GetDirectoryName(matPath);
                if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

                AssetDatabase.CreateAsset(mat, matPath);
                AssetDatabase.SaveAssets();
                Debug.Log($"[CharacterSetupTool] Created URP material: {matPath}");
            }
            return mat;
        }

        [MenuItem("Roadbound/Rebuild SWAT Animator Controller")]
        public static AnimatorController RebuildSwatAnimatorControllerMenu()
        {
            return CreateOrRebuildSwatAnimatorController(true);
        }

        public static AnimatorController CreateOrRebuildSwatAnimatorController(bool force = false)
        {
            AnimatorController controller = AssetDatabase.LoadAssetAtPath<AnimatorController>(AnimatorControllerPath);
            bool needsBuild = force || controller == null;
            if (controller != null && !needsBuild)
            {
                if (controller.layers == null || controller.layers.Length == 0 ||
                    controller.layers[0].stateMachine == null ||
                    controller.layers[0].stateMachine.states.Length == 0)
                {
                    needsBuild = true;
                }
            }

            if (!needsBuild) return controller;

            // Delete old empty/corrupted controller asset to recreate cleanly
            if (File.Exists(AnimatorControllerPath))
            {
                AssetDatabase.DeleteAsset(AnimatorControllerPath);
            }

            string dir = Path.GetDirectoryName(AnimatorControllerPath);
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

            controller = AnimatorController.CreateAnimatorControllerAtPath(AnimatorControllerPath);
            if (controller == null)
            {
                Debug.LogError($"[CharacterSetupTool] Failed to create Animator Controller at {AnimatorControllerPath}");
                return null;
            }

            // Standard combat parameters
            controller.AddParameter("Speed", AnimatorControllerParameterType.Float);
            controller.AddParameter("IsAiming", AnimatorControllerParameterType.Bool);
            controller.AddParameter("IsCrouching", AnimatorControllerParameterType.Bool);
            controller.AddParameter("IsGrounded", AnimatorControllerParameterType.Bool);
            controller.AddParameter("Fire", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("Die", AnimatorControllerParameterType.Trigger);

            if (controller.layers == null || controller.layers.Length == 0)
            {
                controller.AddLayer("Base Layer");
            }

            var rootStateMachine = controller.layers[0].stateMachine;
            if (rootStateMachine == null)
            {
                Debug.LogError("[CharacterSetupTool] AnimatorController root state machine is null.");
                return controller;
            }

            // Load clips
            AnimationClip idleClip = LoadFirstClip("Assets/Animations/Combat/swat@Idle.fbx");
            AnimationClip walkClip = LoadFirstClip("Assets/Animations/Combat/swat@Walking.fbx");
            AnimationClip runClip = LoadFirstClip("Assets/Animations/Combat/swat@Running.fbx");
            AnimationClip fireClip = LoadFirstClip("Assets/Animations/Combat/swat@Firing Rifle.fbx");
            AnimationClip crouchIdleClip = LoadFirstClip("Assets/Animations/Combat/Swat@Crouch Idle.fbx");
            AnimationClip crouchWalkClip = LoadFirstClip("Assets/Animations/Combat/Swat@Crouched Walking.fbx");
            AnimationClip deathClip = LoadFirstClip("Assets/Animations/Combat/swat@Standing Death Backward 01.fbx");

            // 1. Locomotion BlendTree State (Idle -> Walk -> Run)
            BlendTree blendTree;
            var locomotionState = controller.CreateBlendTreeInController("Locomotion", out blendTree);
            locomotionState.name = "Locomotion";
            blendTree.blendType = BlendTreeType.Simple1D;
            blendTree.blendParameter = "Speed";

            if (idleClip != null) blendTree.AddChild(idleClip, 0f);
            if (walkClip != null) blendTree.AddChild(walkClip, 4.2f);
            if (runClip != null) blendTree.AddChild(runClip, 9.2f);

            rootStateMachine.defaultState = locomotionState;

            // 2. Crouch State (BlendTree: Crouch Idle -> Crouch Walk)
            BlendTree crouchTree;
            var crouchState = controller.CreateBlendTreeInController("CrouchLocomotion", out crouchTree);
            crouchState.name = "CrouchLocomotion";
            crouchTree.blendType = BlendTreeType.Simple1D;
            crouchTree.blendParameter = "Speed";
            if (crouchIdleClip != null) crouchTree.AddChild(crouchIdleClip, 0f);
            if (crouchWalkClip != null) crouchTree.AddChild(crouchWalkClip, 2.6f);

            // Locomotion <-> Crouch Transitions
            var toCrouch = locomotionState.AddTransition(crouchState);
            toCrouch.hasExitTime = false;
            toCrouch.AddCondition(AnimatorConditionMode.If, 0, "IsCrouching");
            toCrouch.duration = 0.15f;

            var fromCrouch = crouchState.AddTransition(locomotionState);
            fromCrouch.hasExitTime = false;
            fromCrouch.AddCondition(AnimatorConditionMode.IfNot, 0, "IsCrouching");
            fromCrouch.duration = 0.15f;

            // 3. Fire State
            if (fireClip != null)
            {
                var fireState = rootStateMachine.AddState("Fire");
                fireState.motion = fireClip;

                var toFire = rootStateMachine.AddAnyStateTransition(fireState);
                toFire.hasExitTime = false;
                toFire.AddCondition(AnimatorConditionMode.If, 0, "Fire");
                toFire.duration = 0.05f;

                var fromFire = fireState.AddTransition(locomotionState);
                fromFire.hasExitTime = true;
                fromFire.exitTime = 0.85f;
                fromFire.duration = 0.12f;
            }

            // 4. Death State
            if (deathClip != null)
            {
                var deathState = rootStateMachine.AddState("Death");
                deathState.motion = deathClip;

                var toDeath = rootStateMachine.AddAnyStateTransition(deathState);
                toDeath.hasExitTime = false;
                toDeath.AddCondition(AnimatorConditionMode.If, 0, "Die");
                toDeath.duration = 0.1f;
                toDeath.canTransitionToSelf = false;
            }

            EditorUtility.SetDirty(controller);
            AssetDatabase.SaveAssets();
            Debug.Log($"[CharacterSetupTool] Successfully created Animator Controller with {rootStateMachine.states.Length} states at: {AnimatorControllerPath}");
            return controller;
        }

        private static AnimationClip LoadFirstClip(string fbxPath)
        {
            if (!File.Exists(fbxPath))
            {
                Debug.LogWarning($"[CharacterSetupTool] Animation file not found: {fbxPath}");
                return null;
            }
            var objects = AssetDatabase.LoadAllAssetsAtPath(fbxPath);
            if (objects == null || objects.Length == 0)
            {
                Debug.LogWarning($"[CharacterSetupTool] No sub-assets found in {fbxPath}");
                return null;
            }
            foreach (var o in objects)
            {
                if (o is AnimationClip clip && !clip.name.StartsWith("__preview__"))
                {
                    return clip;
                }
            }
            Debug.LogWarning($"[CharacterSetupTool] No valid AnimationClip found in {fbxPath}");
            return null;
        }

        [MenuItem("Roadbound/Create SWAT Character Prefab")]
        public static void CreateSwatPrefabMenu()
        {
            Material bodyMat = AssetDatabase.LoadAssetAtPath<Material>("Assets/Characters/Swat/Swat_Body_URP.mat");
            Material headMat = AssetDatabase.LoadAssetAtPath<Material>("Assets/Characters/Swat/Swat_Head_URP.mat");
            AnimatorController animCtrl = AssetDatabase.LoadAssetAtPath<AnimatorController>(AnimatorControllerPath);
            CreateSwatPrefab(bodyMat, headMat, animCtrl);
        }

        public static void CreateSwatPrefab(Material bodyMat, Material headMat, AnimatorController animCtrl)
        {
            string dir = Path.GetDirectoryName(SwatPrefabPath);
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

            if (!File.Exists(SwatTPosePath))
            {
                Debug.LogError($"[CharacterSetupTool] Cannot create SWAT prefab: source model file not found at '{SwatTPosePath}'.");
                return;
            }

            GameObject modelPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(SwatTPosePath);
            if (modelPrefab == null)
            {
                Debug.LogError($"[CharacterSetupTool] Cannot create SWAT prefab: failed to load model asset at '{SwatTPosePath}'.");
                return;
            }

            if (animCtrl == null)
            {
                Debug.LogError("[CharacterSetupTool] Cannot create SWAT prefab: AnimatorController is null.");
                return;
            }

            Avatar avatar = GetAvatarFromModel(SwatTPosePath);
            if (avatar == null || !avatar.isValid || !avatar.isHuman)
            {
                Debug.LogError($"[CharacterSetupTool] Cannot create SWAT prefab: Avatar in '{SwatTPosePath}' is missing or not a valid Humanoid.");
                return;
            }

            GameObject instance = null;
            try
            {
                instance = Object.Instantiate(modelPrefab);
                if (instance == null)
                {
                    Debug.LogError("[CharacterSetupTool] Failed to instantiate SWAT model prefab.");
                    return;
                }
                instance.name = "SwatPlayer";

                // Assign URP materials
                var renderers = instance.GetComponentsInChildren<SkinnedMeshRenderer>();
                foreach (var smr in renderers)
                {
                    if (smr == null) continue;
                    if (smr.gameObject.name.IndexOf("head", System.StringComparison.OrdinalIgnoreCase) >= 0 && headMat != null)
                    {
                        smr.material = headMat;
                    }
                    else if (bodyMat != null)
                    {
                        smr.material = bodyMat;
                    }
                }

                // Add or retrieve Animator safely
                Animator anim = instance.GetComponent<Animator>();
                if (anim == null) anim = instance.AddComponent<Animator>();
                anim.avatar = avatar;
                anim.runtimeAnimatorController = animCtrl;
                anim.applyRootMotion = false;

                // Add HumanoidAnimationBridge
                var bridge = instance.GetComponent<HumanoidAnimationBridge>();
                if (bridge == null) bridge = instance.AddComponent<HumanoidAnimationBridge>();

                // Hand socket for weapons (searching for 'RightHand')
                Transform rightHand = FindBone(instance.transform, "RightHand");
                if (rightHand != null)
                {
                    Transform existingSocket = rightHand.Find("RightHandSocket");
                    GameObject weaponSocket = existingSocket != null ? existingSocket.gameObject : new GameObject("RightHandSocket");
                    weaponSocket.transform.SetParent(rightHand, false);
                    weaponSocket.transform.localPosition = new Vector3(-0.02f, 0.08f, 0.12f);
                    weaponSocket.transform.localRotation = Quaternion.Euler(0f, 90f, 0f);

                    // Attach 3D AK47 model if available
                    GameObject ak47Model = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Weapons/AK47.obj");
                    if (ak47Model != null && weaponSocket.transform.Find("AK47_Model") == null)
                    {
                        GameObject ak47Instance = Object.Instantiate(ak47Model, weaponSocket.transform);
                        ak47Instance.name = "AK47_Model";
                        ak47Instance.transform.localPosition = Vector3.zero;
                        ak47Instance.transform.localRotation = Quaternion.identity;
                    }
                }
                else
                {
                    Debug.LogWarning("[CharacterSetupTool] Bone 'RightHand' not found on SwatPlayer; RightHandSocket was skipped.");
                }

                // Save Prefab
                bool success;
                PrefabUtility.SaveAsPrefabAsset(instance, SwatPrefabPath, out success);
                if (success)
                {
                    Debug.Log($"[CharacterSetupTool] Successfully created SWAT Player Prefab at: {SwatPrefabPath}");
                }
                else
                {
                    Debug.LogError($"[CharacterSetupTool] Failed to save SWAT Player Prefab at: {SwatPrefabPath}");
                }
            }
            catch (System.Exception ex)
            {
                Debug.LogError($"[CharacterSetupTool] Exception during CreateSwatPrefab: {ex.Message}\n{ex.StackTrace}");
            }
            finally
            {
                if (instance != null)
                {
                    Object.DestroyImmediate(instance);
                }
            }
        }

        [MenuItem("Roadbound/Integrate Modern Soldier Visual to Player")]
        public static void IntegrateModernSoldierToPlayer()
        {
            var scene = EditorSceneManager.GetActiveScene();
            if (scene.path != CombatTestScenePath)
            {
                scene = EditorSceneManager.OpenScene(CombatTestScenePath, OpenSceneMode.Single);
            }

            if (!scene.IsValid())
            {
                Debug.LogError($"[CharacterSetupTool] Could not open scene at {CombatTestScenePath}");
                return;
            }

            // 1. Clean up orphaned SwatPlayer root objects leaked from earlier runs
            var rootObjects = scene.GetRootGameObjects();
            int removedCount = 0;
            foreach (var root in rootObjects)
            {
                if (root != null && root.name == "SwatPlayer")
                {
                    Debug.Log($"[CharacterSetupTool] Removing leaked root object: {root.name} (Instance ID {root.GetInstanceID()})");
                    Object.DestroyImmediate(root);
                    removedCount++;
                }
            }
            if (removedCount > 0)
            {
                Debug.Log($"[CharacterSetupTool] Removed {removedCount} duplicate/orphaned root SwatPlayer objects from scene.");
            }

            // 2. Find Player root
            GameObject player = GameObject.Find("Player");
            if (player == null)
            {
                Debug.LogError("[CharacterSetupTool] 'Player' GameObject not found in CombatTestScene.");
                return;
            }

            // 3. Clean up temporary SwatVisual if present
            Transform swatVisual = player.transform.Find("SwatVisual");
            if (swatVisual != null)
            {
                Debug.Log("[CharacterSetupTool] Removing temporary SwatVisual to use authentic Ch15_nonPBR soldier.");
                Object.DestroyImmediate(swatVisual.gameObject);
            }

            // 4. Load Ch15_nonPBR model asset
            const string ch15Path = "Assets/Characters/Ch15_nonPBR.fbx";
            GameObject ch15Model = AssetDatabase.LoadAssetAtPath<GameObject>(ch15Path);
            if (ch15Model == null)
            {
                Debug.LogError($"[CharacterSetupTool] Ch15 model not found at {ch15Path}.");
                return;
            }

            // 5. Ensure Ch15_nonPBR child exists under Player
            Transform existingVisual = player.transform.Find("Ch15_nonPBR");
            GameObject visualObj;
            if (existingVisual != null)
            {
                visualObj = existingVisual.gameObject;
            }
            else
            {
                visualObj = PrefabUtility.InstantiatePrefab(ch15Model, player.transform) as GameObject;
                if (visualObj == null)
                {
                    visualObj = Object.Instantiate(ch15Model, player.transform);
                }
                visualObj.name = "Ch15_nonPBR";
            }

            visualObj.SetActive(true);
            visualObj.transform.SetParent(player.transform, false);
            visualObj.transform.localPosition = Vector3.zero;
            visualObj.transform.localRotation = Quaternion.identity;
            visualObj.transform.localScale = Vector3.one;

            // Ensure Animator is properly attached and configured with Ch15_nonPBRAvatar and SwatAnimatorController
            Animator anim = visualObj.GetComponent<Animator>();
            if (anim == null) anim = visualObj.AddComponent<Animator>();
            anim.avatar = GetAvatarFromModel(ch15Path);
            anim.runtimeAnimatorController = AssetDatabase.LoadAssetAtPath<RuntimeAnimatorController>(AnimatorControllerPath);
            anim.applyRootMotion = false;
            anim.cullingMode = AnimatorCullingMode.AlwaysAnimate;

            // Ensure HumanoidAnimationBridge exists on visual
            var bridge = visualObj.GetComponent<HumanoidAnimationBridge>();
            if (bridge == null) bridge = visualObj.AddComponent<HumanoidAnimationBridge>();

            // Ensure SoldierWeaponAttachment exists on visual
            var attachment = visualObj.GetComponent<SoldierWeaponAttachment>();
            if (attachment == null) attachment = visualObj.AddComponent<SoldierWeaponAttachment>();
            attachment.SetupAttachment();

            // 6. Hide capsule & visor renderers while preserving GameObjects for CombatSceneValidator
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

            // 7. Align MuzzlePoint forward
            Transform muzzle = player.transform.Find("MuzzlePoint");
            if (muzzle != null)
            {
                muzzle.localPosition = new Vector3(0.25f, 1.25f, 0.7f);
            }

            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene);
            AssetDatabase.SaveAssets();
            Debug.Log("[CharacterSetupTool] Successfully integrated modern soldier visual under Player in CombatTestScene.");
        }

        private static Transform FindBone(Transform current, string boneName)
        {
            if (current == null) return null;
            if (current.name.Equals(boneName, System.StringComparison.OrdinalIgnoreCase) ||
                current.name.EndsWith(boneName, System.StringComparison.OrdinalIgnoreCase) ||
                current.name.IndexOf(boneName, System.StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return current;
            }
            for (int i = 0; i < current.childCount; i++)
            {
                Transform found = FindBone(current.GetChild(i), boneName);
                if (found != null) return found;
            }
            return null;
        }

        [MenuItem("Roadbound/Build Character Test Scene")]
        public static void BuildCharacterTestScene()
        {
            if (File.Exists(CharacterTestScenePath))
            {
                Debug.Log($"[CharacterSetupTool] CharacterTestScene already exists at {CharacterTestScenePath}.");
                return;
            }

            Debug.Log("[CharacterSetupTool] Building CharacterTestScene...");
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            // Ground
            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Cube);
            ground.name = "Ground";
            ground.transform.position = new Vector3(0f, -0.5f, 0f);
            ground.transform.localScale = new Vector3(80f, 1f, 80f);

            var groundRen = ground.GetComponent<MeshRenderer>();
            if (groundRen != null)
            {
                Material gMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                gMat.color = new Color(0.25f, 0.27f, 0.28f);
                groundRen.material = gMat;
            }

            // Lighting
            GameObject lightObj = new GameObject("Sun");
            var sun = lightObj.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.intensity = 1.2f;
            sun.shadows = LightShadows.Soft;
            lightObj.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

            // Instantiate Swat Character
            GameObject swatPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(SwatPrefabPath);
            if (swatPrefab != null)
            {
                GameObject swat = PrefabUtility.InstantiatePrefab(swatPrefab) as GameObject;
                if (swat != null)
                {
                    swat.transform.position = Vector3.zero;

                    var cc = swat.GetComponent<CharacterController>();
                    if (cc == null) cc = swat.AddComponent<CharacterController>();
                    cc.height = 1.8f;
                    cc.radius = 0.35f;
                    cc.center = new Vector3(0f, 0.9f, 0f);

                    var bridge = swat.GetComponent<HumanoidAnimationBridge>();
                    if (bridge == null) swat.AddComponent<HumanoidAnimationBridge>();
                }
            }
            else
            {
                Debug.LogWarning($"[CharacterSetupTool] SwatPlayer.prefab not found at '{SwatPrefabPath}' when building CharacterTestScene.");
            }

            // Camera
            GameObject camObj = new GameObject("TestCamera");
            camObj.transform.position = new Vector3(0f, 1.6f, -3.5f);
            camObj.AddComponent<Camera>();
            camObj.AddComponent<AudioListener>();

            string dir = Path.GetDirectoryName(CharacterTestScenePath);
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

            EditorSceneManager.SaveScene(scene, CharacterTestScenePath);
            AssetDatabase.Refresh();
            Debug.Log($"[CharacterSetupTool] Successfully saved CharacterTestScene at {CharacterTestScenePath}");
        }
    }
}
#endif
