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
    public static class CombatSceneValidator
    {
        private const string ScenePath = "Assets/Scenes/CombatTestScene.unity";

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

            // Empirical Kinematic T-Pose Transition Verification:
            Transform rightHandBone = soldierAnim.GetBoneTransform(HumanBodyBones.RightHand);
            Assert.IsNotNull(rightHandBone, "GetBoneTransform(HumanBodyBones.RightHand) returned null");

            Vector3 handBindPos = rightHandBone.position;
            soldierAnim.Update(0.5f);
            Vector3 handAnimatedPos = rightHandBone.position;
            float handDisplacement = Vector3.Distance(handBindPos, handAnimatedPos);

            Assert.Greater(handDisplacement, 0.05f, $"Empirical test failed: soldier right hand displacement ({handDisplacement:F4}m) is too small, soldier remains in T-pose!");

            Debug.Log("[CombatSceneValidator] PASSED! All 7 validation suites passed with ZERO errors!");
        }
    }
}
#endif
