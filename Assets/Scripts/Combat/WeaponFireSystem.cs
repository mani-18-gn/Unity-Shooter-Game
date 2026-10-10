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

            // Direct shot from weapon muzzle toward camera crosshair target point
            Vector3 muzzleToTarget = crosshairTarget - muzzlePos;
            Vector3 baseDirection;
            if (muzzleToTarget.sqrMagnitude > 0.001f)
            {
                baseDirection = muzzleToTarget.normalized;
                // Safety guard: ensure shot points forward from muzzle
                if (defaultMuzzlePoint != null && Vector3.Dot(baseDirection, defaultMuzzlePoint.forward) < 0f)
                {
                    baseDirection = defaultMuzzlePoint.forward;
                }
            }
            else
            {
                baseDirection = defaultMuzzlePoint != null ? defaultMuzzlePoint.forward : (crosshairTarget - fireOrigin).normalized;
            }

            // 1. Calculate spread angle
            float spreadAmount = weapon.spread;
            if (isAiming) spreadAmount *= adsSpreadMultiplier;
            if (isCrouching) spreadAmount *= crouchSpreadMultiplier;
            if (isMoving) spreadAmount *= movingSpreadMultiplier;

            int pelletCount = Mathf.Max(1, weapon.pellets);
            float perPelletDamage = weapon.damage / pelletCount;

            // 2. Fire raycasts from muzzle for each pellet (1 for rifle/pistol, 8 for shotgun)
            Transform shooterRoot = transform.root;
            for (int i = 0; i < pelletCount; i++)
            {
                Vector3 shootDirection = baseDirection;
                if (spreadAmount > 0.0001f)
                {
                    Vector2 randomCircle = UnityEngine.Random.insideUnitCircle * spreadAmount;
                    Vector3 spreadOffset = Vector3.Cross(baseDirection, Vector3.up) * randomCircle.x + Vector3.up * randomCircle.y;
                    shootDirection = (baseDirection + spreadOffset).normalized;
                }

                // Raycast from muzzle toward crosshair target, filtering out shooter's own colliders
                Ray bulletRay = new Ray(muzzlePos, shootDirection);
                RaycastHit[] hits = Physics.RaycastAll(bulletRay, weapon.range, hitLayers, QueryTriggerInteraction.Ignore);
                if (hits != null && hits.Length > 0)
                {
                    Array.Sort(hits, (a, b) => a.distance.CompareTo(b.distance));
                    for (int hIdx = 0; hIdx < hits.Length; hIdx++)
                    {
                        RaycastHit hit = hits[hIdx];
                        if (hit.transform == transform || hit.transform.IsChildOf(transform) || (shooterRoot != null && hit.transform.root == shooterRoot))
                        {
                            continue; // Skip self colliders
                        }

                        bool isHeadshot = CheckIsHeadshot(hit);
                        ApplyDamage(hit, perPelletDamage, isHeadshot);
                        OnHitConfirmed?.Invoke(hit, isHeadshot, perPelletDamage);
                        break;
                    }
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
