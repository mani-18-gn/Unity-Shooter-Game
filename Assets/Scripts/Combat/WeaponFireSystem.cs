using System;
using UnityEngine;
using Roadbound.Core;

namespace Roadbound.Combat
{
    public class WeaponFireSystem : MonoBehaviour
    {
        [Header("Muzzle & Visual Hooks")]
        [SerializeField] private Transform defaultMuzzlePoint;
        [SerializeField] private LayerMask hitLayers = ~0;

        [Header("Spread Modifiers")]
        [SerializeField] private float adsSpreadMultiplier = 0.45f;
        [SerializeField] private float crouchSpreadMultiplier = 0.70f;
        [SerializeField] private float movingSpreadMultiplier = 1.40f;

        // Visual and Audio Action Hooks
        public event Action<Vector3, Vector3> OnMuzzleFired; // position, direction
        public event Action<RaycastHit, bool, float> OnHitConfirmed; // hit, isHeadshot, damage

        public Transform MuzzlePoint
        {
            get => defaultMuzzlePoint != null ? defaultMuzzlePoint : transform;
            set => defaultMuzzlePoint = value;
        }

        public void ExecuteFire(WeaponData weapon, Vector3 fireOrigin, Vector3 crosshairTarget, bool isAiming, bool isCrouching, bool isMoving)
        {
            if (weapon == null) return;

            Vector3 muzzlePos = defaultMuzzlePoint != null ? defaultMuzzlePoint.position : fireOrigin;
            Vector3 baseDirection = (crosshairTarget - fireOrigin).normalized;

            // 1. Calculate spread angle
            float spreadAmount = weapon.spread;
            if (isAiming) spreadAmount *= adsSpreadMultiplier;
            if (isCrouching) spreadAmount *= crouchSpreadMultiplier;
            if (isMoving) spreadAmount *= movingSpreadMultiplier;

            int pelletCount = Mathf.Max(1, weapon.pellets);
            float perPelletDamage = weapon.damage / pelletCount;

            // 2. Fire raycasts for each pellet (1 for rifle/pistol, 8 for shotgun)
            for (int i = 0; i < pelletCount; i++)
            {
                Vector3 shootDirection = baseDirection;
                if (spreadAmount > 0.0001f)
                {
                    Vector2 randomCircle = UnityEngine.Random.insideUnitCircle * spreadAmount;
                    Vector3 spreadOffset = Vector3.Cross(baseDirection, Vector3.up) * randomCircle.x + Vector3.up * randomCircle.y;
                    shootDirection = (baseDirection + spreadOffset).normalized;
                }

                // Raycast from camera origin to ensure precision through crosshair
                Ray bulletRay = new Ray(fireOrigin, shootDirection);
                if (Physics.Raycast(bulletRay, out RaycastHit hit, weapon.range, hitLayers, QueryTriggerInteraction.Ignore))
                {
                    bool isHeadshot = CheckIsHeadshot(hit);
                    ApplyDamage(hit, perPelletDamage, isHeadshot);
                    OnHitConfirmed?.Invoke(hit, isHeadshot, perPelletDamage);
                }
            }

            OnMuzzleFired?.Invoke(muzzlePos, baseDirection);
        }

        private bool CheckIsHeadshot(RaycastHit hit)
        {
            if (hit.collider.CompareTag("Head") || hit.collider.gameObject.name.IndexOf("head", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return true;
            }

            // Fallback: If hit is above 75% height of a CharacterController or CapsuleCollider
            CapsuleCollider capsule = hit.collider as CapsuleCollider;
            if (capsule != null)
            {
                float localY = hit.transform.InverseTransformPoint(hit.point).y;
                if (localY > capsule.height * 0.35f)
                {
                    return true;
                }
            }

            return false;
        }

        private void ApplyDamage(RaycastHit hit, float baseDamage, bool isHeadshot)
        {
            IDamageable target = hit.collider.GetComponentInParent<IDamageable>();
            if (target != null && !target.IsDead)
            {
                target.TakeDamage(baseDamage, isHeadshot);
            }
        }
    }
}
