using UnityEngine;
using Roadbound.Combat;

namespace Roadbound.Player
{
    [RequireComponent(typeof(Animator))]
    public class HumanoidAnimationBridge : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private PlayerController playerController;
        [SerializeField] private PlayerHealth playerHealth;
        [SerializeField] private WeaponFireSystem weaponFireSystem;
        [SerializeField] private Animator animator;

        [Header("Tuning")]
        [SerializeField] private float speedDampTime = 0.1f;

        // Animator Hashes
        private static readonly int SpeedHash = Animator.StringToHash("Speed");
        private static readonly int IsAimingHash = Animator.StringToHash("IsAiming");
        private static readonly int IsCrouchingHash = Animator.StringToHash("IsCrouching");
        private static readonly int IsGroundedHash = Animator.StringToHash("IsGrounded");
        private static readonly int FireTriggerHash = Animator.StringToHash("Fire");
        private static readonly int DieTriggerHash = Animator.StringToHash("Die");

        private void Awake()
        {
            if (animator == null)
            {
                animator = GetComponent<Animator>();
            }

            if (animator != null)
            {
                animator.applyRootMotion = false;
                animator.cullingMode = AnimatorCullingMode.AlwaysAnimate;

#if UNITY_EDITOR
                if (animator.avatar == null || !animator.avatar.isValid)
                {
                    var allSubAssets = UnityEditor.AssetDatabase.LoadAllAssetsAtPath("Assets/Characters/Ch15_nonPBR.fbx");
                    if (allSubAssets != null)
                    {
                        foreach (var asset in allSubAssets)
                        {
                            if (asset is Avatar av && av.isValid && av.isHuman)
                            {
                                animator.avatar = av;
                                break;
                            }
                        }
                    }
                }

                if (animator.runtimeAnimatorController == null)
                {
                    var ctrl = UnityEditor.AssetDatabase.LoadAssetAtPath<RuntimeAnimatorController>("Assets/Animations/Combat/SwatAnimatorController.controller");
                    if (ctrl != null)
                    {
                        animator.runtimeAnimatorController = ctrl;
                    }
                }
#endif
            }

            if (playerController == null)
            {
                playerController = GetComponentInParent<PlayerController>();
                if (playerController == null)
                {
                    playerController = FindFirstObjectByType<PlayerController>();
                }
            }

            if (playerHealth == null)
            {
                playerHealth = GetComponentInParent<PlayerHealth>();
                if (playerHealth == null)
                {
                    playerHealth = FindFirstObjectByType<PlayerHealth>();
                }
            }

            if (weaponFireSystem == null)
            {
                weaponFireSystem = GetComponentInParent<WeaponFireSystem>();
                if (weaponFireSystem == null)
                {
                    weaponFireSystem = FindFirstObjectByType<WeaponFireSystem>();
                }
            }
        }

        private void OnEnable()
        {
            if (weaponFireSystem != null)
            {
                weaponFireSystem.OnMuzzleFired += HandleMuzzleFired;
            }
            if (playerHealth != null)
            {
                playerHealth.OnDeath += HandlePlayerDied;
            }
        }

        private void OnDisable()
        {
            if (weaponFireSystem != null)
            {
                weaponFireSystem.OnMuzzleFired -= HandleMuzzleFired;
            }
            if (playerHealth != null)
            {
                playerHealth.OnDeath -= HandlePlayerDied;
            }
        }

        private void Update()
        {
            if (animator == null) return;

            float currentSpeed = 0f;
            bool isAiming = false;
            bool isCrouching = false;
            bool isGrounded = true;

            if (playerController != null)
            {
                Vector3 horizontalVel = new Vector3(playerController.Velocity.x, 0f, playerController.Velocity.z);
                currentSpeed = horizontalVel.magnitude;
                isAiming = playerController.IsAiming;
                isCrouching = playerController.IsCrouching;
                isGrounded = playerController.IsGrounded;
            }

            animator.SetFloat(SpeedHash, currentSpeed, speedDampTime, Time.deltaTime);
            animator.SetBool(IsAimingHash, isAiming);
            animator.SetBool(IsCrouchingHash, isCrouching);
            animator.SetBool(IsGroundedHash, isGrounded);
        }

        private void HandleMuzzleFired(Vector3 pos, Vector3 dir)
        {
            if (animator != null)
            {
                animator.SetTrigger(FireTriggerHash);
            }
        }

        private void HandlePlayerDied()
        {
            if (animator != null)
            {
                animator.SetTrigger(DieTriggerHash);
            }
        }
    }
}
