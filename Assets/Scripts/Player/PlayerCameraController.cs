using UnityEngine;

namespace Roadbound.Player
{
    public class PlayerCameraController : MonoBehaviour
    {
        [Header("Target & References")]
        [SerializeField] private Transform target;
        [SerializeField] private Camera targetCamera;
        [SerializeField] private PlayerInputHandler inputHandler;

        [Header("Orbit & Sensitivity")]
        [SerializeField] private float mouseSensitivityX = 1.8f;
        [SerializeField] private float mouseSensitivityY = 1.5f;
        [SerializeField] private float minPitch = -40f;
        [SerializeField] private float maxPitch = 75f;
        [SerializeField] private bool invertY = false;

        [Header("Distance & Offsets")]
        [SerializeField] private Vector3 pivotOffset = new Vector3(0f, 1.55f, 0f);
        [SerializeField] private Vector3 normalShoulderOffset = new Vector3(0.45f, 0f, 0f);
        [SerializeField] private Vector3 aimShoulderOffset = new Vector3(0.55f, 0.1f, 0f);
        [SerializeField] private float normalDistance = 3.5f;
        [SerializeField] private float aimDistance = 1.8f;

        [Header("Field of View")]
        [SerializeField] private float normalFOV = 60f;
        [SerializeField] private float aimFOV = 45f;
        [SerializeField] private float fovTransitionSpeed = 12f;

        [Header("Damping & Smoothing")]
        [SerializeField] private float followDamping = 18f;
        [SerializeField] private float rotationDamping = 25f;

        [Header("Collision Avoidance")]
        [SerializeField] private LayerMask collisionLayers = ~0;
        [SerializeField] private float cameraCollisionRadius = 0.22f;
        [SerializeField] private float minCollisionDistance = 0.5f;

        // Runtime Orbit Angles
        public float Yaw { get; private set; }
        public float Pitch { get; private set; }

        private float currentDistance;
        private Vector3 currentPivotPosition;
        private bool isAiming;

        // Recoil kick offsets
        private float recoilPitchOffset = 0f;
        private float recoilYawOffset = 0f;

        public Camera Camera => targetCamera;
        public bool IsAiming => isAiming;

        /// <summary>
        /// Raycast from center of camera view into the world to find what the crosshair is looking at.
        /// </summary>
        public Vector3 GetCrosshairWorldTarget(float maxRange = 500f, LayerMask hitMask = default)
        {
            if (targetCamera == null)
                return target != null ? target.position + target.forward * maxRange : Vector3.forward * maxRange;

            Ray ray = targetCamera.ViewportPointToRay(new Vector3(0.5f, 0.5f, 0f));
            if (hitMask == default) hitMask = ~0;

            if (Physics.Raycast(ray, out RaycastHit hit, maxRange, hitMask))
            {
                return hit.point;
            }

            return ray.origin + ray.direction * maxRange;
        }

        private void Awake()
        {
            if (targetCamera == null)
            {
                targetCamera = GetComponentInChildren<Camera>();
                if (targetCamera == null) targetCamera = Camera.main;
            }

            if (target == null)
            {
                var pc = FindFirstObjectByType<PlayerController>();
                if (pc != null) target = pc.transform;
            }

            if (inputHandler == null)
            {
                inputHandler = FindFirstObjectByType<PlayerInputHandler>();
            }

            if (target != null)
            {
                currentPivotPosition = target.position + pivotOffset;
                Yaw = target.eulerAngles.y;
            }

            currentDistance = normalDistance;
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }

        public void SetTarget(Transform newTarget)
        {
            target = newTarget;
            if (target != null)
            {
                currentPivotPosition = target.position + pivotOffset;
            }
        }

        public void SetAimState(bool aiming, float customAimFOV = -1f)
        {
            isAiming = aiming;
            if (targetCamera != null)
            {
                float targetFov = aiming ? (customAimFOV > 0 ? customAimFOV : aimFOV) : normalFOV;
                targetCamera.fieldOfView = Mathf.Lerp(targetCamera.fieldOfView, targetFov, Time.deltaTime * fovTransitionSpeed);
            }
        }

        public void ApplyRecoilKick(float pitchKick, float yawKick)
        {
            recoilPitchOffset += pitchKick;
            recoilYawOffset += yawKick;
        }

        private void LateUpdate()
        {
            if (target == null) return;

            // 1. Read input
            Vector2 look = inputHandler != null ? inputHandler.LookInput : Vector2.zero;
            float lookX = look.x * mouseSensitivityX;
            float lookY = look.y * mouseSensitivityY * (invertY ? -1f : 1f);

            // 2. Accumulate yaw & pitch with recoil recovery
            Yaw += lookX + recoilYawOffset;
            Pitch -= (lookY + recoilPitchOffset);
            Pitch = Mathf.Clamp(Pitch, minPitch, maxPitch);

            // Decay recoil offsets smoothly
            recoilPitchOffset = Mathf.MoveTowards(recoilPitchOffset, 0f, Time.deltaTime * 35f);
            recoilYawOffset = Mathf.MoveTowards(recoilYawOffset, 0f, Time.deltaTime * 35f);

            // 3. Smooth follow target pivot
            Vector3 targetPivot = target.position + pivotOffset;
            currentPivotPosition = Vector3.Lerp(currentPivotPosition, targetPivot, Time.deltaTime * followDamping);

            // 4. Calculate shoulder offset
            Quaternion currentRotation = Quaternion.Euler(Pitch, Yaw, 0f);
            Vector3 shoulderOffset = isAiming ? aimShoulderOffset : normalShoulderOffset;
            Vector3 pivotWithShoulder = currentPivotPosition + currentRotation * shoulderOffset;

            // 5. Target distance with aim interpolation
            float desiredDist = isAiming ? aimDistance : normalDistance;

            // 6. Camera Collision Test (SphereCast from pivot backward to camera)
            Vector3 backDir = currentRotation * -Vector3.forward;
            Ray collisionRay = new Ray(pivotWithShoulder, backDir);

            float safeDistance = desiredDist;
            if (Physics.SphereCast(collisionRay, cameraCollisionRadius, out RaycastHit hit, desiredDist, collisionLayers, QueryTriggerInteraction.Ignore))
            {
                // Don't collide with player target
                if (hit.transform != target && !hit.transform.IsChildOf(target))
                {
                    safeDistance = Mathf.Clamp(hit.distance - cameraCollisionRadius, minCollisionDistance, desiredDist);
                }
            }

            currentDistance = Mathf.Lerp(currentDistance, safeDistance, Time.deltaTime * 20f);

            // 7. Apply position and rotation
            Vector3 finalCamPos = pivotWithShoulder + backDir * currentDistance;
            transform.position = finalCamPos;
            transform.rotation = rotationDamping > 0f ? Quaternion.Slerp(transform.rotation, currentRotation, Time.deltaTime * rotationDamping) : currentRotation;
        }
    }
}
