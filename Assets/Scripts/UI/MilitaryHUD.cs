using UnityEngine;
using Roadbound.Player;
using Roadbound.Combat;
using Roadbound.World;

namespace Roadbound.UI
{
    public class MilitaryHUD : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private PlayerHealth playerHealth;
        [SerializeField] private WeaponController weaponController;
        [SerializeField] private PlayerCameraController cameraController;
        [SerializeField] private BattleRoyaleZoneManager zoneManager;
        [SerializeField] private WeaponFireSystem fireSystem;

        // UI State
        private bool isPaused = false;
        private float hitMarkerTimer = 0f;
        private bool lastHitWasHeadshot = false;

        // Styles
        private GUIStyle headerStyle;
        private GUIStyle valueStyle;
        private GUIStyle alertStyle;
        private GUIStyle compassStyle;
        private GUIStyle buttonStyle;
        private Texture2D whitePixel;

        private void Awake()
        {
            if (playerHealth == null) playerHealth = FindFirstObjectByType<PlayerHealth>();
            if (weaponController == null) weaponController = FindFirstObjectByType<WeaponController>();
            if (cameraController == null) cameraController = FindFirstObjectByType<PlayerCameraController>();
            if (zoneManager == null) zoneManager = FindFirstObjectByType<BattleRoyaleZoneManager>();
            if (fireSystem == null) fireSystem = FindFirstObjectByType<WeaponFireSystem>();

            whitePixel = new Texture2D(1, 1);
            whitePixel.SetPixel(0, 0, Color.white);
            whitePixel.Apply();
        }

        private void OnEnable()
        {
            if (fireSystem != null)
            {
                fireSystem.OnHitConfirmed += HandleHitConfirmed;
            }
        }

        private void OnDisable()
        {
            if (fireSystem != null)
            {
                fireSystem.OnHitConfirmed -= HandleHitConfirmed;
            }
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                isPaused = !isPaused;
                Time.timeScale = isPaused ? 0f : 1f;
                Cursor.lockState = isPaused ? CursorLockMode.None : CursorLockMode.Locked;
                Cursor.visible = isPaused;
            }

            if (hitMarkerTimer > 0f)
            {
                hitMarkerTimer -= Time.deltaTime;
            }
        }

        private void HandleHitConfirmed(RaycastHit hit, bool isHeadshot, float damage)
        {
            hitMarkerTimer = 0.22f;
            lastHitWasHeadshot = isHeadshot;
        }

        private void InitializeStyles()
        {
            if (headerStyle != null) return;

            headerStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 12,
                fontStyle = FontStyle.Bold,
                normal = { textColor = new Color(0.7f, 0.75f, 0.8f) }
            };

            valueStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 20,
                fontStyle = FontStyle.Bold,
                normal = { textColor = Color.white }
            };

            alertStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 24,
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = new Color(1.0f, 0.2f, 0.2f) }
            };

            compassStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 14,
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = new Color(0.9f, 0.85f, 0.6f) }
            };

            buttonStyle = new GUIStyle(GUI.skin.button)
            {
                fontSize = 16,
                fontStyle = FontStyle.Bold
            };
        }

        private void OnGUI()
        {
            InitializeStyles();

            DrawCompassBar();
            DrawCrosshair();
            DrawHitMarker();
            DrawHealthAndArmor();
            DrawWeaponInfo();
            DrawZoneWarning();

            if (isPaused)
            {
                DrawPauseMenu();
            }
        }

        private void DrawCompassBar()
        {
            float yaw = cameraController != null ? cameraController.Yaw % 360f : 0f;
            if (yaw < 0f) yaw += 360f;

            string headingText = GetHeadingString(yaw);
            float width = 240f;
            float height = 28f;
            Rect compassRect = new Rect((Screen.width - width) * 0.5f, 15f, width, height);

            DrawSolidRect(compassRect, new Color(0.08f, 0.1f, 0.12f, 0.75f));
            GUI.Label(compassRect, headingText, compassStyle);
        }

        private string GetHeadingString(float yaw)
        {
            string dir = "N";
            if (yaw >= 337.5f || yaw < 22.5f) dir = "N";
            else if (yaw >= 22.5f && yaw < 67.5f) dir = "NE";
            else if (yaw >= 67.5f && yaw < 112.5f) dir = "E";
            else if (yaw >= 112.5f && yaw < 157.5f) dir = "SE";
            else if (yaw >= 157.5f && yaw < 202.5f) dir = "S";
            else if (yaw >= 202.5f && yaw < 247.5f) dir = "SW";
            else if (yaw >= 247.5f && yaw < 292.5f) dir = "W";
            else if (yaw >= 292.5f && yaw < 337.5f) dir = "NW";

            return $"▲  {dir}  [{(int)yaw}°]";
        }

        private void DrawCrosshair()
        {
            float cx = Screen.width * 0.5f;
            float cy = Screen.height * 0.5f;
            float size = 8f;
            float gap = 5f;

            Color crosshairCol = new Color(1f, 1f, 1f, 0.85f);

            // Left, Right, Top, Bottom ticks
            DrawSolidRect(new Rect(cx - gap - size, cy - 1f, size, 2f), crosshairCol);
            DrawSolidRect(new Rect(cx + gap, cy - 1f, size, 2f), crosshairCol);
            DrawSolidRect(new Rect(cx - 1f, cy - gap - size, 2f, size), crosshairCol);
            DrawSolidRect(new Rect(cx - 1f, cy + gap, 2f, size), crosshairCol);

            // Center pip
            DrawSolidRect(new Rect(cx - 1f, cy - 1f, 2f, 2f), new Color(1f, 0.9f, 0.2f, 0.9f));
        }

        private void DrawHitMarker()
        {
            if (hitMarkerTimer <= 0f) return;

            float cx = Screen.width * 0.5f;
            float cy = Screen.height * 0.5f;
            float len = 10f;
            Color col = lastHitWasHeadshot ? new Color(1f, 0.15f, 0.15f, 0.95f) : new Color(1f, 1f, 1f, 0.9f);

            DrawSolidRect(new Rect(cx - len - 4f, cy - len - 4f, len, 2f), col);
            DrawSolidRect(new Rect(cx + 4f, cy + 4f, len, 2f), col);
            DrawSolidRect(new Rect(cx - len - 4f, cy + len + 4f, len, 2f), col);
            DrawSolidRect(new Rect(cx + 4f, cy - len - 4f, len, 2f), col);
        }

        private void DrawHealthAndArmor()
        {
            float x = 30f;
            float y = Screen.height - 85f;
            float barWidth = 200f;
            float barHeight = 14f;

            float hp = playerHealth != null ? playerHealth.CurrentHealth : 100f;
            float maxHp = playerHealth != null ? playerHealth.MaxHealth : 100f;
            float armor = playerHealth != null ? playerHealth.CurrentArmor : 100f;
            float maxArmor = playerHealth != null ? playerHealth.MaxArmor : 100f;

            // Background card
            DrawSolidRect(new Rect(x - 10f, y - 25f, barWidth + 80f, 75f), new Color(0.08f, 0.1f, 0.12f, 0.85f));

            // Health bar
            GUI.Label(new Rect(x, y - 22f, 80f, 20f), "HEALTH", headerStyle);
            DrawSolidRect(new Rect(x, y, barWidth, barHeight), new Color(0.2f, 0.25f, 0.25f));
            DrawSolidRect(new Rect(x, y, barWidth * (hp / maxHp), barHeight), new Color(0.2f, 0.85f, 0.35f));
            GUI.Label(new Rect(x + barWidth + 10f, y - 3f, 60f, 20f), $"{(int)hp}", valueStyle);

            // Armor bar
            y += 24f;
            GUI.Label(new Rect(x, y - 20f, 80f, 20f), "ARMOR", headerStyle);
            DrawSolidRect(new Rect(x, y, barWidth, barHeight), new Color(0.2f, 0.25f, 0.25f));
            DrawSolidRect(new Rect(x, y, barWidth * (armor / maxArmor), barHeight), new Color(0.2f, 0.65f, 1.0f));
            GUI.Label(new Rect(x + barWidth + 10f, y - 3f, 60f, 20f), $"{(int)armor}", valueStyle);
        }

        private void DrawWeaponInfo()
        {
            float width = 220f;
            float height = 75f;
            float x = Screen.width - width - 30f;
            float y = Screen.height - height - 30f;

            DrawSolidRect(new Rect(x, y, width, height), new Color(0.08f, 0.1f, 0.12f, 0.85f));

            string weaponName = "PRIMARY WEAPON";
            string ammoText = "30 / 90";
            string fireMode = "AUTO";

            if (weaponController != null && weaponController.ActiveWeapon != null)
            {
                var wep = weaponController.ActiveWeapon;
                weaponName = wep.Data != null ? wep.Data.weaponName.ToUpper() : "UNKNOWN";
                ammoText = $"{wep.CurrentClip} / {wep.ReserveAmmo}";
                fireMode = wep.Data != null && wep.Data.isAutomatic ? "AUTO" : "SEMI";
            }

            GUI.Label(new Rect(x + 15f, y + 8f, 140f, 20f), weaponName, headerStyle);
            GUI.Label(new Rect(x + width - 60f, y + 8f, 50f, 20f), fireMode, headerStyle);
            GUI.Label(new Rect(x + 15f, y + 30f, 180f, 35f), ammoText, valueStyle);
        }

        private void DrawZoneWarning()
        {
            if (zoneManager != null && !zoneManager.IsPlayerInsideSafeZone)
            {
                Rect warnRect = new Rect((Screen.width - 400f) * 0.5f, 60f, 400f, 40f);
                DrawSolidRect(warnRect, new Color(0.7f, 0.1f, 0.1f, 0.7f));
                GUI.Label(warnRect, "⚠ WARNING: OUTSIDE SAFE ZONE ⚠", alertStyle);
            }
        }

        private void DrawPauseMenu()
        {
            DrawSolidRect(new Rect(0, 0, Screen.width, Screen.height), new Color(0f, 0f, 0f, 0.6f));

            float w = 280f;
            float h = 260f;
            Rect menuRect = new Rect((Screen.width - w) * 0.5f, (Screen.height - h) * 0.5f, w, h);
            DrawSolidRect(menuRect, new Color(0.12f, 0.14f, 0.16f, 0.95f));

            GUI.Label(new Rect(menuRect.x, menuRect.y + 20f, w, 30f), "TACTICAL PAUSE", compassStyle);

            if (GUI.Button(new Rect(menuRect.x + 30f, menuRect.y + 70f, w - 60f, 38f), "RESUME", buttonStyle))
            {
                isPaused = false;
                Time.timeScale = 1f;
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }

            if (GUI.Button(new Rect(menuRect.x + 30f, menuRect.y + 125f, w - 60f, 38f), "RESTART MATCH", buttonStyle))
            {
                Time.timeScale = 1f;
                UnityEngine.SceneManagement.SceneManager.LoadScene(UnityEngine.SceneManagement.SceneManager.GetActiveScene().name);
            }

            if (GUI.Button(new Rect(menuRect.x + 30f, menuRect.y + 180f, w - 60f, 38f), "EXIT TO DESKTOP", buttonStyle))
            {
                Application.Quit();
            }
        }

        private void DrawSolidRect(Rect rect, Color color)
        {
            Color oldCol = GUI.color;
            GUI.color = color;
            GUI.DrawTexture(rect, whitePixel);
            GUI.color = oldCol;
        }
    }
}
