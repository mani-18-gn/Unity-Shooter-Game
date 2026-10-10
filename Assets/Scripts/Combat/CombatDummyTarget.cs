using System;
using System.Collections;
using UnityEngine;
using Roadbound.Core;

namespace Roadbound.Combat
{
    public class CombatDummyTarget : MonoBehaviour, IDamageable
    {
        [Header("Target Health")]
        [SerializeField] private float maxHealth = 100f;
        [SerializeField] private float currentHealth = 100f;
        [SerializeField] private string targetName = "Training Dummy";

        [Header("Visual Feedback")]
        [SerializeField] private Renderer targetRenderer;
        [SerializeField] private Color normalColor = Color.white;
        [SerializeField] private Color damageFlashColor = Color.red;
        [SerializeField] private Color deadColor = Color.gray;

        private Material targetMaterial;
        private Coroutine flashCoroutine;
        private bool isDead = false;

        public float CurrentHealth => currentHealth;
        public float MaxHealth => maxHealth;
        public bool IsDead => isDead;

        public event Action<float, bool> OnDamaged; // damage, isHeadshot
        public event Action OnDestroyed;

        private void Awake()
        {
            currentHealth = maxHealth;
            if (targetRenderer == null) targetRenderer = GetComponentInChildren<Renderer>();
            if (targetRenderer != null)
            {
                targetMaterial = targetRenderer.material;
                if (targetMaterial != null)
                {
                    targetMaterial.color = normalColor;
                }
            }
        }

        public void TakeDamage(float damage, bool isHeadshot = false)
        {
            if (isDead || damage <= 0f) return;

            float effectiveDamage = damage;
            if (isHeadshot)
            {
                effectiveDamage *= 2.0f;
            }

            currentHealth -= effectiveDamage;
            Debug.Log($"[{targetName}] Took {effectiveDamage:F1} DMG (Headshot: {isHeadshot}) -> Remaining HP: {Mathf.Max(0f, currentHealth):F1}/{maxHealth}");

            OnDamaged?.Invoke(effectiveDamage, isHeadshot);

            if (targetRenderer != null)
            {
                if (flashCoroutine != null) StopCoroutine(flashCoroutine);
                flashCoroutine = StartCoroutine(DamageFlashRoutine());
            }

            if (currentHealth <= 0f)
            {
                currentHealth = 0f;
                Die();
            }
        }

        public void Heal(float amount)
        {
            if (isDead || amount <= 0f) return;
            currentHealth = Mathf.Min(maxHealth, currentHealth + amount);
        }

        private IEnumerator DamageFlashRoutine()
        {
            if (targetMaterial != null)
            {
                targetMaterial.color = damageFlashColor;
                yield return new WaitForSeconds(0.12f);
                if (!isDead)
                {
                    targetMaterial.color = normalColor;
                }
            }
        }

        private void Die()
        {
            if (isDead) return;
            isDead = true;
            Debug.Log($"[{targetName}] Destroyed / Eliminated!");

            if (targetMaterial != null)
            {
                targetMaterial.color = deadColor;
            }

            // Tip over backward if rigidbody exists
            Rigidbody rb = GetComponent<Rigidbody>();
            if (rb != null)
            {
                rb.isKinematic = false;
                rb.AddForce(-transform.forward * 4f + Vector3.up * 2f, ForceMode.Impulse);
            }

            OnDestroyed?.Invoke();
        }

        public void ResetTarget()
        {
            isDead = false;
            currentHealth = maxHealth;
            if (targetMaterial != null)
            {
                targetMaterial.color = normalColor;
            }
            Rigidbody rb = GetComponent<Rigidbody>();
            if (rb != null)
            {
                rb.isKinematic = true;
            }
        }
    }
}
