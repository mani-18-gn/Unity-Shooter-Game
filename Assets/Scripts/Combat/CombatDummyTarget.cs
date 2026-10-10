using System;
using System.Collections;
using System.Collections.Generic;
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

        private readonly List<Material> targetMaterials = new List<Material>();
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
            InitMaterials();
        }

        private void InitMaterials()
        {
            targetMaterials.Clear();
            Renderer[] renderers = GetComponentsInChildren<Renderer>(true);
            Shader urpLit = Shader.Find("Universal Render Pipeline/Lit");

            foreach (var r in renderers)
            {
                if (r == null) continue;
                Material mat = r.material;
                if (mat != null)
                {
                    // Fallback to URP Lit if an error shader or legacy standard shader is present
                    if (urpLit != null && (mat.shader == null || mat.shader.name == "Standard" || mat.shader.name.Contains("Error") || mat.shader.name.Contains("InternalErrorShader")))
                    {
                        mat.shader = urpLit;
                    }

                    if (normalColor != Color.white)
                    {
                        SetMaterialColor(mat, normalColor);
                    }
                    targetMaterials.Add(mat);
                }
            }

            if (targetRenderer == null && renderers.Length > 0)
            {
                targetRenderer = renderers[0];
            }
        }

        private void SetMaterialColor(Material mat, Color col)
        {
            if (mat == null) return;
            mat.color = col;
            if (mat.HasProperty("_BaseColor"))
            {
                mat.SetColor("_BaseColor", col);
            }
        }

        private void ApplyColorToAll(Color col)
        {
            for (int i = 0; i < targetMaterials.Count; i++)
            {
                SetMaterialColor(targetMaterials[i], col);
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

            if (targetMaterials.Count > 0)
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
            ApplyColorToAll(damageFlashColor);
            yield return new WaitForSeconds(0.12f);
            if (!isDead)
            {
                ApplyColorToAll(normalColor);
            }
        }

        private void Die()
        {
            if (isDead) return;
            isDead = true;
            Debug.Log($"[{targetName}] Destroyed / Eliminated!");

            ApplyColorToAll(deadColor);

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
            ApplyColorToAll(normalColor);
            Rigidbody rb = GetComponent<Rigidbody>();
            if (rb != null)
            {
                rb.isKinematic = true;
                rb.linearVelocity = Vector3.zero;
                rb.angularVelocity = Vector3.zero;
            }
        }
    }
}
