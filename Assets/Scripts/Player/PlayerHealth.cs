using System;
using UnityEngine;
using Roadbound.Core;

namespace Roadbound.Player
{
    public class PlayerHealth : MonoBehaviour, IDamageable
    {
        [Header("Health Configuration")]
        [SerializeField] private float maxHealth = 100f;
        [SerializeField] private float currentHealth = 100f;

        [Header("Armor Configuration")]
        [SerializeField] private float maxArmor = 100f;
        [SerializeField] private float currentArmor = 80f;
        [Range(0f, 1f)]
        [SerializeField] private float armorAbsorptionRatio = 0.65f;

        [Header("State")]
        [SerializeField] private bool isDead = false;

        // Public Properties
        public float CurrentHealth => currentHealth;
        public float MaxHealth => maxHealth;
        public float CurrentArmor => currentArmor;
        public float MaxArmor => maxArmor;
        public bool IsDead => isDead;

        // Events for UI HUD and audio systems
        public event Action<float, float> OnHealthChanged; // current, max
        public event Action<float, float> OnArmorChanged;  // current, max
        public event Action<float, bool> OnDamaged;       // damage, isHeadshot
        public event Action OnDeath;
        public event Action OnHealed;

        private void Awake()
        {
            currentHealth = Mathf.Clamp(currentHealth, 0f, maxHealth);
            currentArmor = Mathf.Clamp(currentArmor, 0f, maxArmor);
        }

        private void Start()
        {
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
            OnArmorChanged?.Invoke(currentArmor, maxArmor);
        }

        public void TakeDamage(float damage, bool isHeadshot = false)
        {
            if (isDead || damage <= 0f) return;

            float effectiveDamage = damage;
            if (isHeadshot)
            {
                // 2.0x critical damage multiplier for headshots matching EnemyShooterAI.js
                effectiveDamage *= 2.0f;
            }

            // Armor absorbs a percentage of bullet damage
            if (currentArmor > 0f)
            {
                float armorDamage = effectiveDamage * armorAbsorptionRatio;
                float remainingDamage = effectiveDamage - armorDamage;

                if (currentArmor >= armorDamage)
                {
                    currentArmor -= armorDamage;
                    effectiveDamage = remainingDamage;
                }
                else
                {
                    float absorbed = currentArmor;
                    effectiveDamage -= absorbed;
                    currentArmor = 0f;
                }

                OnArmorChanged?.Invoke(currentArmor, maxArmor);
            }

            currentHealth -= effectiveDamage;
            OnDamaged?.Invoke(effectiveDamage, isHeadshot);

            if (currentHealth <= 0f)
            {
                currentHealth = 0f;
                Die();
            }

            OnHealthChanged?.Invoke(currentHealth, maxHealth);
        }

        public void Heal(float amount)
        {
            if (isDead || amount <= 0f) return;

            currentHealth = Mathf.Min(maxHealth, currentHealth + amount);
            OnHealed?.Invoke();
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
        }

        public void RepairArmor(float amount)
        {
            if (isDead || amount <= 0f) return;

            currentArmor = Mathf.Min(maxArmor, currentArmor + amount);
            OnArmorChanged?.Invoke(currentArmor, maxArmor);
        }

        private void Die()
        {
            if (isDead) return;
            isDead = true;
            OnDeath?.Invoke();
            Debug.Log($"[PlayerHealth] Player has been eliminated.");
        }

        public void ResetHealth()
        {
            isDead = false;
            currentHealth = maxHealth;
            currentArmor = maxArmor;
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
            OnArmorChanged?.Invoke(currentArmor, maxArmor);
        }
    }
}
