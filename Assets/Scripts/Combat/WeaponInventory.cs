using System;
using System.Collections.Generic;
using UnityEngine;
using Roadbound.Core;

namespace Roadbound.Combat
{
    public class WeaponInventory : MonoBehaviour
    {
        [Header("Starting Loadout (ScriptableObjects)")]
        [SerializeField] private WeaponData startingPrimary;
        [SerializeField] private WeaponData startingSecondary;
        [SerializeField] private WeaponData startingThrowable;

        [Header("Starting Ammunition Reserves")]
        [SerializeField] private int starting556Ammo = 180;
        [SerializeField] private int starting762Ammo = 180;
        [SerializeField] private int starting9mmAmmo = 120;
        [SerializeField] private int starting300MagAmmo = 20;
        [SerializeField] private int starting12GaugeAmmo = 32;

        // Weapon Slots: 0 = Primary, 1 = Secondary, 2 = Throwable
        private readonly WeaponInstance[] slots = new WeaponInstance[3];
        private int activeSlotIndex = 0;

        // Reserve Ammunition Bank (Caliber -> Rounds)
        private readonly Dictionary<string, int> ammoBank = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        // Events
        public event Action<WeaponInstance, int> OnWeaponSwitched; // weapon, slotIndex
        public event Action<string, int> OnReserveAmmoUpdated;    // caliber, totalAmmo

        public WeaponInstance ActiveWeapon => slots[activeSlotIndex];
        public int ActiveSlotIndex => activeSlotIndex;

        private void Awake()
        {
            InitializeAmmoBank();
            InitializeStartingWeapons();
        }

        private void Start()
        {
            if (ActiveWeapon != null)
            {
                OnWeaponSwitched?.Invoke(ActiveWeapon, activeSlotIndex);
            }
        }

        private void InitializeAmmoBank()
        {
            ammoBank["5.56mm"] = starting556Ammo;
            ammoBank["7.62mm"] = starting762Ammo;
            ammoBank["9mm"] = starting9mmAmmo;
            ammoBank[".300mag"] = starting300MagAmmo;
            ammoBank["12gauge"] = starting12GaugeAmmo;
            ammoBank["grenade"] = 3;
            ammoBank["none"] = 999;
        }

        private void InitializeStartingWeapons()
        {
#if UNITY_EDITOR
            if (startingPrimary == null)
                startingPrimary = UnityEditor.AssetDatabase.LoadAssetAtPath<WeaponData>("Assets/ScriptableObjects/Weapons/Weapon_AK47.asset");
            if (startingSecondary == null)
                startingSecondary = UnityEditor.AssetDatabase.LoadAssetAtPath<WeaponData>("Assets/ScriptableObjects/Weapons/Weapon_UMP.asset");
            if (startingThrowable == null)
                startingThrowable = UnityEditor.AssetDatabase.LoadAssetAtPath<WeaponData>("Assets/ScriptableObjects/Weapons/Weapon_Grenade.asset");
#endif
            if (startingPrimary != null)
                EquipWeapon(startingPrimary, 0);

            if (startingSecondary != null)
                EquipWeapon(startingSecondary, 1);

            if (startingThrowable != null)
                EquipWeapon(startingThrowable, 2);

            // Default to primary or first available
            activeSlotIndex = 0;
            if (slots[0] == null)
            {
                if (slots[1] != null) activeSlotIndex = 1;
                else if (slots[2] != null) activeSlotIndex = 2;
            }
        }

        public bool EquipWeapon(WeaponData weaponData, int slotIndex)
        {
            if (weaponData == null || slotIndex < 0 || slotIndex >= slots.Length)
                return false;

            int reserve = GetReserveAmmo(weaponData.caliber);
            WeaponInstance newInstance = new WeaponInstance(weaponData, reserve);
            slots[slotIndex] = newInstance;

            if (slotIndex == activeSlotIndex)
            {
                OnWeaponSwitched?.Invoke(newInstance, activeSlotIndex);
            }

            return true;
        }

        public void SelectSlot(int slotIndex)
        {
            if (slotIndex < 0 || slotIndex >= slots.Length) return;
            if (slotIndex == activeSlotIndex && ActiveWeapon != null) return;
            if (slots[slotIndex] == null) return;

            // Cancel any pending reload on current weapon before switching
            if (ActiveWeapon != null)
            {
                ActiveWeapon.CancelReload();
                // Sync current reserve back to bank
                SyncWeaponReserve(ActiveWeapon);
            }

            activeSlotIndex = slotIndex;
            // Refresh reserve from bank
            if (ActiveWeapon != null)
            {
                ActiveWeapon.SetReserveAmmo(GetReserveAmmo(ActiveWeapon.Data.caliber));
                OnWeaponSwitched?.Invoke(ActiveWeapon, activeSlotIndex);
            }
        }

        public void CycleNextWeapon()
        {
            for (int i = 1; i <= slots.Length; i++)
            {
                int nextIndex = (activeSlotIndex + i) % slots.Length;
                if (slots[nextIndex] != null)
                {
                    SelectSlot(nextIndex);
                    return;
                }
            }
        }

        public void CyclePreviousWeapon()
        {
            for (int i = 1; i <= slots.Length; i++)
            {
                int prevIndex = (activeSlotIndex - i + slots.Length) % slots.Length;
                if (slots[prevIndex] != null)
                {
                    SelectSlot(prevIndex);
                    return;
                }
            }
        }

        public int GetReserveAmmo(string caliber)
        {
            if (string.IsNullOrEmpty(caliber)) return 0;
            return ammoBank.TryGetValue(caliber, out int amount) ? amount : 0;
        }

        public void AddReserveAmmo(string caliber, int count)
        {
            if (string.IsNullOrEmpty(caliber) || count <= 0) return;

            if (!ammoBank.ContainsKey(caliber))
                ammoBank[caliber] = 0;

            ammoBank[caliber] += count;

            if (ActiveWeapon != null && ActiveWeapon.Data.caliber.Equals(caliber, StringComparison.OrdinalIgnoreCase))
            {
                ActiveWeapon.SetReserveAmmo(ammoBank[caliber]);
            }

            OnReserveAmmoUpdated?.Invoke(caliber, ammoBank[caliber]);
        }

        public void SyncWeaponReserve(WeaponInstance weapon)
        {
            if (weapon == null || weapon.Data == null) return;
            ammoBank[weapon.Data.caliber] = weapon.ReserveAmmo;
            OnReserveAmmoUpdated?.Invoke(weapon.Data.caliber, weapon.ReserveAmmo);
        }

        public WeaponInstance GetSlot(int index)
        {
            if (index >= 0 && index < slots.Length) return slots[index];
            return null;
        }
    }
}
