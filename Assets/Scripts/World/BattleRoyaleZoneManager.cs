using System;
using UnityEngine;
using Roadbound.Player;

namespace Roadbound.World
{
    public class BattleRoyaleZoneManager : MonoBehaviour
    {
        [Header("Zone Boundaries")]
        [SerializeField] private Vector3 zoneCenter = Vector3.zero;
        [SerializeField] private float initialRadius = 120f;
        [SerializeField] private float finalRadius = 15f;
        [SerializeField] private float shrinkSpeed = 1.8f; // meters per second
        [SerializeField] private float damagePerSecond = 8f;

        [Header("Match Progression")]
        [SerializeField] private float matchDuration = 300f; // 5 minutes
        [SerializeField] private int initialEnemyCount = 10;

        // Runtime State
        public float CurrentRadius { get; private set; }
        public float TargetRadius { get; private set; }
        public float MatchTimer { get; private set; }
        public int RemainingFighters { get; private set; }
        public bool IsMatchActive { get; private set; }
        public bool IsPlayerInsideSafeZone { get; private set; }

        public event Action<int> OnFightersCountChanged;
        public event Action OnMatchVictory;
        public event Action OnMatchDefeat;

        private PlayerController player;
        private PlayerHealth playerHealth;
        private float damageTickTimer = 0f;

        private void Awake()
        {
            CurrentRadius = initialRadius;
            TargetRadius = initialRadius * 0.5f;
            MatchTimer = 0f;
            RemainingFighters = initialEnemyCount + 1; // Enemies + Player
            IsMatchActive = true;
        }

        private void Start()
        {
            player = FindFirstObjectByType<PlayerController>();
            if (player != null)
            {
                playerHealth = player.GetComponent<PlayerHealth>();
                if (playerHealth != null)
                {
                    playerHealth.OnDeath += HandlePlayerDied;
                }
            }
        }

        private void Update()
        {
            if (!IsMatchActive) return;

            MatchTimer += Time.deltaTime;

            // 1. Shrink zone toward target radius
            if (CurrentRadius > TargetRadius)
            {
                CurrentRadius = Mathf.MoveTowards(CurrentRadius, TargetRadius, shrinkSpeed * Time.deltaTime);
            }
            else
            {
                // Gradually set next target radius
                TargetRadius = Mathf.Max(finalRadius, TargetRadius * 0.7f);
            }

            // 2. Check Player Zone Status
            if (player != null)
            {
                float distFromCenter = Vector3.Distance(new Vector3(player.transform.position.x, 0, player.transform.position.z),
                                                        new Vector3(zoneCenter.x, 0, zoneCenter.z));
                IsPlayerInsideSafeZone = distFromCenter <= CurrentRadius;

                if (!IsPlayerInsideSafeZone && playerHealth != null && !playerHealth.IsDead)
                {
                    damageTickTimer += Time.deltaTime;
                    if (damageTickTimer >= 1.0f)
                    {
                        damageTickTimer = 0f;
                        playerHealth.TakeDamage(damagePerSecond, false);
                    }
                }
                else
                {
                    damageTickTimer = 0f;
                }
            }
        }

        public void RecordEnemyEliminated()
        {
            RemainingFighters = Mathf.Max(1, RemainingFighters - 1);
            OnFightersCountChanged?.Invoke(RemainingFighters);

            if (RemainingFighters <= 1 && playerHealth != null && !playerHealth.IsDead)
            {
                TriggerVictory();
            }
        }

        private void HandlePlayerDied()
        {
            IsMatchActive = false;
            OnMatchDefeat?.Invoke();
            Debug.Log("[BattleRoyaleZoneManager] DEFEAT: Player was eliminated!");
        }

        private void TriggerVictory()
        {
            IsMatchActive = false;
            OnMatchVictory?.Invoke();
            Debug.Log("[BattleRoyaleZoneManager] VICTORY: You are the last survivor!");
        }

        private void OnDrawGizmos()
        {
            // Draw Zone Rings in Scene View
            Gizmos.color = Color.cyan;
            Gizmos.DrawWireSphere(zoneCenter, CurrentRadius);

            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(zoneCenter, TargetRadius);
        }
    }
}
