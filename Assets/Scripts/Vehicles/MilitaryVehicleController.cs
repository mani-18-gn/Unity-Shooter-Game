using UnityEngine;
using Roadbound.Player;

namespace Roadbound.Vehicles
{
    [RequireComponent(typeof(Rigidbody))]
    public class MilitaryVehicleController : MonoBehaviour
    {
        [System.Serializable]
        public struct WheelData
        {
            public WheelCollider collider;
            public Transform visualMesh;
            public bool isMotor;
            public bool isSteer;
        }

        [Header("Vehicle Specifications")]
        [SerializeField] private float motorForce = 1600f;
        [SerializeField] private float brakeForce = 3500f;
        [SerializeField] private float maxSteerAngle = 32f;
        [SerializeField] private Vector3 centerOfMassOffset = new Vector3(0f, -0.4f, 0f);

        [Header("Wheel Configuration")]
        [SerializeField] private WheelData frontLeft;
        [SerializeField] private WheelData frontRight;
        [SerializeField] private WheelData rearLeft;
        [SerializeField] private WheelData rearRight;

        [Header("Interaction & Driver Sockets")]
        [SerializeField] private Transform driverSeat;
        [SerializeField] private Transform exitPoint;
        [SerializeField] private float interactionRadius = 3.5f;

        [Header("Audio")]
        [SerializeField] private AudioSource engineAudio;

        // Runtime State
        private Rigidbody rb;
        private bool isPlayerDriving = false;
        private PlayerController activePlayer;
        private PlayerCameraController cameraController;

        public bool IsDriving => isPlayerDriving;
        public float SpeedKmh => rb != null ? rb.linearVelocity.magnitude * 3.6f : 0f;

        private void Awake()
        {
            rb = GetComponent<Rigidbody>();
            rb.mass = 1800f;
            rb.centerOfMass += centerOfMassOffset;

            if (engineAudio != null)
            {
                engineAudio.loop = true;
                engineAudio.playOnAwake = false;
            }
        }

        private void Update()
        {
            CheckPlayerProximityAndInteraction();
            UpdateWheelVisuals();
            UpdateEngineAudio();
        }

        private void FixedUpdate()
        {
            if (!isPlayerDriving)
            {
                // Apply slight parking brake when unoccupied
                ApplyBraking(100f);
                return;
            }

            float v = Input.GetAxis("Vertical");
            float h = Input.GetAxis("Horizontal");
            bool isBraking = Input.GetKey(KeyCode.Space);

            ApplyMotor(v);
            ApplySteering(h);
            ApplyBraking(isBraking ? brakeForce : 0f);
        }

        private void ApplyMotor(float input)
        {
            float torque = input * motorForce;
            if (rearLeft.collider != null) rearLeft.collider.motorTorque = torque;
            if (rearRight.collider != null) rearRight.collider.motorTorque = torque;
            if (frontLeft.collider != null && frontLeft.isMotor) frontLeft.collider.motorTorque = torque;
            if (frontRight.collider != null && frontRight.isMotor) frontRight.collider.motorTorque = torque;
        }

        private void ApplySteering(float input)
        {
            // Speed-sensitive steering reduction
            float speedFactor = Mathf.Clamp01(SpeedKmh / 90f);
            float steer = input * Mathf.Lerp(maxSteerAngle, maxSteerAngle * 0.45f, speedFactor);

            if (frontLeft.collider != null) frontLeft.collider.steerAngle = steer;
            if (frontRight.collider != null) frontRight.collider.steerAngle = steer;
        }

        private void ApplyBraking(float force)
        {
            if (frontLeft.collider != null) frontLeft.collider.brakeTorque = force;
            if (frontRight.collider != null) frontRight.collider.brakeTorque = force;
            if (rearLeft.collider != null) rearLeft.collider.brakeTorque = force;
            if (rearRight.collider != null) rearRight.collider.brakeTorque = force;
        }

        private void UpdateWheelVisuals()
        {
            UpdateSingleWheel(frontLeft);
            UpdateSingleWheel(frontRight);
            UpdateSingleWheel(rearLeft);
            UpdateSingleWheel(rearRight);
        }

        private void UpdateSingleWheel(WheelData wheel)
        {
            if (wheel.collider == null || wheel.visualMesh == null) return;
            wheel.collider.GetWorldPose(out Vector3 pos, out Quaternion rot);
            wheel.visualMesh.position = pos;
            wheel.visualMesh.rotation = rot;
        }

        private void UpdateEngineAudio()
        {
            if (engineAudio == null) return;
            if (isPlayerDriving)
            {
                if (!engineAudio.isPlaying) engineAudio.Play();
                engineAudio.pitch = Mathf.Lerp(0.8f, 1.8f, Mathf.Clamp01(SpeedKmh / 100f));
            }
            else if (engineAudio.isPlaying)
            {
                engineAudio.Stop();
            }
        }

        private void CheckPlayerProximityAndInteraction()
        {
            if (isPlayerDriving)
            {
                if (Input.GetKeyDown(KeyCode.E))
                {
                    ExitVehicle();
                }
                return;
            }

            if (activePlayer == null)
            {
                activePlayer = FindFirstObjectByType<PlayerController>();
            }

            if (activePlayer != null)
            {
                float dist = Vector3.Distance(transform.position, activePlayer.transform.position);
                if (dist <= interactionRadius && Input.GetKeyDown(KeyCode.E))
                {
                    EnterVehicle(activePlayer);
                }
            }
        }

        public void EnterVehicle(PlayerController player)
        {
            activePlayer = player;
            isPlayerDriving = true;

            // Hide and disable player controller
            var cc = activePlayer.GetComponent<CharacterController>();
            if (cc != null) cc.enabled = false;
            activePlayer.transform.SetParent(driverSeat != null ? driverSeat : transform, false);
            activePlayer.gameObject.SetActive(false);

            // Redirect camera to vehicle
            cameraController = FindFirstObjectByType<PlayerCameraController>();
            if (cameraController != null)
            {
                cameraController.SetTarget(transform);
            }

            Debug.Log("[MilitaryVehicleController] Player entered vehicle.");
        }

        public void ExitVehicle()
        {
            if (activePlayer == null) return;

            isPlayerDriving = false;

            // Position player at exit point
            Vector3 exitPos = exitPoint != null ? exitPoint.position : transform.position + transform.right * -2.2f + Vector3.up * 0.5f;
            activePlayer.transform.SetParent(null);
            activePlayer.transform.position = exitPos;
            activePlayer.gameObject.SetActive(true);

            var cc = activePlayer.GetComponent<CharacterController>();
            if (cc != null) cc.enabled = true;

            // Restore camera target to player
            if (cameraController != null)
            {
                cameraController.SetTarget(activePlayer.transform);
            }

            Debug.Log("[MilitaryVehicleController] Player exited vehicle.");
        }

        public void AutoSetupCollidersIfMissing()
        {
            // Utility for scene builders
            rb = GetComponent<Rigidbody>();
            if (rb == null) rb = gameObject.AddComponent<Rigidbody>();
            rb.mass = 1800f;
            rb.centerOfMass = centerOfMassOffset;
        }
    }
}
