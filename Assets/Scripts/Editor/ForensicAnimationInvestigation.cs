#if UNITY_EDITOR
using System;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEditor.Animations;
using UnityEditor.SceneManagement;
using UnityEngine;
using Roadbound.Combat;
using Roadbound.Player;

namespace Roadbound.Editor
{
    [InitializeOnLoad]
    public static class ForensicAnimationInvestigation
    {
        private const string OutputPath = "Temp/forensic_anim_report.txt";
        private const string ScenePath = "Assets/Scenes/CombatTestScene.unity";

        static ForensicAnimationInvestigation()
        {
            // Register delayed call to execute once after compile
            EditorApplication.delayCall += RunInspectionOnce;
        }

        private static void RunInspectionOnce()
        {
            if (SessionState.GetBool("ForensicInvestigation_Done_v1", false)) return;
            SessionState.SetBool("ForensicInvestigation_Done_v1", true);

            ExecuteInspection();
        }

        [MenuItem("Roadbound/Run Forensic Animation Investigation")]
        public static void ExecuteInspection()
        {
            var sb = new StringBuilder();
            sb.AppendLine("================================================================================");
            sb.AppendLine("FORENSIC ANIMATION & T-POSE INVESTIGATION REPORT");
            sb.AppendLine($"Timestamp: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
            sb.AppendLine($"Unity Version: {Application.unityVersion}");
            sb.AppendLine("================================================================================\n");

            try
            {
                // 1. Inspect FBX Model & Avatar Asset
                sb.AppendLine("--- 1. MODEL ASSET INSPECTION (Assets/Characters/Ch15_nonPBR.fbx) ---");
                string fbxPath = "Assets/Characters/Ch15_nonPBR.fbx";
                GameObject fbxPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(fbxPath);
                sb.AppendLine($"FBX Prefab Loaded: {(fbxPrefab != null ? fbxPrefab.name : "NULL")}");

                if (fbxPrefab != null)
                {
                    Animator fbxAnim = fbxPrefab.GetComponent<Animator>();
                    sb.AppendLine($"FBX Root Animator: {(fbxAnim != null ? "Present" : "NULL")}");
                    if (fbxAnim != null)
                    {
                        sb.AppendLine($"  - FBX Animator Avatar: {(fbxAnim.avatar != null ? fbxAnim.avatar.name : "NULL")}");
                        sb.AppendLine($"  - FBX Animator Controller: {(fbxAnim.runtimeAnimatorController != null ? fbxAnim.runtimeAnimatorController.name : "NULL")}");
                    }
                }

                UnityEngine.Object[] allAssets = AssetDatabase.LoadAllAssetsAtPath(fbxPath);
                sb.AppendLine($"All Sub-Assets in FBX ({allAssets.Length}):");
                Avatar foundAvatar = null;
                foreach (var asset in allAssets)
                {
                    if (asset is Avatar av)
                    {
                        foundAvatar = av;
                        sb.AppendLine($"  - [Avatar] '{av.name}', isValid={av.isValid}, isHuman={av.isHuman}");
                    }
                }

                // 2. Inspect swat@Idle.fbx
                sb.AppendLine("\n--- 2. IDLE ANIMATION ASSET INSPECTION (Assets/Animations/Combat/swat@Idle.fbx) ---");
                string idlePath = "Assets/Animations/Combat/swat@Idle.fbx";
                UnityEngine.Object[] idleSubAssets = AssetDatabase.LoadAllAssetsAtPath(idlePath);
                AnimationClip idleClip = null;
                Avatar idleAvatar = null;
                foreach (var a in idleSubAssets)
                {
                    if (a is Avatar av)
                    {
                        idleAvatar = av;
                        sb.AppendLine($"  - [Avatar] '{av.name}', isValid={av.isValid}, isHuman={av.isHuman}");
                    }
                    else if (a is AnimationClip c && !c.name.StartsWith("__preview__"))
                    {
                        idleClip = c;
                        sb.AppendLine($"  - [Clip] '{c.name}', length={c.length:F3}s, isLooping={c.isLooping}, isHumanMotion={c.isHumanMotion}, wrapMode={c.wrapMode}");
                    }
                }

                // 3. Inspect SwatAnimatorController.controller
                sb.AppendLine("\n--- 3. ANIMATOR CONTROLLER INSPECTION ---");
                string ctrlPath = "Assets/Animations/Combat/SwatAnimatorController.controller";
                AnimatorController ctrl = AssetDatabase.LoadAssetAtPath<AnimatorController>(ctrlPath);
                if (ctrl == null)
                {
                    sb.AppendLine("ERROR: Controller is NULL!");
                }
                else
                {
                    sb.AppendLine($"Controller Name: {ctrl.name}, Layers: {ctrl.layers.Length}, Parameters: {ctrl.parameters.Length}");
                    foreach (var p in ctrl.parameters)
                    {
                        sb.AppendLine($"  - Param: {p.name} ({p.type}), default={p.defaultFloat}/{p.defaultBool}");
                    }
                    if (ctrl.layers.Length > 0)
                    {
                        var rootSm = ctrl.layers[0].stateMachine;
                        sb.AppendLine($"Layer 0 State Machine: '{rootSm.name}', DefaultState: '{(rootSm.defaultState != null ? rootSm.defaultState.name : "NULL")}'");
                        foreach (var cs in rootSm.states)
                        {
                            var s = cs.state;
                            string motionName = s.motion != null ? s.motion.name : "NULL";
                            sb.AppendLine($"  - State: '{s.name}', Motion: '{motionName}' ({s.motion?.GetType().Name}), Speed={s.speed}");
                        }
                    }
                }

                // 4. Inspect Scene Objects in CombatTestScene
                sb.AppendLine("\n--- 4. SCENE OBJECT INSPECTION (Assets/Scenes/CombatTestScene.unity) ---");
                var currentScene = EditorSceneManager.GetActiveScene();
                if (currentScene.path != ScenePath)
                {
                    currentScene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
                }
                sb.AppendLine($"Active Scene: {currentScene.name} (Valid={currentScene.IsValid()})");

                GameObject player = GameObject.Find("Player");
                if (player == null)
                {
                    sb.AppendLine("ERROR: 'Player' GameObject not found!");
                }
                else
                {
                    sb.AppendLine($"Player GameObject: '{player.name}', active={player.activeSelf}");
                    for (int i = 0; i < player.transform.childCount; i++)
                    {
                        var child = player.transform.GetChild(i);
                        sb.AppendLine($"  Child {i}: '{child.name}', active={child.gameObject.activeSelf}");
                    }

                    Transform ch15 = player.transform.Find("Ch15_nonPBR");
                    if (ch15 == null)
                    {
                        sb.AppendLine("ERROR: Ch15_nonPBR not found under Player!");
                    }
                    else
                    {
                        sb.AppendLine($"Ch15_nonPBR found: active={ch15.gameObject.activeSelf}, localPos={ch15.localPosition}, localRot={ch15.localEulerAngles}");
                        var components = ch15.GetComponents<Component>();
                        foreach (var c in components)
                        {
                            sb.AppendLine($"  Component: {(c != null ? c.GetType().FullName : "NULL (Missing Script)")}");
                        }

                        Animator anim = ch15.GetComponent<Animator>();
                        if (anim == null)
                        {
                            sb.AppendLine("ERROR: Animator component is missing on Ch15_nonPBR!");
                        }
                        else
                        {
                            sb.AppendLine($"Animator Properties:");
                            sb.AppendLine($"  - enabled: {anim.enabled}");
                            sb.AppendLine($"  - avatar: {(anim.avatar != null ? anim.avatar.name : "NULL")}");
                            sb.AppendLine($"  - avatar.isValid: {anim.avatar?.isValid}");
                            sb.AppendLine($"  - avatar.isHuman: {anim.avatar?.isHuman}");
                            sb.AppendLine($"  - isHuman: {anim.isHuman}");
                            sb.AppendLine($"  - runtimeAnimatorController: {(anim.runtimeAnimatorController != null ? anim.runtimeAnimatorController.name : "NULL")}");
                            sb.AppendLine($"  - applyRootMotion: {anim.applyRootMotion}");
                            sb.AppendLine($"  - cullingMode: {anim.cullingMode}");
                            sb.AppendLine($"  - hasTransformHierarchy: {anim.hasTransformHierarchy}");

                            // Test Bone Mapping
                            Transform rightHand = anim.GetBoneTransform(HumanBodyBones.RightHand);
                            Transform leftHand = anim.GetBoneTransform(HumanBodyBones.LeftHand);
                            Transform head = anim.GetBoneTransform(HumanBodyBones.Head);
                            Transform hips = anim.GetBoneTransform(HumanBodyBones.Hips);

                            sb.AppendLine($"Bone Transforms via Avatar:");
                            sb.AppendLine($"  - Hips: {(hips != null ? hips.name : "NULL")}, pos={hips?.position}");
                            sb.AppendLine($"  - Head: {(head != null ? head.name : "NULL")}, pos={head?.position}");
                            sb.AppendLine($"  - RightHand: {(rightHand != null ? rightHand.name : "NULL")}, pos={rightHand?.position}");
                            sb.AppendLine($"  - LeftHand: {(leftHand != null ? leftHand.name : "NULL")}, pos={leftHand?.position}");

                            // 5. Test Pose Evaluation in Edit Mode
                            sb.AppendLine("\n--- 5. EDIT MODE POSE SAMPLING ---");
                            Vector3 rhPosBind = rightHand != null ? rightHand.position : Vector3.zero;
                            Vector3 lhPosBind = leftHand != null ? leftHand.position : Vector3.zero;
                            sb.AppendLine($"Bind Pose Right Hand Pos: {rhPosBind}");
                            sb.AppendLine($"Bind Pose Left Hand Pos: {lhPosBind}");

                            // Sample animation
                            anim.Update(0f);
                            sb.AppendLine($"State at t=0: Hash={anim.GetCurrentAnimatorStateInfo(0).fullPathHash}, IsIdle={anim.GetCurrentAnimatorStateInfo(0).IsName("Idle")}");
                            sb.AppendLine($"Right Hand Pos at t=0: {rightHand?.position}");
                            sb.AppendLine($"Left Hand Pos at t=0: {leftHand?.position}");

                            anim.Update(0.5f);
                            sb.AppendLine($"Right Hand Pos at t=0.5s: {rightHand?.position}");
                            sb.AppendLine($"Left Hand Pos at t=0.5s: {leftHand?.position}");

                            float rhDist = Vector3.Distance(rhPosBind, rightHand != null ? rightHand.position : Vector3.zero);
                            float lhDist = Vector3.Distance(lhPosBind, leftHand != null ? leftHand.position : Vector3.zero);
                            sb.AppendLine($"Displacement from Bind Pose -> Idle Pose (RH): {rhDist:F4}m");
                            sb.AppendLine($"Displacement from Bind Pose -> Idle Pose (LH): {lhDist:F4}m");

                            if (rhDist > 0.05f)
                            {
                                sb.AppendLine("VERIFIED: Model clearly leaves T-pose when Animator evaluates Idle!");
                            }
                            else
                            {
                                sb.AppendLine("WARNING: Model remains in or very near T-pose even after animation evaluation!");
                            }
                        }

                        // Inspect SoldierWeaponAttachment
                        var att = ch15.GetComponent<SoldierWeaponAttachment>();
                        sb.AppendLine($"SoldierWeaponAttachment: {(att != null ? "Present" : "NULL")}");
                        if (att != null)
                        {
                            sb.AppendLine($"  - IsAttached: {att.IsAttached}");
                            sb.AppendLine($"  - RightHandBone: {(att.RightHandBone != null ? att.RightHandBone.name : "NULL")}");
                            sb.AppendLine($"  - SocketTransform: {(att.SocketTransform != null ? att.SocketTransform.name : "NULL")}");
                            sb.AppendLine($"  - WeaponModelTransform: {(att.WeaponModelTransform != null ? att.WeaponModelTransform.name : "NULL")}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                sb.AppendLine($"EXCEPTION DURING INSPECTION: {ex}");
            }

            File.WriteAllText(OutputPath, sb.ToString());
            Debug.Log($"[ForensicAnimationInvestigation] Completed inspection report written to {OutputPath}");
            Debug.Log(sb.ToString());
        }
    }
}
#endif
