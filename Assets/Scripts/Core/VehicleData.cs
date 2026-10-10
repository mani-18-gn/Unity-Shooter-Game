using UnityEngine;

namespace Roadbound.Core
{
    [System.Serializable]
    public struct VehicleUpgradeStages
    {
        public int engineStage;
        public int brakesStage;
        public int suspensionStage;
        public int tiresStage;
    }

    [CreateAssetMenu(fileName = "NewVehicleData", menuName = "Roadbound/Vehicles/Vehicle Data", order = 2)]
    public class VehicleData : ScriptableObject
    {
        [Header("Identity & Classification")]
        [Tooltip("Unique ID matching web-game key (e.g. apex_vanguard, kodiak_v8, tuk_tuk)")]
        public string vehicleId;
        public string vehicleName;
        [Tooltip("Display class (e.g. Hypercar / Exotic, Muscle / Interceptor, Off-Road Tactical SUV)")]
        public string vehicleClass;
        public bool isUnlocked = true;

        [Header("Physics & Engineering Tuning")]
        [Tooltip("Curb weight mass in kilograms")]
        public float mass = 1450f;
        [Tooltip("Maximum velocity in Miles Per Hour")]
        public float topSpeedMph = 195f;
        [Tooltip("Maximum longitudinal engine traction drive force in Newtons")]
        public float maxEngineForce = 6800f;
        [Tooltip("Maximum braking deceleration force in Newtons")]
        public float brakeForce = 9000f;
        [Tooltip("Maximum front wheel steering lock angle in degrees")]
        public float steerAngleMax = 38f;
        [Tooltip("Suspension spring resting extension in meters")]
        public float suspensionRestLength = 0.45f;
        [Tooltip("Suspension spring coil stiffness coefficient")]
        public float springStiffness = 32000f;
        [Tooltip("Suspension hydraulic damping shock absorber coefficient")]
        public float springDamping = 3200f;

        [Header("Display Performance Stats (0 - 100 Rating)")]
        [Range(0, 100)] public int topSpeedStat = 96;
        [Range(0, 100)] public int accelerationStat = 94;
        [Range(0, 100)] public int handlingStat = 90;
        [Range(0, 100)] public int brakingStat = 92;
        [Range(0, 100)] public int offroadStat = 35;
        [Range(0, 100)] public int durabilityStat = 75;

        [Header("Default Upgrades")]
        public VehicleUpgradeStages defaultUpgrades = new VehicleUpgradeStages
        {
            engineStage = 1,
            brakesStage = 1,
            suspensionStage = 1,
            tiresStage = 1
        };

        [Header("Visual & Customization")]
        public Color paintColor = Color.black;
        [Tooltip("Paint reflection finish: metallic, matte, gloss, carbon")]
        public string paintFinish = "metallic";
        public Color rimColor = Color.gray;
        [Range(0f, 1f)] public float windowTint = 0.8f;

        [Header("Fuel & Durability")]
        public float defaultHealth = 100f;
        public float defaultFuel = 100f;
    }
}
