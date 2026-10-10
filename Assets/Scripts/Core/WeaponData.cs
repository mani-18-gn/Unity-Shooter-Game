using UnityEngine;

namespace Roadbound.Core
{
    public enum WeaponCategory
    {
        AssaultRifle,
        DMR,
        Sniper,
        LMG,
        SMG,
        Shotgun,
        Pistol,
        Melee,
        Throwable
    }

    public enum WeaponSlot
    {
        Primary,
        Sidearm,
        Melee,
        Grenade
    }

    public enum ScopeType
    {
        None,
        Iron,
        RedDot,
        Scope4x,
        Scope8x
    }

    [CreateAssetMenu(fileName = "NewWeaponData", menuName = "Roadbound/Combat/Weapon Data", order = 1)]
    public class WeaponData : ScriptableObject
    {
        [Header("Identity")]
        [Tooltip("Internal unique identifier matching web-game definition key (e.g. ak47, scar, awm)")]
        public string weaponId;
        public string weaponName;
        public WeaponCategory category;
        public WeaponSlot slot;
        [TextArea(2, 4)]
        public string description;

        [Header("Ammunition & Caliber")]
        [Tooltip("Ammunition caliber matching bagAmmo keys: 7.62mm, 5.56mm, 9mm, .300mag, 12gauge, grenade, none")]
        public string caliber = "7.62mm";
        public int magCapacity = 30;
        public int pellets = 1;

        [Header("Ballistics & Damage")]
        public float damage = 38f;
        [Tooltip("Seconds between consecutive shots. E.g. 0.10s = 600 RPM")]
        public float fireRate = 0.10f;
        public bool isAutomatic = true;
        [Tooltip("Effective engagement range in meters")]
        public float range = 350f;
        [Tooltip("Bullet cone spread factor")]
        public float spread = 0.022f;
        [Tooltip("Initial bullet muzzle velocity in m/s")]
        public float muzzleVelocity = 715f;

        [Header("Handling & Recoil")]
        [Tooltip("Duration of full reload in seconds")]
        public float reloadTime = 2.2f;
        [Tooltip("Vertical recoil climb kick per shot")]
        public float recoilPitch = 0.08f;
        [Tooltip("Horizontal recoil randomized spread per shot")]
        public float recoilYawSpread = 0.035f;

        [Header("Optics")]
        public ScopeType scopeType = ScopeType.Iron;
    }
}
