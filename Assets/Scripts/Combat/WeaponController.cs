using System;
using UnityEngine;
using Roadbound.Core;
using Roadbound.Player;

namespace Roadbound.Combat
{
    [RequireComponent(typeof(WeaponInventory))]
    [RequireComponent(typeof(WeaponFireSystem))]
    [RequireComponent(typeof(WeaponRecoil))]
    public class WeaponController : MonoBehaviour
    {
        [Header("System References")]
        [SerializeField] private PlayerInputHandler inputHandler;
        [SerializeField] private PlayerController playerController;
        [SerializeField] private PlayerCameraController cameraController;

        // Subsystems
        private WeaponInventory inventory;
        private WeaponFireSystem fireSystem;
        private WeaponRecoil recoilSystem;

        private bool hasFiredSemiAutoThisPress = false;

        public WeaponInventory Inventory => inventory;
        public WeaponFireSystem FireSystem => fireSystem;
        public WeaponRecoil Recoil => recoilSystem;
        public WeaponInstance ActiveWeapon => inventory != null ? inventory.ActiveWeapon : null;

        private void Awake()
        {
            inventory = GetComponent<WeaponInventory>();
            fireSystem = GetComponent<WeaponFireSystem>();
            recoilSystem = GetComponent<WeaponRecoil>();

            if (inputHandler == null) inputHandler = GetComponentInParent<PlayerInputHandler>() ?? FindFirstObjectByType<PlayerInputHandler>();
            if (playerController == null) playerController = GetComponentInParent<PlayerController>() ?? FindFirstObjectByType<PlayerController>();
            if (cameraController == null) cameraController = GetComponentInParent<PlayerCameraController>() ?? FindFirstObjectByType<PlayerCameraController>();
        }

        private void OnEnable()
        {
            if (inputHandler != null)
            {
                inputHandler.OnReload += HandleReloadInput;
                inputHandler.OnQuickSelectSlot += HandleSlotSelect;
                inputHandler.OnNextWeapon += HandleNextWeapon;
                inputHandler.OnPreviousWeapon += HandlePrevWeapon;
            }
        }

        private void OnDisable()
        {
            if (inputHandler != null)
            {
                inputHandler.OnReload -= HandleReloadInput;
                inputHandler.OnQuickSelectSlot -= HandleSlotSelect;
                inputHandler.OnNextWeapon -= HandleNextWeapon;
                inputHandler.OnPreviousWeapon -= HandlePrevWeapon;
            }
        }

        private void Update()
        {
            WeaponInstance weapon = inventory.ActiveWeapon;
            if (weapon == null || weapon.Data == null) return;

            // 1. Process active reload timer
            if (weapon.IsReloading)
            {
                weapon.UpdateReload(Time.deltaTime);
                if (!weapon.IsReloading)
                {
                    // Sync reserve change back to inventory bank
                    inventory.SyncWeaponReserve(weapon);
                }
            }

            // 2. Adjust Camera Aim Zoom based on weapon scope
            bool isAiming = inputHandler != null && inputHandler.AimHeld;
            if (cameraController != null)
            {
                float customScopeFov = GetScopeFOV(weapon.Data.scopeType);
                cameraController.SetAimState(isAiming, customScopeFov);
            }

            // 3. Process Firing Input
            HandleFiring(weapon, isAiming);
        }

        private void HandleFiring(WeaponInstance weapon, bool isAiming)
        {
            bool fireHeld = inputHandler != null && inputHandler.FireHeld;
            bool fireTriggered = inputHandler != null && inputHandler.FireTriggered;

            if (!fireHeld)
            {
                hasFiredSemiAutoThisPress = false;
                recoilSystem.ResetBurst();
                return;
            }

            // Determine if weapon is allowed to cycle
            bool wantsToFire = false;
            if (weapon.Data.isAutomatic)
            {
                wantsToFire = fireHeld;
            }
            else
            {
                if (fireTriggered || !hasFiredSemiAutoThisPress)
                {
                    wantsToFire = true;
                    hasFiredSemiAutoThisPress = true;
                }
            }

            if (!wantsToFire) return;

            // Check if magazine is dry -> auto reload
            if (weapon.CurrentClip <= 0)
            {
                if (weapon.CanReload())
                {
                    weapon.StartReload();
                }
                return;
            }

            // Check fire rate limiter
            if (weapon.CanFire(Time.time))
            {
                if (weapon.RecordFired(Time.time))
                {
                    ExecuteShot(weapon, isAiming);
                }
            }
        }

        private void ExecuteShot(WeaponInstance weapon, bool isAiming)
        {
            // 1. Get origin and crosshair raycast target point
            Transform camTransform = cameraController != null && cameraController.Camera != null
                ? cameraController.Camera.transform
                : transform;

            Vector3 fireOrigin = camTransform.position;
            Vector3 targetPoint = cameraController != null
                ? cameraController.GetCrosshairWorldTarget(weapon.Data.range)
                : fireOrigin + camTransform.forward * weapon.Data.range;

            bool isCrouching = playerController != null && playerController.IsCrouching;
            bool isMoving = playerController != null && playerController.Velocity.sqrMagnitude > 0.1f;

            // 2. Perform hitscan / raycast shot
            fireSystem.ExecuteFire(weapon.Data, fireOrigin, targetPoint, isAiming, isCrouching, isMoving);

            // 3. Apply procedural recoil
            recoilSystem.ApplyRecoil(weapon.Data, isAiming, isCrouching);
        }

        private float GetScopeFOV(ScopeType scope)
        {
            switch (scope)
            {
                case ScopeType.Scope8x: return 12f;
                case ScopeType.Scope4x: return 24f;
                case ScopeType.RedDot:  return 42f;
                default:                return 45f;
            }
        }

        private void HandleReloadInput()
        {
            WeaponInstance weapon = inventory.ActiveWeapon;
            if (weapon != null && weapon.CanReload())
            {
                weapon.StartReload();
            }
        }

        private void HandleSlotSelect(int slotIndex)
        {
            inventory.SelectSlot(slotIndex);
        }

        private void HandleNextWeapon()
        {
            inventory.CycleNextWeapon();
        }

        private void HandlePrevWeapon()
        {
            inventory.CyclePreviousWeapon();
        }
    }
}
