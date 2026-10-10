using System;
using UnityEngine;
using UnityEngine.AI;
using Roadbound.Core;
using Roadbound.Player;
using Roadbound.Combat;

namespace Roadbound.AI
{
    [RequireComponent(typeof(NavMeshAgent))]
    public class TacticalEnemyAI : MonoBehaviour, IDamageable
    {
        public enum AIState { Patrol, Chase, Combat, Dead }

        [Header("Identity & Stats")]
        [SerializeField] private string enemyName = "Hostile Insurgent";
        [SerializeField] private float maxHealth = 100f;
        [SerializeField] private float currentHealth = 100f;

        [Header("Combat Tuning")]
        [SerializeField] private float sightRange = 35f;
        [SerializeField] private float attackRange = 22f;
        [SerializeField] private float fieldOfView = 120f;
        [SerializeField] private float fireRate = 0.15f; // seconds between shots
        [SerializeField] private float damagePerShot = 15f;
        [SerializeField] private float accuracySpread = 0.08f;

        [Header("References")]
        [SerializeField] private Transform muzzlePoint;
        [SerializeField] private Transform headBone;
        [SerializeField] private AudioClip gunShotSound;

        // Components
        private NavMeshAgent agent;
        private Transform playerTarget;
        private PlayerHealth playerHealth;
        private AIState currentState = AIState.Patrol;
        private bool isDead = false;
        private float lastFireTime = 0f;
        private Vector3 patrolOrigin;
        private float patrolTimer = 0f;

        // IDamageable Implementation
        public float CurrentHealth => currentHealth;
        public float MaxHealth => maxHealth;
        public bool IsDead => isDead;
        public Transform MuzzlePoint { get => muzzlePoint; set => muzzlePoint = value; }

        public event Action<float, bool> OnDamaged;
        public event Action OnDied;

        private void Awake()
        {
            agent = GetComponent<NavMeshAgent>();
            currentHealth = maxHealth;
            patrolOrigin = transform.position;

            var player = FindFirstObjectByType<PlayerController>();
            if (player != null)
            {
                playerTarget = player.transform;
                playerHealth = player.GetComponent<PlayerHealth>();
            }

            if (gunShotSound == null)
            {
#if UNITY_EDITOR
                gunShotSound = UnityEditor.AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/Audio/Combat/GunShot.mp3");
#endif
            }

            if (muzzlePoint == null)
            {
                var attachment = GetComponentInChildren<SoldierWeaponAttachment>();
                if (attachment != null && attachment.MuzzlePointTransform != null)
                {
                    muzzlePoint = attachment.MuzzlePointTransform;
                }
            }
        }

        private void Update()
        {
            if (isDead) return;

            if (playerTarget == null)
            {
                var pc = FindFirstObjectByType<PlayerController>();
                if (pc != null)
                {
                    playerTarget = pc.transform;
                    playerHealth = pc.GetComponent<PlayerHealth>();
                }
                return;
            }

            float distToPlayer = Vector3.Distance(transform.position, playerTarget.position);
            bool canSeePlayer = CanSeeTarget(playerTarget);

            switch (currentState)
            {
                case AIState.Patrol:
                    HandlePatrol(distToPlayer, canSeePlayer);
                    break;
                case AIState.Chase:
                    HandleChase(distToPlayer, canSeePlayer);
                    break;
                case AIState.Combat:
                    HandleCombat(distToPlayer, canSeePlayer);
                    break;
            }
        }

        private void HandlePatrol(float dist, bool canSee)
        {
            if (canSee && dist <= sightRange)
            {
                currentState = dist <= attackRange ? AIState.Combat : AIState.Chase;
                return;
            }

            patrolTimer += Time.deltaTime;
            if (patrolTimer >= 4f)
            {
                patrolTimer = 0f;
                Vector2 randomCircle = UnityEngine.Random.insideUnitCircle * 12f;
                Vector3 dest = patrolOrigin + new Vector3(randomCircle.x, 0f, randomCircle.y);
                if (NavMesh.SamplePosition(dest, out NavMeshHit hit, 5f, NavMesh.AllAreas))
                {
                    agent.SetDestination(hit.position);
                }
            }
        }

        private void HandleChase(float dist, bool canSee)
        {
            if (dist <= attackRange && canSee)
            {
                currentState = AIState.Combat;
                agent.ResetPath();
                return;
            }

            if (!canSee && dist > sightRange * 1.3f)
            {
                currentState = AIState.Patrol;
                return;
            }

            agent.SetDestination(playerTarget.position);
        }

        private void HandleCombat(float dist, bool canSee)
        {
            if (dist > attackRange * 1.25f || !canSee)
            {
                currentState = AIState.Chase;
                return;
            }

            // Face player
            Vector3 lookDir = (playerTarget.position - transform.position).normalized;
            lookDir.y = 0;
            if (lookDir.sqrMagnitude > 0.001f)
            {
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(lookDir), Time.deltaTime * 10f);
            }

            // Shoot
            if (Time.time >= lastFireTime + fireRate)
            {
                lastFireTime = Time.time;
                ExecuteShot();
            }
        }

        private void ExecuteShot()
        {
            Vector3 origin = muzzlePoint != null ? muzzlePoint.position : transform.position + Vector3.up * 1.4f;
            Vector3 dir = (playerTarget.position + Vector3.up * 1.0f - origin).normalized;

            // Apply spread
            dir += UnityEngine.Random.insideUnitSphere * accuracySpread;
            dir.Normalize();

            if (gunShotSound != null)
            {
                AudioSource.PlayClipAtPoint(gunShotSound, origin, 0.7f);
            }

            if (Physics.Raycast(origin, dir, out RaycastHit hit, sightRange, ~0, QueryTriggerInteraction.Ignore))
            {
                IDamageable victim = hit.collider.GetComponentInParent<IDamageable>();
                if (victim != null && !victim.IsDead)
                {
                    bool headshot = hit.collider.CompareTag("Head") || hit.collider.gameObject.name.IndexOf("head", StringComparison.OrdinalIgnoreCase) >= 0;
                    victim.TakeDamage(damagePerShot, headshot);
                }
            }
        }

        private bool CanSeeTarget(Transform target)
        {
            Vector3 origin = transform.position + Vector3.up * 1.5f;
            Vector3 targetCenter = target.position + Vector3.up * 1.0f;
            Vector3 toTarget = targetCenter - origin;

            if (toTarget.magnitude > sightRange) return false;

            // FOV check
            if (Vector3.Angle(transform.forward, toTarget.normalized) > fieldOfView * 0.5f) return false;

            // Raycast line of sight
            if (Physics.Raycast(origin, toTarget.normalized, out RaycastHit hit, sightRange, ~0, QueryTriggerInteraction.Ignore))
            {
                if (hit.transform == target || hit.transform.IsChildOf(target))
                {
                    return true;
                }
            }

            return false;
        }

        public void TakeDamage(float amount, bool isHeadshot = false)
        {
            if (isDead) return;

            float finalDamage = isHeadshot ? amount * 2.0f : amount;
            currentHealth = Mathf.Max(0f, currentHealth - finalDamage);
            OnDamaged?.Invoke(finalDamage, isHeadshot);

            // Alert AI to attacker
            if (currentState == AIState.Patrol)
            {
                currentState = AIState.Combat;
            }

            if (currentHealth <= 0f)
            {
                Die();
            }
        }

        public void Heal(float amount)
        {
            if (isDead || amount <= 0f) return;
            currentHealth = Mathf.Min(maxHealth, currentHealth + amount);
        }

        private void Die()
        {
            isDead = true;
            currentState = AIState.Dead;
            if (agent != null) agent.enabled = false;

            // Disable colliders
            foreach (var col in GetComponentsInChildren<Collider>())
            {
                col.enabled = false;
            }

            // Drop corpse or trigger ragdoll
            var rb = GetComponent<Rigidbody>();
            if (rb != null)
            {
                rb.isKinematic = false;
                rb.AddForce(Vector3.up * 2f - transform.forward * 3f, ForceMode.Impulse);
            }

            OnDied?.Invoke();
            Debug.Log($"[TacticalEnemyAI] {enemyName} eliminated!");
            Destroy(gameObject, 15f); // Cleanup corpse after 15 seconds
        }
    }
}
