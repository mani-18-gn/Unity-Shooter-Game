using UnityEngine;
using Roadbound.Core;
using Roadbound.Player;

namespace Roadbound.Combat
{
    public class WeaponRecoil : MonoBehaviour
    {
        [Header("Target Camera Controller")]
        [SerializeField] private PlayerCameraController cameraController;

        [Header("Modifiers")]
        [Tooltip("Multiplies recoil kick when Aiming Down Sights (ADS)")]
        [SerializeField] private float adsRecoilMultiplier = 0.65f;
        [Tooltip("Multiplies recoil kick when Crouching")]
        [SerializeField] private float crouchRecoilMultiplier = 0.75f;
        [Tooltip("Additional sustained fire recoil climb ramp factor")]
        [SerializeField] private float sustainedClimbFactor = 1.15f;

        private int sustainedShots = 0;
        private float lastShotTime = 0f;

        private void Awake()
        {
            if (cameraController == null)
            {
                cameraController = GetComponentInParent<PlayerCameraController>();
                if (cameraController == null)
                {
                    cameraController = FindFirstObjectByType<PlayerCameraController>();
                }
            }
        }

        public void ApplyRecoil(WeaponData weapon, bool isAiming, bool isCrouching)
        {
            if (weapon == null || cameraController == null) return;

            // Track continuous burst spray
            if (Time.time - lastShotTime < weapon.fireRate * 1.5f)
            {
                sustainedShots++;
            }
            else
            {
                sustainedShots = 0;
            }
            lastShotTime = Time.time;

            // Base kick values straight from WeaponData ScriptableObject
            float pitchKick = weapon.recoilPitch * 10f; // Scale to degrees
            float yawSpread = weapon.recoilYawSpread * 10f;

            // Random horizontal wander (left or right)
            float yawKick = Random.Range(-yawSpread, yawSpread);

            // Modifiers
            float modifier = 1.0f;
            if (isAiming) modifier *= adsRecoilMultiplier;
            if (isCrouching) modifier *= crouchRecoilMultiplier;

            // Slight ramp for heavy sustained automatic bursts
            float burstRamp = 1.0f + Mathf.Min(sustainedShots * 0.04f, 0.4f) * sustainedClimbFactor;

            pitchKick *= modifier * burstRamp;
            yawKick *= modifier;

            // Apply directly into camera orbit system
            cameraController.ApplyRecoilKick(pitchKick, yawKick);
        }

        public void ResetBurst()
        {
            sustainedShots = 0;
        }
    }
}
