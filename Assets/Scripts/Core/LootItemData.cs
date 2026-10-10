using UnityEngine;

namespace Roadbound.Core
{
    public enum LootItemType
    {
        Weapon,
        Ammo,
        Medkit,
        Backpack,
        Armor,
        Crate
    }

    public enum LootTier
    {
        Common,
        Rare,
        Epic,
        Legendary
    }

    [CreateAssetMenu(fileName = "NewLootItemData", menuName = "Roadbound/Loot/Loot Item Data", order = 3)]
    public class LootItemData : ScriptableObject
    {
        [Header("Identity & Classification")]
        [Tooltip("Unique ID matching web loot key (e.g. small_bag, bandage, vest_lv3, ammo_762)")]
        public string itemId;
        public string itemName;
        public LootItemType itemType;
        public LootTier tier = LootTier.Common;
        [TextArea(2, 4)]
        public string description;

        [Header("Weapon Item (Optional)")]
        [Tooltip("Direct reference to WeaponData if this loot is a weapon drop")]
        public WeaponData weaponReference;

        [Header("Ammunition Item")]
        [Tooltip("Caliber matching weapon and bagAmmo dictionary: 7.62mm, 5.56mm, 9mm, .300mag, 12gauge")]
        public string caliber;
        public int ammoCount = 30;

        [Header("Medical Item")]
        [Tooltip("Health points restored upon use")]
        public float healAmount;
        [Tooltip("Time in seconds required to apply the item")]
        public float useTime;
        [Tooltip("Emoji / icon identifier from web version: 🩹, 🧰, 💉")]
        public string iconEmoji;

        [Header("Backpack Item")]
        [Tooltip("Total round carrying capacity for ammunition")]
        public int ammoCapacity;
        [Tooltip("Maximum individual medical kits that can be carried")]
        public int medkitCapacity;

        [Header("Body Armor Item")]
        [Tooltip("Armor points granted upon equipping (e.g. 50, 80, 100)")]
        public float armorProtection;
        [Tooltip("Armor defense level (1, 2, or 3)")]
        public int armorLevel = 1;
    }
}
