using UnityEngine;
using Roadbound.Player;

namespace Roadbound.Combat
{
    public class CombatAudioManager : MonoBehaviour
    {
        [Header("Audio Clips")]
        [SerializeField] private AudioClip rifleShotClip;
        [SerializeField] private AudioClip pistolShotClip;
        [SerializeField] private AudioClip reloadClip;
        [SerializeField] private AudioClip bulletHitClip;
        [SerializeField] private AudioClip explosionClip;
        [SerializeField] private AudioClip landingClip;
        [SerializeField] private AudioClip[] hurtClips;

        [Header("Audio Source")]
        [SerializeField] private AudioSource audioSource;

        [Header("System References")]
        [SerializeField] private WeaponFireSystem fireSystem;
        [SerializeField] private PlayerInputHandler inputHandler;
        [SerializeField] private PlayerHealth playerHealth;

        private void Awake()
        {
            if (audioSource == null)
            {
                audioSource = GetComponent<AudioSource>();
                if (audioSource == null) audioSource = gameObject.AddComponent<AudioSource>();
            }

            audioSource.playOnAwake = false;
            audioSource.spatialBlend = 0f; // 2D for player weapon shots

            if (fireSystem == null) fireSystem = GetComponent<WeaponFireSystem>() ?? FindFirstObjectByType<WeaponFireSystem>();
            if (inputHandler == null) inputHandler = GetComponent<PlayerInputHandler>() ?? FindFirstObjectByType<PlayerInputHandler>();
            if (playerHealth == null) playerHealth = GetComponent<PlayerHealth>() ?? FindFirstObjectByType<PlayerHealth>();

            LoadClipsIfMissing();
        }

        private void LoadClipsIfMissing()
        {
#if UNITY_EDITOR
            if (rifleShotClip == null)
                rifleShotClip = UnityEditor.AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/Audio/Combat/GunShot.mp3");
            if (pistolShotClip == null)
                pistolShotClip = UnityEditor.AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/Audio/Combat/single_bullet_fire.mp3");
            if (reloadClip == null)
                reloadClip = UnityEditor.AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/Audio/Combat/reload.mp3");
            if (bulletHitClip == null)
                bulletHitClip = UnityEditor.AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/Audio/Combat/bullet_hit.mp3");
            if (explosionClip == null)
                explosionClip = UnityEditor.AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/Audio/Combat/explosion.mp3");
            if (landingClip == null)
                landingClip = UnityEditor.AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/Audio/Combat/land.mp3");

            if (hurtClips == null || hurtClips.Length == 0)
            {
                var g1 = UnityEditor.AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/Audio/Combat/grunt1.wav");
                var g2 = UnityEditor.AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/Audio/Combat/grunt2.wav");
                if (g1 != null && g2 != null) hurtClips = new[] { g1, g2 };
            }
#endif
        }

        private void OnEnable()
        {
            if (fireSystem != null)
            {
                fireSystem.OnMuzzleFired += HandleMuzzleFired;
                fireSystem.OnHitConfirmed += HandleHitConfirmed;
            }
            if (inputHandler != null)
            {
                inputHandler.OnReload += HandleReload;
            }
            if (playerHealth != null)
            {
                playerHealth.OnDamaged += HandlePlayerDamaged;
            }
        }

        private void OnDisable()
        {
            if (fireSystem != null)
            {
                fireSystem.OnMuzzleFired -= HandleMuzzleFired;
                fireSystem.OnHitConfirmed -= HandleHitConfirmed;
            }
            if (inputHandler != null)
            {
                inputHandler.OnReload -= HandleReload;
            }
            if (playerHealth != null)
            {
                playerHealth.OnDamaged -= HandlePlayerDamaged;
            }
        }

        private void HandleMuzzleFired(Vector3 origin, Vector3 dir)
        {
            if (rifleShotClip != null && audioSource != null)
            {
                audioSource.pitch = Random.Range(0.96f, 1.04f);
                audioSource.PlayOneShot(rifleShotClip, 0.85f);
            }
        }

        private void HandleHitConfirmed(RaycastHit hit, bool isHeadshot, float damage)
        {
            if (bulletHitClip != null)
            {
                // Spatial hit sound at impact location
                AudioSource.PlayClipAtPoint(bulletHitClip, hit.point, 0.7f);
            }
        }

        private void HandleReload()
        {
            if (reloadClip != null && audioSource != null)
            {
                audioSource.pitch = 1.0f;
                audioSource.PlayOneShot(reloadClip, 0.75f);
            }
        }

        private void HandlePlayerDamaged(float damage, bool isHeadshot)
        {
            if (hurtClips != null && hurtClips.Length > 0 && audioSource != null)
            {
                AudioClip clip = hurtClips[Random.Range(0, hurtClips.Length)];
                if (clip != null)
                {
                    audioSource.pitch = Random.Range(0.95f, 1.05f);
                    audioSource.PlayOneShot(clip, 0.9f);
                }
            }
        }

        public void PlayExplosion(Vector3 position)
        {
            if (explosionClip != null)
            {
                AudioSource.PlayClipAtPoint(explosionClip, position, 1.0f);
            }
        }

        public void PlayLanding()
        {
            if (landingClip != null && audioSource != null)
            {
                audioSource.PlayOneShot(landingClip, 0.6f);
            }
        }
    }
}
