using System;
using UnityEngine;
#if UNITY_EDITOR
using UnityEditor;
#endif
using Roadbound.Player;
using Roadbound.AI;

namespace Roadbound.Combat
{
    [ExecuteAlways]
    [DisallowMultipleComponent]
    public class SoldierWeaponAttachment : MonoBehaviour
    {
        [Header("Weapon Grip & Socket Transform")]
        [Tooltip("Right hand bone to attach the weapon socket to.")]
        [SerializeField] private string targetBoneName = "RightHand";

        [Tooltip("Local position of RightHandSocket relative to the right hand wrist bone.")]
        [SerializeField] private Vector3 socketLocalPosition = new Vector3(-0.01f, 0.07f, 0.03f);

        [Tooltip("Local Euler rotation of RightHandSocket relative to the right hand wrist bone. Calibrated from bone matrix analysis to align rifle barrel forward and sights up.")]
        [SerializeField] private Vector3 socketLocalEuler = new Vector3(273.13f, 179.84f, 279.89f);

        [Header("Weapon Model Offsets")]
        [Tooltip("Position offset of AK47_Model relative to RightHandSocket to place the pistol grip firmly in the palm.")]
        [SerializeField] private Vector3 weaponModelOffset = new Vector3(0f, 0.08f, 0.10f);

        [Tooltip("Rotation offset of AK47_Model relative to RightHandSocket.")]
        [SerializeField] private Vector3 weaponModelEuler = Vector3.zero;

        [Tooltip("Scale of the weapon model.")]
        [SerializeField] private Vector3 weaponModelScale = Vector3.one;

        [Header("Muzzle Configuration")]
        [Tooltip("Local position of MuzzleHook relative to the weapon model (tip of the barrel).")]
        [SerializeField] private Vector3 muzzleLocalOffset = new Vector3(0f, 0.045f, 0.50f);

        [Header("Left Hand IK (Support Hand on Handguard)")]
        [Tooltip("Enable Left Hand Inverse Kinematics to lock the support hand to the rifle handguard.")]
        [SerializeField] private bool enableLeftHandIK = true;

        [Range(0f, 1f)]
        [Tooltip("Weight of Left Hand IK (1.0 = fully locked to handguard).")]
        [SerializeField] private float leftHandIKWeight = 1.0f;

        [Tooltip("Local offset of LeftHandGrip relative to weapon model (center of wooden handguard).")]
        [SerializeField] private Vector3 leftGripLocalOffset = new Vector3(-0.06f, -0.01f, 0.18f);

        [Tooltip("Local Euler rotation of LeftHandGrip relative to weapon model, orienting palm around handguard.")]
        [SerializeField] private Vector3 leftGripLocalEuler = new Vector3(276.14f, 127.60f, 102.44f);

        [Header("Look-At Aiming IK")]
        [Tooltip("Enable upper-body Look-At IK to pitch and turn toward crosshair.")]
        [SerializeField] private bool enableAimLookAtIK = true;

        [Range(0f, 1f)]
        [Tooltip("Weight of Look-At IK.")]
        [SerializeField] private float aimLookAtWeight = 0.75f;

        [Header("Runtime References")]
        [SerializeField] private Transform rightHandBone;
        [SerializeField] private Transform socketTransform;
        [SerializeField] private Transform weaponModelTransform;
        [SerializeField] private Transform muzzlePointTransform;
        [SerializeField] private Transform leftHandGripTransform;

        // Cached components
        private Animator anim;
        private PlayerController playerController;
        private PlayerHealth playerHealth;
        private PlayerCameraController cameraController;
        private TacticalEnemyAI enemyAI;

        public Transform RightHandBone => rightHandBone;
        public Transform SocketTransform => socketTransform;
        public Transform WeaponModelTransform => weaponModelTransform;
        public Transform MuzzlePointTransform => muzzlePointTransform;
        public Transform LeftHandGripTransform => leftHandGripTransform;
        public bool IsAttached => rightHandBone != null && socketTransform != null && weaponModelTransform != null;

        // Inspector Configuration Accessors
        public Vector3 SocketLocalPosition { get => socketLocalPosition; set => socketLocalPosition = value; }
        public Vector3 SocketLocalEuler { get => socketLocalEuler; set => socketLocalEuler = value; }
        public Vector3 WeaponModelOffset { get => weaponModelOffset; set => weaponModelOffset = value; }
        public Vector3 MuzzleLocalOffset { get => muzzleLocalOffset; set => muzzleLocalOffset = value; }
        public Vector3 LeftGripLocalOffset { get => leftGripLocalOffset; set => leftGripLocalOffset = value; }
        public Vector3 LeftGripLocalEuler { get => leftGripLocalEuler; set => leftGripLocalEuler = value; }
        public bool EnableLeftHandIK { get => enableLeftHandIK; set => enableLeftHandIK = value; }
        public float LeftHandIKWeight { get => leftHandIKWeight; set => leftHandIKWeight = value; }

        private void Awake()
        {
            CacheReferences();
            SetupAttachment();
        }

        private void OnEnable()
        {
            CacheReferences();
            SetupAttachment();
        }

        private void Start()
        {
            CacheReferences();
            SetupAttachment();
        }

        private void CacheReferences()
        {
            if (anim == null) anim = GetComponent<Animator>();
            if (playerController == null) playerController = GetComponentInParent<PlayerController>() ?? FindFirstObjectByType<PlayerController>();
            if (playerHealth == null) playerHealth = GetComponentInParent<PlayerHealth>() ?? FindFirstObjectByType<PlayerHealth>();
            if (cameraController == null) cameraController = FindFirstObjectByType<PlayerCameraController>();
            if (enemyAI == null) enemyAI = GetComponentInParent<TacticalEnemyAI>();
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
            if (anim == null) anim = GetComponent<Animator>();

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
                weaponModelTransform.localPosition = weaponModelOffset;
                weaponModelTransform.localRotation = Quaternion.Euler(weaponModelEuler);
                weaponModelTransform.localScale = weaponModelScale;

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
                muzzlePointTransform.SetParent(weaponModelTransform, false);
                muzzlePointTransform.localPosition = muzzleLocalOffset;
                muzzlePointTransform.localRotation = Quaternion.identity;

                // 5. Left Hand Grip Target
                if (leftHandGripTransform == null)
                {
                    leftHandGripTransform = weaponModelTransform.Find("LeftHandGrip");
                    if (leftHandGripTransform == null)
                    {
                        GameObject gripObj = new GameObject("LeftHandGrip");
                        gripObj.transform.SetParent(weaponModelTransform, false);
                        leftHandGripTransform = gripObj.transform;
                    }
                }
                leftHandGripTransform.SetParent(weaponModelTransform, false);
                leftHandGripTransform.localPosition = leftGripLocalOffset;
                leftHandGripTransform.localRotation = Quaternion.Euler(leftGripLocalEuler);

                // Sync with WeaponFireSystem
                var fireSystem = GetComponentInParent<WeaponFireSystem>() ?? FindFirstObjectByType<WeaponFireSystem>();
                if (fireSystem != null)
                {
                    fireSystem.MuzzlePoint = muzzlePointTransform;
                }

                // Sync with Enemy AI if present
                if (enemyAI != null)
                {
                    enemyAI.MuzzlePoint = muzzlePointTransform;
#if UNITY_EDITOR
                    UnityEditor.EditorUtility.SetDirty(enemyAI);
#endif
                }
            }

            // 6. Verify Animator setup on this character
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
#endif
            }
        }

        private void OnAnimatorIK(int layerIndex)
        {
            if (anim == null) return;

            // Check if character is alive
            if (playerHealth != null && playerHealth.IsDead) return;
            if (enemyAI != null && enemyAI.IsDead) return;

            // 1. Left Hand IK (Support Hand on Rifle Handguard)
            if (enableLeftHandIK && leftHandGripTransform != null)
            {
                anim.SetIKPositionWeight(AvatarIKGoal.LeftHand, leftHandIKWeight);
                anim.SetIKRotationWeight(AvatarIKGoal.LeftHand, leftHandIKWeight);
                anim.SetIKPosition(AvatarIKGoal.LeftHand, leftHandGripTransform.position);
                anim.SetIKRotation(AvatarIKGoal.LeftHand, leftHandGripTransform.rotation);
            }

            // 2. Look-At Aiming IK (Spine/Head aligns toward aiming target)
            if (enableAimLookAtIK)
            {
                Vector3 aimTarget = GetAimTargetPoint();
                if (aimTarget != Vector3.zero)
                {
                    bool isAimingOrFiring = (playerController != null && playerController.IsAiming);
                    float weight = isAimingOrFiring ? aimLookAtWeight : (aimLookAtWeight * 0.5f);
                    anim.SetLookAtWeight(weight, 0.35f, 0.75f, 1.0f, 0.5f);
                    anim.SetLookAtPosition(aimTarget);
                }
            }
        }

        private Vector3 GetAimTargetPoint()
        {
            if (cameraController != null && cameraController.Camera != null)
            {
                return cameraController.GetCrosshairWorldTarget(150f);
            }

            if (enemyAI != null)
            {
                var pc = FindFirstObjectByType<PlayerController>();
                if (pc != null)
                {
                    return pc.transform.position + Vector3.up * 1.3f;
                }
            }

            return transform.position + transform.forward * 50f + Vector3.up * 1.4f;
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
