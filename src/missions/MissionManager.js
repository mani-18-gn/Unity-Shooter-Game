// ROADBOUND - Campaign Mission Manager & Objective Progression Engine
import * as THREE from 'three';
import { MISSIONS_DATA } from './MissionsData.js';

export class MissionManager {
  constructor(gameState, hud, saveSystem) {
    this.gameState = gameState;
    this.hud = hud;
    this.saveSystem = saveSystem;

    this.missions = MISSIONS_DATA;
    this.activeMissionData = this.missions[0];
    this.currentStepIdx = 0;
    this.isCompleted = false;

    this.syncWithState();
  }

  syncWithState() {
    const savedId = this.gameState.activeMission.id;
    const found = this.missions.find(m => m.id === savedId);
    if (found) {
      this.activeMissionData = found;
      this.currentStepIdx = this.gameState.activeMission.step || 0;
    }
  }

  startMission(missionId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return;

    this.activeMissionData = mission;
    this.currentStepIdx = 0;
    this.isCompleted = false;

    this.gameState.activeMission.id = mission.id;
    this.gameState.activeMission.step = 0;
    this.gameState.activeMission.name = mission.name;

    const step = mission.steps[0];
    this.gameState.activeMission.objective = step.text;
    this.gameState.activeMission.targetLocation = step.target;

    this.hud.showCommsDialogue(step.dialogue.speaker, step.dialogue.text);
    this.gameState.notify('mission_updated', this.activeMissionData);
  }

  update(delta, playerPos, isPlayerInVehicle) {
    if (this.isCompleted || !this.activeMissionData) return;

    const currentStep = this.activeMissionData.steps[this.currentStepIdx];
    if (!currentStep || !playerPos) return;

    const targetPos = new THREE.Vector3(currentStep.target.x, currentStep.target.y, currentStep.target.z);
    const dist = playerPos.distanceTo(targetPos);

    this.hud.updateMissionDistance(Math.round(dist));

    // Check step completion criteria
    if (dist < (currentStep.radius || 15)) {
      if (currentStep.requireInVehicle && !isPlayerInVehicle) {
        // Player must enter car to complete step
        return;
      }

      // Trigger wanted rating if step calls for police attention
      if (currentStep.triggerWanted) {
        this.gameState.setWantedLevel(currentStep.triggerWanted);
      }

      this.advanceStep();
    }
  }

  advanceStep() {
    this.currentStepIdx++;

    if (this.currentStepIdx < this.activeMissionData.steps.length) {
      const nextStep = this.activeMissionData.steps[this.currentStepIdx];
      this.gameState.activeMission.step = this.currentStepIdx;
      this.gameState.activeMission.objective = nextStep.text;
      this.gameState.activeMission.targetLocation = nextStep.target;

      if (nextStep.dialogue) {
        this.hud.showCommsDialogue(nextStep.dialogue.speaker, nextStep.dialogue.text);
      }

      this.gameState.notify('mission_updated', this.activeMissionData);
    } else {
      // Completed full mission!
      this.completeMission();
    }
  }

  completeMission() {
    this.isCompleted = true;
    const rewardCash = this.activeMissionData.rewardCash;
    const rewardXp = this.activeMissionData.rewardXp;

    this.gameState.addCash(rewardCash);
    this.gameState.player.repXp += rewardXp;
    this.gameState.setWantedLevel(0); // Clear heat upon mission contract delivery

    this.hud.showCommsDialogue(
      'MISSION CONTRACT COMPLETED',
      `Payout: +$${rewardCash.toLocaleString()} &bull; Rep Gain: +${rewardXp} XP`
    );

    // Auto-save checkpoint!
    this.saveSystem.saveGame(1);
    this.gameState.notify('mission_completed', this.activeMissionData);

    // Automatically queue next campaign mission if available
    const nextIdx = this.missions.findIndex(m => m.id === this.activeMissionData.id) + 1;
    if (nextIdx < this.missions.length) {
      setTimeout(() => {
        this.startMission(this.missions[nextIdx].id);
      }, 5000);
    }
  }
}
