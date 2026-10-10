using UnityEngine;

namespace Roadbound.Player
{
    [RequireComponent(typeof(CharacterController))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement Speeds (m/s)")]
        [Tooltip("Walk speed matching web CharacterController.js (4.2 m/s)")]
        [SerializeField] private float walkSpeed = 4.2f;
        [Tooltip("Sprint speed matching web CharacterController.js (9.2 m/s)")]
        [SerializeField] private float sprintSpeed = 9.2f;
        [Tooltip("Crouch speed matching web CharacterController.js (2.6 m/s)")]
        [SerializeField] private float crouchSpeed = 2.6f;
        [Tooltip("Aiming movement speed")]
        [SerializeField] private float aimSpeed = 3.2f;

        [Header("Acceleration & Responsiveness")]
        [SerializeField] private float acceleration = 14f;
        [SerializeField] private float deceleration = 18f;
        [SerializeField] private float rotationSpeed = 16f;

        [Header("Jumping & Gravity")]
        [Tooltip("Jump force matching web CharacterController.js (7.6 m/s)")]
        [SerializeField] private float jumpForce = 7.6f;
        [SerializeField] private float gravity = -20f;
        [SerializeField] private float groundedStickForce = -2f;

        [Header("Crouch Dimensions")]
        [SerializeField] private float standingHeight = 1.8f;
        [SerializeField] private float crouchingHeight = 1.2f;
        [SerializeField] private Vector3 standingCenter = new Vector3(0, 0.9f, 0);
        [SerializeField] private Vector3 crouchingCenter = new Vector3(0, 0.6f, 0);

        [Header("References")]
        [SerializeField] private PlayerInputHandler inputHandler;
        [SerializeField] private PlayerCameraController cameraController;

        // Components
        private CharacterController characterController;

        // Movement State
        private Vector3 currentVelocity;
        private float verticalVelocity;
        private bool isGrounded;
        private bool isCrouching;
        private bool isAiming;
        private float currentTargetSpeed;

        public bool IsGrounded => isGrounded;
        public bool IsCrouching => isCrouching;
        public bool IsAiming => isAiming;
        public bool IsSprinting => inputHandler != null && inputHandler.IsSprinting && !isCrouching && !isAiming && inputHandler.MoveInput.y > 0.1f;
        public Vector3 Velocity => characterController != null ? characterController.velocity : Vector3.zero;

        private void Awake()
        {
            characterController = GetComponent<CharacterController>();
            if (inputHandler == null) inputHandler = GetComponent<PlayerInputHandler>();
            if (cameraController == null) cameraController = FindFirstObjectByType<PlayerCameraController>();
        }

        private void OnEnable()
        {
            if (inputHandler != null)
            {
                inputHandler.OnJump += HandleJump;
                inputHandler.OnCrouch += HandleCrouchToggle;
            }
        }

        private void OnDisable()
        {
            if (inputHandler != null)
            {
                inputHandler.OnJump -= HandleJump;
                inputHandler.OnCrouch -= HandleCrouchToggle;
            }
        }

        private void Update()
        {
            CheckGrounded();
            HandleAiming();
            HandleMovement();
            HandleRotation();
            UpdateCrouchDimensions();
        }

        private void CheckGrounded()
        {
            isGrounded = characterController.isGrounded;
            if (isGrounded && verticalVelocity < 0f)
            {
                verticalVelocity = groundedStickForce;
            }
        }

        private void HandleAiming()
        {
            isAiming = inputHandler != null && inputHandler.AimHeld;
            if (cameraController != null)
            {
                cameraController.SetAimState(isAiming);
            }
        }

        private void HandleMovement()
        {
            Vector2 input = inputHandler != null ? inputHandler.MoveInput : Vector2.zero;
            Transform camTransform = cameraController != null && cameraController.Camera != null 
                ? cameraController.Camera.transform 
                : (Camera.main != null ? Camera.main.transform : transform);

            // 1. Calculate camera-relative movement direction on XZ plane
            Vector3 forward = Vector3.Scale(camTransform.forward, new Vector3(1, 0, 1)).normalized;
            Vector3 right = Vector3.Scale(camTransform.right, new Vector3(1, 0, 1)).normalized;
            Vector3 moveDirection = (forward * input.y + right * input.x).normalized;

            // 2. Determine target speed
            if (moveDirection.sqrMagnitude > 0.001f)
            {
                if (isAiming)
                    currentTargetSpeed = aimSpeed;
                else if (isCrouching)
                    currentTargetSpeed = crouchSpeed;
                else if (IsSprinting)
                    currentTargetSpeed = sprintSpeed;
                else
                    currentTargetSpeed = walkSpeed;
            }
            else
            {
                currentTargetSpeed = 0f;
            }

            // 3. Smooth acceleration / deceleration
            Vector3 targetHorizontalVelocity = moveDirection * currentTargetSpeed;
            float rate = moveDirection.sqrMagnitude > 0.001f ? acceleration : deceleration;
            currentVelocity = Vector3.MoveTowards(currentVelocity, targetHorizontalVelocity, rate * Time.deltaTime);

            // 4. Gravity
            if (!isGrounded)
            {
                verticalVelocity += gravity * Time.deltaTime;
            }

            // 5. Final movement vector
            Vector3 finalMove = currentVelocity;
            finalMove.y = verticalVelocity;

            characterController.Move(finalMove * Time.deltaTime);
        }

        private void HandleRotation()
        {
            Transform camTransform = cameraController != null && cameraController.Camera != null 
                ? cameraController.Camera.transform 
                : (Camera.main != null ? Camera.main.transform : transform);

            // When aiming or firing: rotate player directly toward camera aim direction
            bool isFiring = inputHandler != null && inputHandler.FireHeld;
            if (isAiming || isFiring)
            {
                Vector3 lookDirection = Vector3.Scale(camTransform.forward, new Vector3(1, 0, 1)).normalized;
                if (lookDirection.sqrMagnitude > 0.001f)
                {
                    Quaternion targetRot = Quaternion.LookRotation(lookDirection);
                    transform.rotation = Quaternion.Slerp(transform.rotation, targetRot, rotationSpeed * 1.5f * Time.deltaTime);
                }
            }
            else if (currentVelocity.sqrMagnitude > 0.1f)
            {
                // When moving freely: face movement direction smoothly
                Vector3 moveDir = new Vector3(currentVelocity.x, 0, currentVelocity.z).normalized;
                Quaternion targetRot = Quaternion.LookRotation(moveDir);
                transform.rotation = Quaternion.Slerp(transform.rotation, targetRot, rotationSpeed * Time.deltaTime);
            }
        }

        private void HandleJump()
        {
            if (isGrounded && !isCrouching)
            {
                verticalVelocity = jumpForce;
            }
            else if (isCrouching)
            {
                // Uncrouch on jump
                isCrouching = false;
            }
        }

        private void HandleCrouchToggle()
        {
            if (isGrounded)
            {
                isCrouching = !isCrouching;
            }
        }

        private void UpdateCrouchDimensions()
        {
            float targetHeight = isCrouching ? crouchingHeight : standingHeight;
            Vector3 targetCenter = isCrouching ? crouchingCenter : standingCenter;

            characterController.height = Mathf.Lerp(characterController.height, targetHeight, Time.deltaTime * 10f);
            characterController.center = Vector3.Lerp(characterController.center, targetCenter, Time.deltaTime * 10f);
        }
    }
}
