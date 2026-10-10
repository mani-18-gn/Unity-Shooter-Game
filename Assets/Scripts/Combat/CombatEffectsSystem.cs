using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Roadbound.Combat
{
    public class CombatEffectsSystem : MonoBehaviour
    {
        [Header("Muzzle Flash")]
        [SerializeField] private Color muzzleFlashColor = new Color(1.0f, 0.85f, 0.45f);
        [SerializeField] private float muzzleFlashDuration = 0.05f;

        [Header("Tracer")]
        [SerializeField] private Color tracerColor = new Color(1.0f, 0.9f, 0.5f, 0.8f);
        [SerializeField] private float tracerDuration = 0.06f;

        [Header("References")]
        [SerializeField] private WeaponFireSystem fireSystem;

        private Light muzzleLight;
        private Material tracerMaterial;
        private Queue<LineRenderer> tracerPool = new Queue<LineRenderer>();

        private void Awake()
        {
            if (fireSystem == null) fireSystem = GetComponent<WeaponFireSystem>() ?? FindFirstObjectByType<WeaponFireSystem>();

            // Setup Muzzle Light
            GameObject lightObj = new GameObject("MuzzleFlashLight");
            lightObj.transform.SetParent(transform, false);
            muzzleLight = lightObj.AddComponent<Light>();
            muzzleLight.type = LightType.Point;
            muzzleLight.range = 5f;
            muzzleLight.intensity = 0f;
            muzzleLight.color = muzzleFlashColor;
            muzzleLight.shadows = LightShadows.None;

            // Setup Tracer Material
            Shader unlitShader = Shader.Find("Universal Render Pipeline/Unlit") ?? Shader.Find("Sprites/Default");
            tracerMaterial = new Material(unlitShader);
            tracerMaterial.color = tracerColor;
        }

        private void OnEnable()
        {
            if (fireSystem != null)
            {
                fireSystem.OnMuzzleFired += HandleMuzzleFired;
                fireSystem.OnHitConfirmed += HandleHitConfirmed;
            }
        }

        private void OnDisable()
        {
            if (fireSystem != null)
            {
                fireSystem.OnMuzzleFired -= HandleMuzzleFired;
                fireSystem.OnHitConfirmed -= HandleHitConfirmed;
            }
        }

        private void HandleMuzzleFired(Vector3 origin, Vector3 dir)
        {
            // Flash muzzle light
            StartCoroutine(FlashMuzzleLight(origin));

            // Spawn Tracer
            Vector3 endPoint = origin + dir * 60f;
            SpawnTracer(origin, endPoint);
        }

        private void HandleHitConfirmed(RaycastHit hit, bool isHeadshot, float damage)
        {
            // Spawn impact spark/puff
            SpawnImpactEffect(hit.point, hit.normal, isHeadshot);
        }

        private IEnumerator FlashMuzzleLight(Vector3 pos)
        {
            if (muzzleLight == null) yield break;
            muzzleLight.transform.position = pos;
            muzzleLight.intensity = 3.5f;
            yield return new WaitForSeconds(muzzleFlashDuration);
            muzzleLight.intensity = 0f;
        }

        private void SpawnTracer(Vector3 start, Vector3 end)
        {
            LineRenderer lr;
            if (tracerPool.Count > 0)
            {
                lr = tracerPool.Dequeue();
                lr.gameObject.SetActive(true);
            }
            else
            {
                GameObject tracerObj = new GameObject("BulletTracer");
                lr = tracerObj.AddComponent<LineRenderer>();
                lr.material = tracerMaterial;
                lr.startWidth = 0.04f;
                lr.endWidth = 0.01f;
                lr.positionCount = 2;
                lr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
                lr.receiveShadows = false;
            }

            lr.SetPosition(0, start);
            lr.SetPosition(1, end);
            StartCoroutine(RecycleTracer(lr));
        }

        private IEnumerator RecycleTracer(LineRenderer lr)
        {
            yield return new WaitForSeconds(tracerDuration);
            if (lr != null)
            {
                lr.gameObject.SetActive(false);
                tracerPool.Enqueue(lr);
            }
        }

        private void SpawnImpactEffect(Vector3 point, Vector3 normal, bool isHeadshot)
        {
            // Spawn temporary impact visual
            GameObject spark = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            spark.name = isHeadshot ? "HeadshotImpact" : "SurfaceImpact";
            spark.transform.position = point;
            spark.transform.localScale = Vector3.one * (isHeadshot ? 0.22f : 0.12f);
            Destroy(spark.GetComponent<Collider>());

            var ren = spark.GetComponent<MeshRenderer>();
            if (ren != null)
            {
                Material m = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                m.color = isHeadshot ? new Color(0.9f, 0.1f, 0.1f) : new Color(1.0f, 0.75f, 0.2f);
                if (!isHeadshot)
                {
                    m.EnableKeyword("_EMISSION");
                    m.SetColor("_EmissionColor", new Color(1.0f, 0.6f, 0.1f) * 2f);
                }
                ren.material = m;
            }

            Destroy(spark, 0.18f);
        }
    }
}
