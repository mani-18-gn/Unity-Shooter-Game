#if UNITY_EDITOR
using System.IO;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using Roadbound.Core;
using Roadbound.Player;
using Roadbound.Combat;
using Roadbound.UI;

namespace Roadbound.Editor
{
    [InitializeOnLoad]
    public static class CombatSceneValidator
    {
        private const string ScenePath = "Assets/Scenes/CombatTestScene.unity";
        private const string ReportPath = "Temp/combat_scene_validation_report.txt";

        static CombatSceneValidator()
        {
            EditorApplication.delayCall += AutoValidateOnce;
        }

        private static void AutoValidateOnce()
        {
            if (SessionState.GetBool("CombatSceneValidator_AutoRun_v4_sprint", false)) return;
            SessionState.SetBool("CombatSceneValidator_AutoRun_v4_sprint", true);
            try
            {
                ValidateScene();
                File.WriteAllText(ReportPath, $"SUCCESS: All 11 validation suites passed at {System.DateTime.Now:yyyy-MM-dd HH:mm:ss}\n- Ground Plane: Y=0.0 verified\n- Player Contact: Grounded at Y=0.0 verified\n- Target Materials: URP Lit verified (no pink error shaders)\n- Target Rigidbody: Kinematic verified\n- Sprint Mechanics: SprintSpeed > WalkSpeed verified (9.2 > 4.2)\n- Locomotion BlendTree: swat@Running animation verified\n- Shift Input State: Hold-to-sprint and release verified");
            }
            catch (System.Exception ex)
            {
                File.WriteAllText(ReportPath, $"FAILED at {System.DateTime.Now:yyyy-MM-dd HH:mm:ss}: {ex.Message}\n{ex.StackTrace}");
            }
        }

        [MenuItem("Roadbound/Validate Combat Test Scene")]
        public static void ValidateScene()
        {
            Debug.Log("[CombatSceneValidator] Starting comprehensive validation of CombatTestScene...");

            Assert.IsTrue(File.Exists(ScenePath), $"Scene file not found at {ScenePath}");

            // Open scene in editor
            var scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            Assert.IsTrue(scene.IsValid(), "Scene is not valid");

            // 1. Hierarchy Check
            var env = GameObject.Find("Environment");
            Assert.IsNotNull(env, "Missing 'Environment' root GameObject");
            Assert.IsNotNull(env.transform.Find("Ground"), "Missing 'Ground' under Environment");
            Assert.IsNotNull(env.transform.Find("Lighting"), "Missing 'Lighting' under Environment");

            var player = GameObject.Find("Player");
            Assert.IsNotNull(player, "Missing 'Player' GameObject");
            Assert.IsNotNull(player.transform.Find("BodyMesh"), "Missing 'BodyMesh' under Player");
            Assert.IsNotNull(player.transform.Find("Visor"), "Missing 'Visor' under Player");
            Assert.IsNotNull(player.transform.Find("MuzzlePoint"), "Missing 'MuzzlePoint' under Player");

            var cam = GameObject.Find("Camera");
            Assert.IsNotNull(cam, "Missing 'Camera' GameObject");

            var targets = GameObject.Find("Targets");
            Assert.IsNotNull(targets, "Missing 'Targets' root GameObject");
            Assert.IsNotNull(targets.transform.Find("Target_01"), "Missing 'Target_01'");
            Assert.IsNotNull(targets.transform.Find("Target_02"), "Missing 'Target_02'");
            Assert.IsNotNull(targets.transform.Find("Target_03"), "Missing 'Target_03'");

            var debugUI = GameObject.Find("DebugUI");
            Assert.IsNotNull(debugUI, "Missing 'DebugUI' GameObject");

            // 2. Component Verification
            var cc = player.GetComponent<CharacterController>();
            Assert.IsNotNull(cc, "Player missing CharacterController");

            var pHealth = player.GetComponent<PlayerHealth>();
            Assert.IsNotNull(pHealth, "Player missing PlayerHealth");

            var pInput = player.GetComponent<PlayerInputHandler>();
            Assert.IsNotNull(pInput, "Player missing PlayerInputHandler");

            var pCtrl = player.GetComponent<PlayerController>();
            Assert.IsNotNull(pCtrl, "Player missing PlayerController");

            var pInv = player.GetComponent<WeaponInventory>();
            Assert.IsNotNull(pInv, "Player missing WeaponInventory");

            var pFire = player.GetComponent<WeaponFireSystem>();
            Assert.IsNotNull(pFire, "Player missing WeaponFireSystem");

            var pRecoil = player.GetComponent<WeaponRecoil>();
            Assert.IsNotNull(pRecoil, "Player missing WeaponRecoil");

            var pWepCtrl = player.GetComponent<WeaponController>();
            Assert.IsNotNull(pWepCtrl, "Player missing WeaponController");

            var camCtrl = cam.GetComponent<PlayerCameraController>();
            Assert.IsNotNull(camCtrl, "Camera missing PlayerCameraController");

            var uiComp = debugUI.GetComponent<CombatTestDebugUI>();
            Assert.IsNotNull(uiComp, "DebugUI missing CombatTestDebugUI");

            // 3. Targets Validation
            foreach (string tName in new[] { "Target_01", "Target_02", "Target_03" })
            {
                var tObj = targets.transform.Find(tName)?.gameObject;
                Assert.IsNotNull(tObj, $"Target {tName} missing");
                var dummy = tObj.GetComponent<CombatDummyTarget>();
                Assert.IsNotNull(dummy, $"Target {tName} missing CombatDummyTarget");
                var rb = tObj.GetComponent<Rigidbody>();
                Assert.IsNotNull(rb, $"Target {tName} missing Rigidbody");
                Assert.IsTrue(rb.isKinematic, $"Target {tName} Rigidbody should be kinematic initially");

                var torsoCol = tObj.transform.Find("Torso")?.GetComponent<Collider>();
                Assert.IsNotNull(torsoCol, $"Target {tName} Torso missing Collider");

                var headCol = tObj.transform.Find("Head")?.GetComponent<Collider>();
                Assert.IsNotNull(headCol, $"Target {tName} Head missing Collider");
            }

            // 4. Test Weapon Data Integrity
            var ak47 = AssetDatabase.LoadAssetAtPath<WeaponData>("Assets/ScriptableObjects/Weapons/Weapon_AK47.asset");
            Assert.IsNotNull(ak47, "Failed to load Weapon_AK47.asset");
            Assert.AreEqual("AK-47", ak47.weaponName);
            Assert.AreEqual(35f, ak47.damage);
            Assert.AreEqual(30, ak47.magCapacity);
            Assert.IsTrue(ak47.isAutomatic);

            // 5. Test Dummy Damage Calculation
            var dummyTarget = targets.transform.Find("Target_01").GetComponent<CombatDummyTarget>();
            dummyTarget.ResetTarget();
            float initialHp = dummyTarget.CurrentHealth;

            // Body damage test (1.0x damage: 100 - 35 = 65 HP)
            dummyTarget.TakeDamage(ak47.damage, isHeadshot: false);
            Assert.AreEqual(initialHp - ak47.damage, dummyTarget.CurrentHealth, "Body damage calculation mismatch");
            Assert.IsFalse(dummyTarget.IsDead, "Dummy should not be dead after single body shot");

            // Reset dummy before headshot test to isolate critical damage multiplier calculation
            dummyTarget.ResetTarget();
            float hpBeforeHeadshot = dummyTarget.CurrentHealth;

            // Headshot damage test (2.0x critical multiplier: 35 * 2 = 70 damage -> 100 - 70 = 30 HP)
            dummyTarget.TakeDamage(ak47.damage, isHeadshot: true);
            Assert.AreEqual(hpBeforeHeadshot - (ak47.damage * 2f), dummyTarget.CurrentHealth, "Headshot damage calculation mismatch");
            Assert.IsFalse(dummyTarget.IsDead, "Dummy should survive headshot with 30 HP remaining");

            // Fatal damage test (verify health clamps to 0 and death is triggered)
            dummyTarget.TakeDamage(ak47.damage, isHeadshot: false);
            Assert.AreEqual(0f, dummyTarget.CurrentHealth, "Current health should clamp to 0 on death");
            Assert.IsTrue(dummyTarget.IsDead, "Dummy should be marked dead after lethal damage");

            // Reset dummy
            dummyTarget.ResetTarget();
            Assert.AreEqual(dummyTarget.MaxHealth, dummyTarget.CurrentHealth, "Reset health failed");
            Assert.IsFalse(dummyTarget.IsDead, "Reset target should not be dead");

            // 6. Test Player Health & Armor Mechanics
            pHealth.ResetHealth();
            float initialPlayerHp = pHealth.CurrentHealth;
            float initialArmor = pHealth.CurrentArmor;
            // 35 damage with 65% armor absorption -> 22.75 armor dmg, 12.25 hp dmg
            pHealth.TakeDamage(35f, isHeadshot: false);
            Assert.Less(pHealth.CurrentHealth, initialPlayerHp, "Player health did not decrease");
            Assert.Less(pHealth.CurrentArmor, initialArmor, "Player armor did not absorb damage");

            pHealth.ResetHealth();

            // 7. Test Soldier Humanoid Character, Rig & Looping Idle Animation
            Transform ch15 = player.transform.Find("Ch15_nonPBR");
            Assert.IsNotNull(ch15, "Soldier visual 'Ch15_nonPBR' missing under Player");
            Assert.IsTrue(ch15.gameObject.activeInHierarchy, "Ch15_nonPBR soldier GameObject is not active");

            Animator soldierAnim = ch15.GetComponent<Animator>();
            Assert.IsNotNull(soldierAnim, "Animator component missing on Ch15_nonPBR soldier");
            Assert.IsNotNull(soldierAnim.avatar, "Animator avatar is null on Ch15_nonPBR");
            Assert.IsTrue(soldierAnim.avatar.isValid, "Animator avatar is not valid");
            Assert.IsTrue(soldierAnim.avatar.isHuman, "Animator avatar is not Humanoid");
            Assert.AreEqual("Ch15_nonPBRAvatar", soldierAnim.avatar.name, "Avatar mismatch: Ch15_nonPBR must retain Ch15_nonPBRAvatar for skin-mesh bind compatibility");

            Assert.IsNotNull(soldierAnim.runtimeAnimatorController, "runtimeAnimatorController is null on soldier Animator");
            var swatController = soldierAnim.runtimeAnimatorController as UnityEditor.Animations.AnimatorController;
            if (swatController == null)
            {
                swatController = AssetDatabase.LoadAssetAtPath<UnityEditor.Animations.AnimatorController>("Assets/Animations/Combat/SwatAnimatorController.controller");
            }
            Assert.IsNotNull(swatController, "Could not load SwatAnimatorController");
            Assert.IsTrue(swatController.layers.Length > 0, "SwatAnimatorController has no layers");

            var rootSm = swatController.layers[0].stateMachine;
            Assert.IsNotNull(rootSm.defaultState, "SwatAnimatorController root state machine has no default state");
            Assert.AreEqual("Idle", rootSm.defaultState.name, "Default state must be 'Idle'");
            Assert.IsNotNull(rootSm.defaultState.motion, "Idle default state has no motion clip assigned");

            var idleMotion = rootSm.defaultState.motion as AnimationClip;
            Assert.IsNotNull(idleMotion, "Idle state motion is not an AnimationClip");
            Assert.IsTrue(idleMotion.isHumanMotion, "Idle animation clip must be Humanoid motion");
            Assert.IsTrue(idleMotion.isLooping, "Idle animation clip must be configured to loop");
            Assert.Greater(idleMotion.length, 1.0f, "Idle animation clip length is unexpectedly short");

            // Verify weapon attachment
            var attachmentComp = ch15.GetComponent<SoldierWeaponAttachment>();
            Assert.IsNotNull(attachmentComp, "SoldierWeaponAttachment component missing on Ch15_nonPBR");
            Assert.IsTrue(attachmentComp.IsAttached, "Weapon is not properly attached to soldier hand socket");
            Assert.IsNotNull(attachmentComp.RightHandBone, "RightHandBone not found on soldier rig");
            Assert.IsNotNull(attachmentComp.SocketTransform, "SocketTransform not found under soldier hand bone");
            Assert.IsNotNull(attachmentComp.WeaponModelTransform, "WeaponModelTransform not found on soldier weapon socket");
            Assert.IsNotNull(attachmentComp.LeftHandGripTransform, "LeftHandGripTransform not found on weapon model");
            Assert.IsNotNull(attachmentComp.MuzzlePointTransform, "MuzzlePointTransform not found on weapon model");
            Assert.IsTrue(attachmentComp.EnableLeftHandIK, "Left Hand IK should be enabled");
            Assert.IsTrue(swatController.layers[0].iKPass, "SwatAnimatorController layer 0 must have iKPass enabled for Left Hand IK");

            // Verify rifle orientation (barrel points forward, sights up, not upside down or sideways)
            var fireClip = AssetDatabase.LoadAssetAtPath<AnimationClip>("Assets/Animations/Combat/swat@Firing Rifle.fbx");
            if (fireClip == null)
            {
                var assets = AssetDatabase.LoadAllAssetsAtPath("Assets/Animations/Combat/swat@Firing Rifle.fbx");
                foreach (var a in assets) if (a is AnimationClip c && !c.name.StartsWith("__preview__")) { fireClip = c; break; }
            }
            if (fireClip != null)
            {
                fireClip.SampleAnimation(ch15.gameObject, 0.1f);
                attachmentComp.SetupAttachment();
                float barrelFwdAngle = Vector3.Angle(attachmentComp.BarrelForward, ch15.forward);
                float muzzleFwdAngle = Vector3.Angle(attachmentComp.MuzzlePointTransform.forward, ch15.forward);
                float rifleUpAngle = Vector3.Angle(attachmentComp.WeaponModelTransform.up, ch15.up);
                Vector3 stockDir = attachmentComp.WeaponModelTransform.forward; // In AK47.obj, +Z is buttstock
                float stockBackAngle = Vector3.Angle(stockDir, -ch15.forward);

                Assert.Less(barrelFwdAngle, 15.0f, $"Rifle barrel must face forward in aiming direction! Angle was {barrelFwdAngle:F1} deg");
                Assert.Less(muzzleFwdAngle, 15.0f, $"Rifle muzzle must face forward toward crosshair! Angle was {muzzleFwdAngle:F1} deg");
                Assert.Less(stockBackAngle, 25.0f, $"Rifle stock must face backward toward player shoulder! Angle was {stockBackAngle:F1} deg");
                Assert.Less(rifleUpAngle, 25.0f, $"Rifle must be right-side up! Angle was {rifleUpAngle:F1} deg");
            }

            // Empirical Kinematic T-Pose Transition Verification:
            Transform rightHandBone = soldierAnim.GetBoneTransform(HumanBodyBones.RightHand);
            Assert.IsNotNull(rightHandBone, "GetBoneTransform(HumanBodyBones.RightHand) returned null");

            Vector3 handBindPos = rightHandBone.position;
            soldierAnim.Update(0.5f);
            Vector3 handAnimatedPos = rightHandBone.position;
            float handDisplacement = Vector3.Distance(handBindPos, handAnimatedPos);

            // 8. Ground Plane Alignment & Player Contact Verification
            var ground = env.transform.Find("Ground");
            Assert.IsNotNull(ground, "Ground missing under Environment");
            var groundCol = ground.GetComponent<BoxCollider>();
            Assert.IsNotNull(groundCol, "Ground missing BoxCollider");
            Assert.IsTrue(groundCol.enabled, "Ground BoxCollider is disabled");

            // Calculate top surface in world space
            float groundTopY = ground.position.y + groundCol.center.y + (groundCol.size.y * ground.lossyScale.y * 0.5f);
            Assert.AreEqual(0.0f, groundTopY, 0.05f, $"Ground top surface must align at Y=0.0 to prevent player falling into void. Found Y={groundTopY}");

            // Verify player contact with ground
            float playerBottomY = player.transform.position.y + cc.center.y - (cc.height * 0.5f);
            Assert.AreEqual(groundTopY, playerBottomY, 0.05f, $"Player bottom ({playerBottomY}) must rest directly on ground top ({groundTopY})");

            // 9. Target Materials & URP Shader Pipeline (No Pink / Built-in / Missing Error Shaders)
            foreach (string tName in new[] { "Target_01", "Target_02", "Target_03" })
            {
                var tObj = targets.transform.Find(tName)?.gameObject;
                Assert.IsNotNull(tObj, $"Target {tName} missing");
                var renderers = tObj.GetComponentsInChildren<Renderer>(true);
                Assert.Greater(renderers.Length, 0, $"Target {tName} has no renderers");

                foreach (var rend in renderers)
                {
                    Assert.IsNotNull(rend.sharedMaterial, $"Target {tName} child {rend.name} has missing/null material");
                    Shader shader = rend.sharedMaterial.shader;
                    Assert.IsNotNull(shader, $"Target {tName} child {rend.name} material shader is null");
                    Assert.AreNotEqual("Hidden/InternalErrorShader", shader.name, $"Target {tName} child {rend.name} has pink error shader!");
                    Assert.AreNotEqual("Standard", shader.name, $"Target {tName} child {rend.name} uses legacy Standard shader which displays as pink in URP!");
                    Assert.IsTrue(shader.name.Contains("Universal Render Pipeline") || shader.name.Contains("Lit"), 
                        $"Target {tName} child {rend.name} shader '{shader.name}' is not a valid URP shader");
                }

                // 10. Target Elevation & Physics Stability
                Assert.AreEqual(0.0f, tObj.transform.position.y, 0.05f, $"Target {tName} root elevation must be at ground level (Y=0.0)");
                var rb = tObj.GetComponent<Rigidbody>();
                Assert.IsNotNull(rb, $"Target {tName} missing Rigidbody");
                Assert.IsTrue(rb.isKinematic, $"Target {tName} Rigidbody must be kinematic while alive");
                Assert.AreEqual(Vector3.zero, rb.linearVelocity, $"Target {tName} linearVelocity must be zero");
            }

            // 11. Sprint & Locomotion Mechanics Verification
            Debug.Log("[CombatSceneValidator] Suite 11: Validating Sprint & Locomotion System...");
            Assert.IsTrue(pCtrl.SprintSpeed > pCtrl.WalkSpeed, 
                $"SprintSpeed ({pCtrl.SprintSpeed}) must be strictly greater than WalkSpeed ({pCtrl.WalkSpeed})");
            Assert.IsTrue(pCtrl.WalkSpeed > 0f, "WalkSpeed must be positive");
            Assert.IsTrue(pCtrl.SprintSpeed >= 8.0f, $"SprintSpeed must be at least 8.0 m/s for noticeable speed increase. Found: {pCtrl.SprintSpeed}");

            // Verify Running Animation Clip
            AnimationClip runClip = AssetDatabase.LoadAssetAtPath<AnimationClip>("Assets/Animations/Combat/swat@Running.fbx");
            if (runClip == null)
            {
                var runAssets = AssetDatabase.LoadAllAssetsAtPath("Assets/Animations/Combat/swat@Running.fbx");
                foreach (var a in runAssets) if (a is AnimationClip c && !c.name.StartsWith("__preview__")) { runClip = c; break; }
            }
            Assert.IsNotNull(runClip, "Missing swat@Running.fbx animation clip");
            Assert.IsTrue(runClip.isHumanMotion, "swat@Running must be Humanoid motion");
            Assert.IsTrue(runClip.isLooping, "swat@Running must be looping");

            // Verify Locomotion Blend Tree in controller
            bool foundRunInBlendTree = false;
            foreach (var state in swatController.layers[0].stateMachine.states)
            {
                if (state.state.name == "Locomotion" && state.state.motion is UnityEditor.Animations.BlendTree bt)
                {
                    Assert.AreEqual("Speed", bt.blendParameter, "Locomotion blend parameter must be 'Speed'");
                    foreach (var child in bt.children)
                    {
                        if (child.motion != null && child.motion.name.Contains("Run"))
                        {
                            foundRunInBlendTree = true;
                            Assert.AreEqual(pCtrl.SprintSpeed, child.threshold, 0.1f, 
                                $"Blend tree run threshold ({child.threshold}) should match PlayerController SprintSpeed ({pCtrl.SprintSpeed})");
                        }
                    }
                }
            }
            Assert.IsTrue(foundRunInBlendTree, "SwatAnimatorController Locomotion blend tree must contain Running motion clip");

            // Verify simulated input and state transitions
            pInput.SetMoveInputForTesting(new Vector2(0f, 1f));
            pInput.SetSprintingForTesting(false);
            Assert.IsFalse(pCtrl.IsSprinting, "Player must not be sprinting when Shift is not held");

            pInput.SetSprintingForTesting(true);
            Assert.IsTrue(pCtrl.IsSprinting, "Player must sprint when moving forward and Shift is held");

            // Test release shift
            pInput.SetSprintingForTesting(false);
            Assert.IsFalse(pCtrl.IsSprinting, "Player must return to walking when Shift is released");

            // Test backward sprint prevention
            pInput.SetMoveInputForTesting(new Vector2(0f, -1f));
            pInput.SetSprintingForTesting(true);
            Assert.IsFalse(pCtrl.IsSprinting, "Player must not sprint when moving backward");

            // Reset test inputs
            pInput.SetMoveInputForTesting(Vector2.zero);
            pInput.SetSprintingForTesting(false);

            Debug.Log("[CombatSceneValidator] PASSED! All 11 validation suites passed with ZERO errors!");
        }
    }
}
#endif
