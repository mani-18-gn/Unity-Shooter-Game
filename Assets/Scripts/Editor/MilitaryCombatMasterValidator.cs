#if UNITY_EDITOR
using System.IO;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using Roadbound.Core;
using Roadbound.Player;
using Roadbound.Combat;
using Roadbound.Vehicles;
using Roadbound.AI;
using Roadbound.World;
using Roadbound.UI;

namespace Roadbound.Editor
{
    public static class MilitaryCombatMasterValidator
    {
        private const string ScenePath = "Assets/Scenes/CombatTestScene.unity";

        [MenuItem("Roadbound/Validate All Systems (Master Verification)")]
        public static void ValidateAll()
        {
            Debug.Log("==================================================================");
            Debug.Log("[MilitaryCombatMasterValidator] Starting Full Master Verification...");
            Debug.Log("==================================================================");

            // 1. Run Original Suite
            Debug.Log("[Suite 1/6] Running Original CombatSceneValidator suite...");
            CombatSceneValidator.ValidateScene();

            // 2. Validate Character & Animation Assets
            Debug.Log("[Suite 2/6] Validating Humanoid Character & Animations...");
            Assert.IsTrue(File.Exists("Assets/Characters/Swat/swat@T-Pose.fbx"), "Missing SWAT T-Pose FBX");
            Assert.IsTrue(File.Exists("Assets/Characters/Swat/swat@T-Pose.fbm/Soldier_Body_diffuse.png"), "Missing SWAT Body Diffuse");
            Assert.IsTrue(File.Exists("Assets/Characters/Swat/swat@T-Pose.fbm/Soldier_head_diffuse.png"), "Missing SWAT Head Diffuse");

            Assert.IsTrue(File.Exists("Assets/Animations/Combat/swat@Idle.fbx"), "Missing Idle animation");
            Assert.IsTrue(File.Exists("Assets/Animations/Combat/swat@Walking.fbx"), "Missing Walking animation");
            Assert.IsTrue(File.Exists("Assets/Animations/Combat/swat@Running.fbx"), "Missing Running animation");
            Assert.IsTrue(File.Exists("Assets/Animations/Combat/swat@Firing Rifle.fbx"), "Missing Firing animation");
            Assert.IsTrue(File.Exists("Assets/Animations/Combat/Swat@Crouch Idle.fbx"), "Missing Crouch Idle animation");
            Assert.IsTrue(File.Exists("Assets/Animations/Combat/swat@Standing Death Backward 01.fbx"), "Missing Death animation");

            var animCtrl = AssetDatabase.LoadAssetAtPath<RuntimeAnimatorController>("Assets/Animations/Combat/SwatAnimatorController.controller");
            Assert.IsNotNull(animCtrl, "Missing SwatAnimatorController.controller");

            // 3. Validate Weapon & Audio Assets
            Debug.Log("[Suite 3/6] Validating Realistic 3D Weapons & Audio...");
            Assert.IsTrue(File.Exists("Assets/Weapons/AK47.obj"), "Missing AK47 3D model");
            Assert.IsTrue(File.Exists("Assets/Weapons/tripo_material_ecf4e286-8f2d-403f-a94b-b9477b29ff50.png"), "Missing AK47 PBR texture");

            Assert.IsTrue(File.Exists("Assets/Audio/Combat/GunShot.mp3"), "Missing GunShot.mp3");
            Assert.IsTrue(File.Exists("Assets/Audio/Combat/single_bullet_fire.mp3"), "Missing single_bullet_fire.mp3");
            Assert.IsTrue(File.Exists("Assets/Audio/Combat/reload.mp3"), "Missing reload.mp3");
            Assert.IsTrue(File.Exists("Assets/Audio/Combat/bullet_hit.mp3"), "Missing bullet_hit.mp3");
            Assert.IsTrue(File.Exists("Assets/Audio/Combat/explosion.mp3"), "Missing explosion.mp3");

            // 4. Validate Poly Haven PBR Environment Props
            Debug.Log("[Suite 4/6] Validating PBR Environment Props...");
            Assert.IsTrue(File.Exists("Assets/Environment/Props/ammo_box/ammo_box.fbx"), "Missing ammo_box.fbx");
            Assert.IsTrue(File.Exists("Assets/Environment/Props/old_military_crate/old_military_crate.fbx"), "Missing old_military_crate.fbx");
            Assert.IsTrue(File.Exists("Assets/Environment/Props/concrete_road_barrier/concrete_road_barrier.fbx"), "Missing concrete_road_barrier.fbx");
            Assert.IsTrue(File.Exists("Assets/Environment/Props/medical_box/medical_box.fbx"), "Missing medical_box.fbx");
            Assert.IsTrue(File.Exists("Assets/Environment/Props/coast_rocks_01/coast_rocks_01.fbx"), "Missing coast_rocks_01.fbx");

            // 5. Validate Upgraded Scene Integration
            Debug.Log("[Suite 5/6] Validating Scene Integration...");
            var scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            Assert.IsTrue(scene.IsValid(), "Failed to open CombatTestScene");

            var player = GameObject.Find("Player");
            Assert.IsNotNull(player, "Missing Player");
            Assert.IsNotNull(player.GetComponent<CombatAudioManager>(), "Missing CombatAudioManager on Player");
            Assert.IsNotNull(player.GetComponent<CombatEffectsSystem>(), "Missing CombatEffectsSystem on Player");

            var env = GameObject.Find("Environment");
            Assert.IsNotNull(env, "Missing Environment");

            // 6. Test Combat Simulation End-to-End
            Debug.Log("[Suite 6/6] Testing Damage & Audio Systems End-to-End...");
            var target01 = GameObject.Find("Targets/Target_01")?.GetComponent<CombatDummyTarget>();
            Assert.IsNotNull(target01, "Target_01 dummy missing");

            float hpBefore = target01.CurrentHealth;
            target01.TakeDamage(25f, false);
            Assert.AreEqual(hpBefore - 25f, target01.CurrentHealth, "Dummy health did not decrease by exact 25 damage");
            target01.ResetTarget();

            Debug.Log("==================================================================");
            Debug.Log("[MilitaryCombatMasterValidator] ALL 6 SUITES PASSED WITH 100% SUCCESS!");
            Debug.Log("==================================================================");
        }
    }
}
#endif
