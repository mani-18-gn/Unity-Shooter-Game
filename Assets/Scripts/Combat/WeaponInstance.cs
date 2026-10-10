using System;
using UnityEngine;
using Roadbound.Core;

namespace Roadbound.Combat
{
    [Serializable]
    public class WeaponInstance
    {
        [SerializeField] private WeaponData data;
        [SerializeField] private int currentClip;
        [SerializeField] private int reserveAmmo;
        [SerializeField] private bool isReloading;
        [SerializeField] private float reloadTimer;
        [SerializeField] private float lastFireTime;

        public WeaponData Data => data;
        public int CurrentClip => currentClip;
        public int ReserveAmmo => reserveAmmo;
        public bool IsReloading => isReloading;
        public float ReloadProgress => isReloading && data != null && data.reloadTime > 0f ? 1f - (reloadTimer / data.reloadTime) : 0f;

        public event Action OnFired;
        public event Action OnReloadStarted;
        public event Action OnReloadCompleted;
        public event Action OnAmmoChanged;

        public WeaponInstance(WeaponData weaponData, int initialReserve = 120)
        {
            data = weaponData;
            if (data != null)
            {
                currentClip = data.magCapacity;
                reserveAmmo = initialReserve;
            }
        }

        public bool CanFire(float currentTime)
        {
            if (data == null || isReloading) return false;
            if (currentClip <= 0) return false;

            // Enforce fire rate cooldown
            return currentTime >= lastFireTime + data.fireRate;
        }

        public bool RecordFired(float currentTime)
        {
            if (!CanFire(currentTime)) return false;

            currentClip--;
            lastFireTime = currentTime;
            OnFired?.Invoke();
            OnAmmoChanged?.Invoke();
            return true;
        }

        public bool CanReload()
        {
            if (data == null || isReloading) return false;
            return currentClip < data.magCapacity && reserveAmmo > 0;
        }

        public bool StartReload()
        {
            if (!CanReload()) return false;

            isReloading = true;
            reloadTimer = data.reloadTime;
            OnReloadStarted?.Invoke();
            return true;
        }

        public void UpdateReload(float deltaTime)
        {
            if (!isReloading) return;

            reloadTimer -= deltaTime;
            if (reloadTimer <= 0f)
            {
                CompleteReload();
            }
        }

        private void CompleteReload()
        {
            isReloading = false;
            reloadTimer = 0f;

            int needed = data.magCapacity - currentClip;
            int toLoad = Mathf.Min(needed, reserveAmmo);

            currentClip += toLoad;
            reserveAmmo -= toLoad;

            OnReloadCompleted?.Invoke();
            OnAmmoChanged?.Invoke();
        }

        public void CancelReload()
        {
            if (isReloading)
            {
                isReloading = false;
                reloadTimer = 0f;
            }
        }

        public void AddReserveAmmo(int amount)
        {
            reserveAmmo += amount;
            OnAmmoChanged?.Invoke();
        }

        public void SetReserveAmmo(int amount)
        {
            reserveAmmo = amount;
            OnAmmoChanged?.Invoke();
        }
    }
}
