using UnityEngine;
using Roadbound.Player;
using Roadbound.Combat;

namespace Roadbound.UI
{
    public class CombatTestDebugUI : MonoBehaviour
    {
        [Header("References (Auto-detected if null)")]
        [SerializeField] private PlayerHealth playerHealth;
        [SerializeField] private PlayerController playerController;
        [SerializeField] private WeaponController weaponController;

        private float hitmarkerTimer = 0f;
        private bool lastHitWasHeadshot = false;

        private GUIStyle headerStyle;
        private GUIStyle textStyle;
        private GUIStyle boldTextStyle;
        private GUIStyle hintStyle;
        private Texture2D whiteTexture;

        private void Awake()
        {
            if (playerHealth == null) playerHealth = FindFirstObjectByType<PlayerHealth>();
            if (playerController == null) playerController = FindFirstObjectByType<PlayerController>();
            if (weaponController == null) weaponController = FindFirstObjectByType<WeaponController>();

            whiteTexture = new Texture2D(1, 1);
            whiteTexture.SetPixel(0, 0, Color.white);
            whiteTexture.Apply();
        }

        private void Start()
        {
            HookFireSystem();
        }

        private void HookFireSystem()
        {
            if (weaponController == null) weaponController = FindFirstObjectByType<WeaponController>();
            if (weaponController != null && weaponController.FireSystem != null)
            {
                weaponController.FireSystem.OnHitConfirmed -= HandleHitConfirmed;
                weaponController.FireSystem.OnHitConfirmed += HandleHitConfirmed;
            }
        }

        private void OnEnable()
        {
            HookFireSystem();
        }

        private void OnDisable()
        {
            if (weaponController != null && weaponController.FireSystem != null)
            {
                weaponController.FireSystem.OnHitConfirmed -= HandleHitConfirmed;
            }
        }

        private void HandleHitConfirmed(RaycastHit hit, bool isHeadshot, float damage)
        {
            hitmarkerTimer = 0.18f;
            lastHitWasHeadshot = isHeadshot;
        }

        private void Update()
        {
            if (weaponController == null) HookFireSystem();
            if (playerHealth == null) playerHealth = FindFirstObjectByType<PlayerHealth>();
            if (playerController == null) playerController = FindFirstObjectByType<PlayerController>();

            if (hitmarkerTimer > 0f)
            {
                hitmarkerTimer -= Time.deltaTime;
            }
        }

        private void OnGUI()
        {
            InitStyles();

            // 1. TOP-LEFT HUD CARD
            float boxWidth = 320f;
            float boxHeight = 220f;
            GUI.Box(new Rect(18, 18, boxWidth, boxHeight), GUIContent.none);

            GUILayout.BeginArea(new Rect(28, 26, boxWidth - 20, boxHeight - 16));
            
            GUILayout.Label("HORIZEN // COMBAT TEST BENCH", headerStyle);
            GUILayout.Space(6);

            // Health & Armor
            if (playerHealth != null)
            {
                DrawBar("HP", playerHealth.CurrentHealth, playerHealth.MaxHealth, new Color(0.2f, 0.85f, 0.3f));
                GUILayout.Space(4);
                DrawBar("ARMOR", playerHealth.CurrentArmor, playerHealth.MaxArmor, new Color(0.2f, 0.65f, 1.0f));
            }
            GUILayout.Space(8);

            // Weapon & Ammo
            if (weaponController != null && weaponController.ActiveWeapon != null)
            {
                var wep = weaponController.ActiveWeapon;
                GUILayout.Label($"WEAPON: {wep.Data.weaponName} [{wep.Data.caliber}]", boldTextStyle);

                if (wep.IsReloading)
                {
                    GUILayout.Label($"RELOADING... {Mathf.CeilToInt(wep.ReloadProgress * 100)}%", boldTextStyle);
                }
                else
                {
                    GUILayout.Label($"AMMO: {wep.CurrentClip} / {wep.Data.magCapacity}   |   RESERVE: {wep.ReserveAmmo}", boldTextStyle);
                }

                // Stance & Aim
                bool isAim = playerController != null && playerController.IsAiming;
                bool isCrouch = playerController != null && playerController.IsCrouching;
                bool isSprint = playerController != null && playerController.IsSprinting;
                string stanceStr = isSprint ? "SPRINT" : (isCrouch ? "CROUCH" : "STAND");
                string aimStr = isAim ? "ADS [AIMING]" : "HIP-FIRE";

                GUILayout.Label($"STANCE: {stanceStr}   |   OPTIC: {aimStr}", textStyle);
            }

            GUILayout.EndArea();

            // 2. CENTER CROSSHAIR & HITMARKER
            DrawCenterCrosshair();

            // 3. BOTTOM-LEFT CONTROLS GUIDE
            GUI.Box(new Rect(18, Screen.height - 48, Screen.width - 36, 32), GUIContent.none);
            GUI.Label(
                new Rect(28, Screen.height - 42, Screen.width - 56, 24),
                "CONTROLS: [WASD] Move   [Shift] Sprint   [Space] Jump   [C] Crouch   [RMB] Aim ADS   [LMB] Fire   [R] Reload   [1/2/3] Weapon Slots   [Esc] Unlock Mouse",
                hintStyle
            );
        }

        private void DrawBar(string label, float current, float max, Color barColor)
        {
            GUILayout.BeginHorizontal();
            GUILayout.Label($"{label}: {Mathf.CeilToInt(current)}/{Mathf.CeilToInt(max)}", textStyle, GUILayout.Width(110));

            Rect barRect = GUILayoutUtility.GetRect(160, 14);
            GUI.color = new Color(0.15f, 0.15f, 0.15f, 0.85f);
            GUI.DrawTexture(barRect, whiteTexture);

            float fillWidth = max > 0 ? (current / max) * barRect.width : 0;
            Rect fillRect = new Rect(barRect.x, barRect.y, fillWidth, barRect.height);
            GUI.color = barColor;
            GUI.DrawTexture(fillRect, whiteTexture);
            GUI.color = Color.white;

            GUILayout.EndHorizontal();
        }

        private void DrawCenterCrosshair()
        {
            float cx = Screen.width * 0.5f;
            float cy = Screen.height * 0.5f;
            float size = 8f;
            float gap = 4f;
            float thickness = 2f;

            Color crossColor = hitmarkerTimer > 0f ? (lastHitWasHeadshot ? Color.red : new Color(1f, 0.3f, 0.3f)) : Color.white;
            GUI.color = crossColor;

            // Reticle ticks
            GUI.DrawTexture(new Rect(cx - thickness * 0.5f, cy - gap - size, thickness, size), whiteTexture); // Top
            GUI.DrawTexture(new Rect(cx - thickness * 0.5f, cy + gap, thickness, size), whiteTexture);        // Bottom
            GUI.DrawTexture(new Rect(cx - gap - size, cy - thickness * 0.5f, size, thickness), whiteTexture); // Left
            GUI.DrawTexture(new Rect(cx + gap, cy - thickness * 0.5f, size, thickness), whiteTexture);        // Right

            // Hitmarker X ticks when hit confirmed
            if (hitmarkerTimer > 0f)
            {
                float hmSize = 12f;
                GUI.color = lastHitWasHeadshot ? Color.red : Color.yellow;
                GUI.DrawTexture(new Rect(cx - hmSize, cy - hmSize, 5, 2), whiteTexture);
                GUI.DrawTexture(new Rect(cx + hmSize - 5, cy - hmSize, 5, 2), whiteTexture);
                GUI.DrawTexture(new Rect(cx - hmSize, cy + hmSize - 2, 5, 2), whiteTexture);
                GUI.DrawTexture(new Rect(cx + hmSize - 5, cy + hmSize - 2, 5, 2), whiteTexture);
            }

            GUI.color = Color.white;
        }

        private void InitStyles()
        {
            if (headerStyle == null)
            {
                headerStyle = new GUIStyle(GUI.skin.label)
                {
                    fontSize = 13,
                    fontStyle = FontStyle.Bold,
                    normal = { textColor = new Color(1f, 0.8f, 0.2f) }
                };

                textStyle = new GUIStyle(GUI.skin.label)
                {
                    fontSize = 11,
                    normal = { textColor = Color.white }
                };

                boldTextStyle = new GUIStyle(GUI.skin.label)
                {
                    fontSize = 12,
                    fontStyle = FontStyle.Bold,
                    normal = { textColor = new Color(0.9f, 0.95f, 1f) }
                };

                hintStyle = new GUIStyle(GUI.skin.label)
                {
                    fontSize = 11,
                    alignment = TextAnchor.MiddleCenter,
                    normal = { textColor = new Color(0.85f, 0.85f, 0.85f) }
                };
            }
        }
    }
}
