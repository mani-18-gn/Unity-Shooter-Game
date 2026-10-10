#if UNITY_EDITOR
using System;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using Roadbound.Combat;
using Roadbound.Player;

namespace Roadbound.Editor
{
    public static class ForensicWeaponAlignmentTool
    {
        private const string OutputPath = "Temp/weapon_orientation_forensic.txt";
        private const string ScenePath = "Assets/Scenes/CombatTestScene.unity";

        [MenuItem("Roadbound/Forensic Weapon Alignment Analysis")]
        public static void AnalyzeAndCalibrate()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== WEAPON ORIENTATION FORENSIC ANALYSIS ===");

            if (!EditorApplication.isPlaying)
            {
                EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            }
            var player = GameObject.Find("Player") ?? GameObject.Find("Player_Soldier");
            if (player == null)
            {
                var pc = UnityEngine.Object.FindFirstObjectByType<PlayerController>();
                if (pc != null) player = pc.gameObject;
            }

            if (player == null)
            {
                sb.AppendLine("ERROR: Player not found!");
                File.WriteAllText(OutputPath, sb.ToString());
                return;
            }

            var anim = player.GetComponentInChildren<Animator>();
            var attachment = player.GetComponentInChildren<SoldierWeaponAttachment>();

            sb.AppendLine($"Player: {player.name}, Root Position: {player.transform.position}, Forward: {player.transform.forward}");
            sb.AppendLine($"Animator: {(anim != null ? anim.name : "NULL")}, Attachment: {(attachment != null ? "Present" : "NULL")}");

            // 1. Mesh inspection
            var mf = attachment != null ? attachment.WeaponModelTransform : null;
            sb.AppendLine($"AK47_Model transform found: {(mf != null ? "YES" : "NO")}");

            // 2. Load animations
            string[] clipPaths = {
                "Assets/Animations/Combat/swat@Idle.fbx",
                "Assets/Animations/Combat/swat@Firing Rifle.fbx",
                "Assets/Animations/Combat/swat@Walking.fbx",
                "Assets/Animations/Combat/swat@Run.fbx"
            };

            foreach (var cp in clipPaths)
            {
                var objs = AssetDatabase.LoadAllAssetsAtPath(cp);
                AnimationClip clip = null;
                foreach (var o in objs)
                {
                    if (o is AnimationClip c && !c.name.StartsWith("__preview__"))
                    {
                        clip = c;
                        break;
                    }
                }

                if (clip != null)
                {
                    clip.SampleAnimation(player, 0f);
                    if (attachment != null) attachment.SetupAttachment();

                    Transform rHand = anim != null ? anim.GetBoneTransform(HumanBodyBones.RightHand) : null;
                    Transform lHand = anim != null ? anim.GetBoneTransform(HumanBodyBones.LeftHand) : null;
                    Transform rShoulder = anim != null ? anim.GetBoneTransform(HumanBodyBones.RightShoulder) : null;

                    sb.AppendLine($"\n--- Clip: {clip.name} ---");
                    if (rHand != null)
                    {
                        sb.AppendLine($"RightHand Position: {rHand.position:F4}");
                        sb.AppendLine($"RightHand Rotation Euler: {rHand.eulerAngles:F2}");
                        sb.AppendLine($"RightHand Local Rotation Euler: {rHand.localEulerAngles:F2}");
                        sb.AppendLine($"RightHand Forward: {rHand.forward:F4}");
                        sb.AppendLine($"RightHand Up:      {rHand.up:F4}");
                        sb.AppendLine($"RightHand Right:   {rHand.right:F4}");
                    }
                    if (lHand != null)
                    {
                        sb.AppendLine($"LeftHand Position: {lHand.position:F4}");
                        sb.AppendLine($"LeftHand Rotation Euler: {lHand.eulerAngles:F2}");
                    }
                    if (rShoulder != null)
                    {
                        sb.AppendLine($"RightShoulder Position: {rShoulder.position:F4}");
                    }

                    if (attachment != null && attachment.WeaponModelTransform != null)
                    {
                        var wm = attachment.WeaponModelTransform;
                        sb.AppendLine($"WeaponModel World Pos: {wm.position:F4}");
                        sb.AppendLine($"WeaponModel World Forward (+Z Stock): {wm.forward:F4}");
                        sb.AppendLine($"WeaponModel World Up: {wm.up:F4}");
                        sb.AppendLine($"WeaponModel World Right: {wm.right:F4}");

                        if (attachment.MuzzlePointTransform != null)
                        {
                            sb.AppendLine($"MuzzlePoint World Pos (Barrel Tip): {attachment.MuzzlePointTransform.position:F4}");
                            sb.AppendLine($"MuzzlePoint World Forward: {attachment.MuzzlePointTransform.forward:F4}");
                        }

                        sb.AppendLine($"BarrelForward: {attachment.BarrelForward:F4}");

                        float barrelFwdAngle = Vector3.Angle(attachment.BarrelForward, player.transform.forward);
                        float muzzleFwdAngle = attachment.MuzzlePointTransform != null ? Vector3.Angle(attachment.MuzzlePointTransform.forward, player.transform.forward) : 999f;
                        float stockBackAngle = Vector3.Angle(wm.forward, -player.transform.forward);
                        float rifleUpAngle = Vector3.Angle(wm.up, player.transform.up);

                        sb.AppendLine($"Alignment Analysis:");
                        sb.AppendLine($"  - Barrel Forward Angle to Player: {barrelFwdAngle:F2} deg (PASS < 15 deg)");
                        sb.AppendLine($"  - Muzzle Forward Angle to Player: {muzzleFwdAngle:F2} deg (PASS < 15 deg)");
                        sb.AppendLine($"  - Stock Angle to Backward Shoulder: {stockBackAngle:F2} deg (PASS < 25 deg)");
                        sb.AppendLine($"  - Rifle Sights Upright Angle: {rifleUpAngle:F2} deg (PASS < 25 deg)");
                    }
                }
            }

            File.WriteAllText(OutputPath, sb.ToString());
            Debug.Log("[ForensicTool] Output written to " + OutputPath);
        }
    }
}
#endif
