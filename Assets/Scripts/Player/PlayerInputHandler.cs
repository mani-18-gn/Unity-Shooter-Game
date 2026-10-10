using System;
using UnityEngine;
using UnityEngine.InputSystem;

namespace Roadbound.Player
{
    public class PlayerInputHandler : MonoBehaviour
    {
        [Header("Input Action Asset")]
        [Tooltip("Reference to InputSystem_Actions asset")]
        [SerializeField] private InputActionAsset inputActions;

        [Header("State Values")]
        public Vector2 MoveInput { get; private set; }
        public Vector2 LookInput { get; private set; }
        public bool IsSprinting { get; private set; }
        public bool JumpTriggered { get; private set; }
        public bool CrouchTriggered { get; private set; }
        public bool InteractTriggered { get; private set; }
        public bool FireHeld { get; private set; }
        public bool FireTriggered { get; private set; }
        public bool AimHeld { get; private set; }
        public bool ReloadTriggered { get; private set; }

        // Events
        public event Action OnJump;
        public event Action OnCrouch;
        public event Action OnInteract;
        public event Action OnReload;
        public event Action<int> OnQuickSelectSlot; // 0, 1, 2
        public event Action OnNextWeapon;
        public event Action OnPreviousWeapon;

        private InputAction moveAction;
        private InputAction lookAction;
        private InputAction sprintAction;
        private InputAction jumpAction;
        private InputAction crouchAction;
        private InputAction attackAction;
        private InputAction interactAction;
        private InputAction prevAction;
        private InputAction nextAction;

        private void Awake()
        {
#if UNITY_EDITOR
            if (inputActions == null)
            {
                inputActions = UnityEditor.AssetDatabase.LoadAssetAtPath<InputActionAsset>("Assets/InputSystem_Actions.inputactions");
            }
#endif
            if (inputActions != null)
            {
                var playerMap = inputActions.FindActionMap("Player");
                if (playerMap != null)
                {
                    moveAction = playerMap.FindAction("Move");
                    lookAction = playerMap.FindAction("Look");
                    sprintAction = playerMap.FindAction("Sprint");
                    jumpAction = playerMap.FindAction("Jump");
                    crouchAction = playerMap.FindAction("Crouch");
                    attackAction = playerMap.FindAction("Attack");
                    interactAction = playerMap.FindAction("Interact");
                    prevAction = playerMap.FindAction("Previous");
                    nextAction = playerMap.FindAction("Next");
                }
            }
        }

        private void OnEnable()
        {
            if (inputActions != null)
            {
                inputActions.FindActionMap("Player")?.Enable();
            }

            if (jumpAction != null) jumpAction.performed += HandleJump;
            if (crouchAction != null) crouchAction.performed += HandleCrouch;
            if (interactAction != null) interactAction.performed += HandleInteract;
            if (prevAction != null) prevAction.performed += HandlePrev;
            if (nextAction != null) nextAction.performed += HandleNext;
        }

        private void OnDisable()
        {
            if (jumpAction != null) jumpAction.performed -= HandleJump;
            if (crouchAction != null) crouchAction.performed -= HandleCrouch;
            if (interactAction != null) interactAction.performed -= HandleInteract;
            if (prevAction != null) prevAction.performed -= HandlePrev;
            if (nextAction != null) nextAction.performed -= HandleNext;

            if (inputActions != null)
            {
                inputActions.FindActionMap("Player")?.Disable();
            }
        }

        private void Update()
        {
            // 1. Movement & Look
            Vector2 move = Vector2.zero;
            if (moveAction != null)
                move = moveAction.ReadValue<Vector2>();

            // Direct keyboard fallback if action asset binding did not produce vector
            if (move.sqrMagnitude < 0.001f && Keyboard.current != null)
            {
                float x = (Keyboard.current.dKey.isPressed || Keyboard.current.rightArrowKey.isPressed ? 1f : 0f) - 
                          (Keyboard.current.aKey.isPressed || Keyboard.current.leftArrowKey.isPressed ? 1f : 0f);
                float y = (Keyboard.current.wKey.isPressed || Keyboard.current.upArrowKey.isPressed ? 1f : 0f) - 
                          (Keyboard.current.sKey.isPressed || Keyboard.current.downArrowKey.isPressed ? 1f : 0f);
                move = new Vector2(x, y);
            }
            MoveInput = move;

            if (lookAction != null)
                LookInput = lookAction.ReadValue<Vector2>();
            else if (Mouse.current != null)
                LookInput = Mouse.current.delta.ReadValue();

            // 2. Sprinting (Hold Left Shift or Right Shift, Gamepad Left Stick, or Sprint Action)
            bool isShiftKey = Keyboard.current != null && (Keyboard.current.leftShiftKey.isPressed || Keyboard.current.rightShiftKey.isPressed);
            bool isGamepadSprint = Gamepad.current != null && Gamepad.current.leftStickButton.isPressed;
            bool isActionSprint = sprintAction != null && sprintAction.IsPressed();
            IsSprinting = isShiftKey || isGamepadSprint || isActionSprint;

            // 3. Firing (Attack)
            if (attackAction != null)
            {
                FireHeld = attackAction.IsPressed();
                FireTriggered = attackAction.WasPressedThisFrame();
            }
            else if (Mouse.current != null)
            {
                FireHeld = Mouse.current.leftButton.isPressed;
                FireTriggered = Mouse.current.leftButton.wasPressedThisFrame;
            }

            // 4. Aim Down Sights (Right Mouse Button or Gamepad Left Trigger)
            bool aimMouse = Mouse.current != null && Mouse.current.rightButton.isPressed;
            bool aimGamepad = Gamepad.current != null && Gamepad.current.leftTrigger.isPressed;
            AimHeld = aimMouse || aimGamepad;

            // 5. Reload (R key or Gamepad X / Button West)
            bool reloadKey = Keyboard.current != null && Keyboard.current.rKey.wasPressedThisFrame;
            bool reloadGamepad = Gamepad.current != null && Gamepad.current.buttonWest.wasPressedThisFrame;
            ReloadTriggered = reloadKey || reloadGamepad;
            if (ReloadTriggered)
            {
                OnReload?.Invoke();
            }

            // 6. Direct Slot Keys [1], [2], [3]
            if (Keyboard.current != null)
            {
                if (Keyboard.current.digit1Key.wasPressedThisFrame) OnQuickSelectSlot?.Invoke(0);
                if (Keyboard.current.digit2Key.wasPressedThisFrame) OnQuickSelectSlot?.Invoke(1);
                if (Keyboard.current.digit3Key.wasPressedThisFrame) OnQuickSelectSlot?.Invoke(2);

                // 7. Jump & Crouch Fallbacks
                if (jumpAction == null && Keyboard.current.spaceKey.wasPressedThisFrame)
                {
                    JumpTriggered = true;
                    OnJump?.Invoke();
                }
                if (crouchAction == null && (Keyboard.current.cKey.wasPressedThisFrame || Keyboard.current.leftCtrlKey.wasPressedThisFrame))
                {
                    CrouchTriggered = true;
                    OnCrouch?.Invoke();
                }
            }
        }

        private void LateUpdate()
        {
            // Clear single-frame flags
            JumpTriggered = false;
            CrouchTriggered = false;
            InteractTriggered = false;
        }

        private void HandleJump(InputAction.CallbackContext ctx)
        {
            JumpTriggered = true;
            OnJump?.Invoke();
        }

        private void HandleCrouch(InputAction.CallbackContext ctx)
        {
            CrouchTriggered = true;
            OnCrouch?.Invoke();
        }

        private void HandleInteract(InputAction.CallbackContext ctx)
        {
            InteractTriggered = true;
            OnInteract?.Invoke();
        }

        private void HandlePrev(InputAction.CallbackContext ctx)
        {
            OnPreviousWeapon?.Invoke();
        }

        private void HandleNext(InputAction.CallbackContext ctx)
        {
            OnNextWeapon?.Invoke();
        }

#if UNITY_EDITOR
        public void SetMoveInputForTesting(Vector2 move) => MoveInput = move;
        public void SetSprintingForTesting(bool sprinting) => IsSprinting = sprinting;
#endif
    }
}
