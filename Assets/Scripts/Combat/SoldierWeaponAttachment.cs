using System;
using UnityEngine;
#if UNITY_EDITOR
using UnityEditor;
#endif

namespace Roadbound.Combat
{
    [ExecuteAlways]
    [DisallowMultipleComponent]
    public class SoldierWeaponAttachment : MonoBehaviour
    {
        [Header("Socket Configuration")]
        [SerializeField] private string targetBoneName = "RightHand";
        [SerializeField] private Vector3 socketLocalPosition = new Vector3(-0.02f, 0.08f, 0.12f);
        [SerializeField] private Vector3 socketLocalEuler = new Vector3(0f, 90f, 0f);
        [SerializeField] private Vector3 muzzleLocalOffset = new Vector3(0f, 0.04f, 0.52f);

        [Header("Runtime References")]
        [SerializeField] private Transform rightHandBone;
        [SerializeField] private Transform socketTransform;
        [SerializeField] private Transform weaponModelTransform;
        [SerializeField] private Transform muzzlePointTransform;

        public Transform RightHandBone => rightHandBone;
        public Transform SocketTransform => socketTransform;
        public Transform WeaponModelTransform => weaponModelTransform;
        public Transform MuzzlePointTransform => muzzlePointTransform;
        public bool IsAttached => rightHandBone != null && socketTransform != null && weaponModelTransform != null;

        private void Awake()
        {
            SetupAttachment();
        }

        private void OnEnable()
        {
            SetupAttachment();
        }

        private void Start()
        {
            SetupAttachment();
        }

        private void Update()
        {
            if (!IsAttached)
            {
                SetupAttachment();
            }
        }

        public void SetupAttachment()
        {
            var anim = GetComponent<Animator>();

            // 1. Locate character right hand bone
            if (rightHandBone == null)
            {
                if (anim != null && anim.isHuman)
                {
                    rightHandBone = anim.GetBoneTransform(HumanBodyBones.RightHand);
                }
                if (rightHandBone == null)
                {
                    rightHandBone = FindBone(transform, targetBoneName);
                }
            }

            if (rightHandBone == null)
            {
                return;
            }

            // 2. Ensure RightHandSocket exists
            if (socketTransform == null)
            {
                socketTransform = rightHandBone.Find("RightHandSocket");
                if (socketTransform == null)
                {
                    GameObject socketObj = new GameObject("RightHandSocket");
                    socketObj.transform.SetParent(rightHandBone, false);
                    socketTransform = socketObj.transform;
                }
            }

            if (socketTransform.parent != rightHandBone)
            {
                socketTransform.SetParent(rightHandBone, false);
            }

            socketTransform.localPosition = socketLocalPosition;
            socketTransform.localRotation = Quaternion.Euler(socketLocalEuler);
            socketTransform.localScale = Vector3.one;

            // 3. Ensure Weapon Model exists
            if (weaponModelTransform == null)
            {
                weaponModelTransform = socketTransform.Find("AK47_Model");
            }

#if UNITY_EDITOR
            if (weaponModelTransform == null)
            {
                GameObject ak47Prefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Weapons/AK47.obj");
                if (ak47Prefab != null)
                {
                    GameObject modelInstance = (GameObject)PrefabUtility.InstantiatePrefab(ak47Prefab, socketTransform);
                    if (modelInstance == null)
                    {
                        modelInstance = Instantiate(ak47Prefab, socketTransform);
                    }
                    modelInstance.name = "AK47_Model";
                    weaponModelTransform = modelInstance.transform;
                }
            }
#endif

            if (weaponModelTransform != null)
            {
                weaponModelTransform.SetParent(socketTransform, false);
                weaponModelTransform.localPosition = Vector3.zero;
                weaponModelTransform.localRotation = Quaternion.identity;
                weaponModelTransform.localScale = Vector3.one;

#if UNITY_EDITOR
                Material urpMat = AssetDatabase.LoadAssetAtPath<Material>("Assets/Weapons/AK47_URP.mat");
                if (urpMat != null)
                {
                    var renderers = weaponModelTransform.GetComponentsInChildren<Renderer>(true);
                    foreach (var r in renderers)
                    {
                        if (r != null && r.sharedMaterial != urpMat)
                        {
                            r.sharedMaterial = urpMat;
                        }
                    }
                }
#endif

                // 4. Muzzle Point
                if (muzzlePointTransform == null)
                {
                    muzzlePointTransform = weaponModelTransform.Find("MuzzleHook");
                    if (muzzlePointTransform == null)
                    {
                        GameObject muzzleObj = new GameObject("MuzzleHook");
                        muzzleObj.transform.SetParent(weaponModelTransform, false);
                        muzzlePointTransform = muzzleObj.transform;
                    }
                }
                muzzlePointTransform.localPosition = muzzleLocalOffset;
                muzzlePointTransform.localRotation = Quaternion.identity;

                // Sync with WeaponFireSystem
                var fireSystem = GetComponentInParent<WeaponFireSystem>() ?? FindFirstObjectByType<WeaponFireSystem>();
                if (fireSystem != null)
                {
                    fireSystem.MuzzlePoint = muzzlePointTransform;
                }
            }

            // 5. Verify Animator setup on this character
            if (anim != null)
            {
                anim.applyRootMotion = false;
                anim.cullingMode = AnimatorCullingMode.AlwaysAnimate;
#if UNITY_EDITOR
                if (anim.avatar == null || !anim.avatar.isValid)
                {
                    var allSubAssets = AssetDatabase.LoadAllAssetsAtPath("Assets/Characters/Ch15_nonPBR.fbx");
                    if (allSubAssets != null)
                    {
                        foreach (var asset in allSubAssets)
                        {
                            if (asset is Avatar av && av.isValid && av.isHuman)
                            {
                                anim.avatar = av;
                                break;
                            }
                        }
                    }
                }

                if (anim.runtimeAnimatorController == null)
                {
                    var controller = AssetDatabase.LoadAssetAtPath<RuntimeAnimatorController>("Assets/Animations/Combat/SwatAnimatorController.controller");
                    if (controller != null)
                    {
                        anim.runtimeAnimatorController = controller;
                    }
                }

                // If in Edit Mode and not playing, evaluate Idle pose to prevent visual T-pose in Editor Game/Scene views
                if (!Application.isPlaying && anim.runtimeAnimatorController != null && anim.avatar != null && anim.avatar.isValid)
                {
                    anim.WriteDefaultValues();
                    anim.Update(0f);
                }
#endif
            }
        }

        private static Transform FindBone(Transform current, string boneName)
        {
            if (current == null) return null;
            if (current.name.Equals(boneName, StringComparison.OrdinalIgnoreCase) ||
                current.name.EndsWith(":" + boneName, StringComparison.OrdinalIgnoreCase) ||
                current.name.EndsWith(boneName, StringComparison.OrdinalIgnoreCase))
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
    }
}
