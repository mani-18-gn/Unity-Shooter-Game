// ROADBOUND - Unified Input Manager (Keyboard, Mouse, Gamepad)
export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.prevKeys = {};
    this.mouse = {
      x: 0,
      y: 0,
      deltaX: 0,
      deltaY: 0,
      leftDown: false,
      rightDown: false,
      leftClicked: false,
      rightClicked: false,
      middleClicked: false,
      wheelDelta: 0
    };
    this.isPointerLocked = false;
    this.gamepadIndex = null;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onGamepadConnected = this.onGamepadConnected.bind(this);
    this.onGamepadDisconnected = this.onGamepadDisconnected.bind(this);

    this.init();
  }

  init() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('wheel', this.onWheel, { passive: true });
    window.addEventListener('contextmenu', this.onContextMenu);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);

    // Canvas focus and click-to-lock
    if (this.canvas) {
      this.canvas.setAttribute('tabindex', '0');
      this.canvas.addEventListener('click', () => {
        if (window.gameInstance && window.gameInstance.isPlaying && !this.isPointerLocked) {
          this.requestPointerLock();
        }
      });
    }

    // Virtual D-pad / Touch Movement
    this.virtualInput = { moveX: 0, moveZ: 0, sprint: false };
    window.addEventListener('roadbound_virtual_move', (e) => {
      if (e.detail) {
        if (typeof e.detail.moveX === 'number') this.virtualInput.moveX = e.detail.moveX;
        if (typeof e.detail.moveZ === 'number') this.virtualInput.moveZ = e.detail.moveZ;
        if (typeof e.detail.sprint === 'boolean') this.virtualInput.sprint = e.detail.sprint;
      }
    });
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
  }

  requestPointerLock() {
    if (this.canvas && !this.isPointerLocked) {
      try {
        const p = this.canvas.requestPointerLock();
        if (p && p.catch) p.catch(() => {});
      } catch (e) {
        // Ignored
      }
    }
  }

  exitPointerLock() {
    if (document.exitPointerLock && this.isPointerLocked) {
      document.exitPointerLock();
    }
  }

  onPointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  }

  onKeyDown(e) {
    const code = e.code;
    if (code) this.keys[code] = true;
    if (e.key) {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.key.toUpperCase()] = true;
      this.keys[e.key] = true;
    }

    // Hotkey [T] to toggle Day Mode / Night Mode
    if (code === 'KeyT' || e.key === 't' || e.key === 'T') {
      window.dispatchEvent(new CustomEvent('roadbound_toggle_time'));
    }

    // Hotkey [F] as alias for [E] (Enter / Exit vehicle)
    if (code === 'KeyF' || e.key === 'f' || e.key === 'F') {
      this.keys['KeyE'] = true;
      this.keys['e'] = true;
    }

    // Prevent default browser actions for game keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(code)) {
      if (document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
      }
    }
  }

  onKeyUp(e) {
    const code = e.code;
    if (code) this.keys[code] = false;
    if (e.key) {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.key.toUpperCase()] = false;
      this.keys[e.key] = false;
    }
    if (code === 'KeyF' || e.key === 'f' || e.key === 'F') {
      this.keys['KeyE'] = false;
      this.keys['e'] = false;
    }
  }

  onMouseMove(e) {
    if (this.isPointerLocked) {
      this.mouse.deltaX += e.movementX;
      this.mouse.deltaY += e.movementY;
    } else {
      // Hold LEFT mouse button and move mouse = smooth character & camera orbit turn
      if (this.prevClientX !== undefined && this.prevClientY !== undefined) {
        const dx = e.clientX - this.prevClientX;
        const dy = e.clientY - this.prevClientY;
        if (this.mouse.leftDown || (window.gameInstance && window.gameInstance.isPlaying)) {
          this.mouse.deltaX += dx;
          this.mouse.deltaY += dy;
        }
      }
    }
    this.prevClientX = e.clientX;
    this.prevClientY = e.clientY;
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  onMouseDown(e) {
    if (e.button === 0) {
      this.mouse.leftDown = true;
      this.mouse.leftClicked = true;
    } else if (e.button === 1) {
      this.mouse.middleClicked = true;
    } else if (e.button === 2) {
      this.mouse.rightDown = true;
      this.mouse.rightClicked = true;
    }
  }

  onMouseUp(e) {
    if (e.button === 0) {
      this.mouse.leftDown = false;
    } else if (e.button === 2) {
      this.mouse.rightDown = false;
    }
  }

  onWheel(e) {
    this.mouse.wheelDelta = e.deltaY;
  }

  onContextMenu(e) {
    // Disable right click context menu in game canvas so Right Mouse shoots cleanly
    if (this.isPointerLocked || e.target === this.canvas) {
      e.preventDefault();
    }
  }

  onGamepadConnected(e) {
    this.gamepadIndex = e.gamepad.index;
    console.log('[ROADBOUND Input] Gamepad connected:', e.gamepad.id);
  }

  onGamepadDisconnected(e) {
    if (this.gamepadIndex === e.gamepad.index) {
      this.gamepadIndex = null;
    }
  }

  pollGamepad() {
    if (this.gamepadIndex === null) return null;
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    return gamepads[this.gamepadIndex] || null;
  }

  isDown(code) {
    if (this.keys[code]) return true;
    const lower = code.toLowerCase();
    if (this.keys[lower]) return true;
    if (code.startsWith('Key')) {
      const char = code.slice(3).toLowerCase();
      if (this.keys[char]) return true;
    }
    return false;
  }

  isJustPressed(code) {
    const isNow = this.isDown(code);
    const wasBefore = !!this.prevKeys[code] || !!this.prevKeys[code.toLowerCase()] || (code.startsWith('Key') && !!this.prevKeys[code.slice(3).toLowerCase()]);
    return isNow && !wasBefore;
  }

  // High-level movement input: returns { x: horizontal, z: forward, sprint, jump, handbrake, etc. }
  getMovementInput() {
    let moveX = 0;
    let moveZ = 0;
    let throttle = 0;
    let steer = 0;
    let brake = 0;

    // Keyboard bindings (WASD & Arrow keys & aliases)
    if (this.isDown('KeyW') || this.isDown('w') || this.isDown('ArrowUp')) { moveZ += 1; throttle += 1; }
    if (this.isDown('KeyS') || this.isDown('s') || this.isDown('ArrowDown')) { moveZ -= 1; throttle -= 1; brake += 1; }
    if (this.isDown('KeyA') || this.isDown('a') || this.isDown('ArrowLeft')) { moveX -= 1; steer -= 1; }
    if (this.isDown('KeyD') || this.isDown('d') || this.isDown('ArrowRight')) { moveX += 1; steer += 1; }

    // Virtual D-pad
    if (this.virtualInput) {
      if (this.virtualInput.moveZ) {
        moveZ += this.virtualInput.moveZ;
        throttle += this.virtualInput.moveZ;
      }
      if (this.virtualInput.moveX) {
        moveX += this.virtualInput.moveX;
        steer += this.virtualInput.moveX;
      }
    }

    // RUNNING IS ALWAYS ON with UNLIMITED stamina (user requirement)
    const sprint = true;
    const crouch = this.isDown('KeyC') || this.isDown('c');
    const jump = this.isDown('Space') || this.isDown(' ');
    const handbrake = this.isDown('Space') || this.isDown(' ');
    const interact = this.isJustPressed('KeyE') || this.isJustPressed('e') || this.isJustPressed('KeyF') || this.isJustPressed('f');
    const pickup = this.isJustPressed('KeyF') || this.isJustPressed('f');
    const reload = this.isJustPressed('KeyR') || this.isJustPressed('r');
    const heal = this.isJustPressed('KeyH') || this.isJustPressed('h');
    const grenade = this.isJustPressed('KeyG') || this.isJustPressed('g');
    const scopeToggle = this.isJustPressed('KeyZ') || this.isJustPressed('z') || this.mouse.middleClicked;
    const headlights = this.isJustPressed('KeyL') || this.isJustPressed('l');
    const horn = this.isDown('KeyH') || this.isDown('h');
    const cameraToggle = this.isJustPressed('KeyV') || this.isJustPressed('v');
    const mapToggle = this.isJustPressed('KeyM') || this.isJustPressed('m');
    const pauseToggle = this.isJustPressed('Tab') || this.isJustPressed('Escape');

    // Slot switching keys 1-5
    const slot1 = this.isJustPressed('Digit1') || this.isJustPressed('1');
    const slot2 = this.isJustPressed('Digit2') || this.isJustPressed('2');
    const slot3 = this.isJustPressed('Digit3') || this.isJustPressed('3');
    const slot4 = this.isJustPressed('Digit4') || this.isJustPressed('4');
    const slot5 = this.isJustPressed('Digit5') || this.isJustPressed('5');

    // Gamepad support
    const gp = this.pollGamepad();
    if (gp) {
      const leftStickX = Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0;
      const leftStickY = Math.abs(gp.axes[1]) > 0.15 ? -gp.axes[1] : 0;
      if (leftStickX !== 0) { moveX = leftStickX; steer = leftStickX; }
      if (leftStickY !== 0) { moveZ = leftStickY; }

      // Triggers (RT: gas / shoot, LT: brake / aim)
      const rt = gp.buttons[7] ? gp.buttons[7].value : 0;
      const lt = gp.buttons[6] ? gp.buttons[6].value : 0;
      if (rt > 0.1) throttle = rt;
      if (lt > 0.1) { throttle = -lt; brake = lt; }
    }

    return {
      moveX,
      moveZ,
      throttle,
      steer,
      brake,
      sprint,
      crouch,
      jump,
      handbrake,
      interact,
      pickup,
      reload,
      heal,
      grenade,
      scopeToggle,
      slot1,
      slot2,
      slot3,
      slot4,
      slot5,
      headlights,
      horn,
      cameraToggle,
      mapToggle,
      pauseToggle,
      aim: this.mouse.rightDown,
      fire: this.mouse.rightDown || this.mouse.leftDown || (this.keys['KeyJ'] || false), // Left or Right Mouse or [J] to shoot
      fireClicked: this.mouse.rightClicked || this.mouse.leftClicked || (this.isJustPressed('KeyJ') || false),
      leftDrag: this.mouse.leftDown,
      wheelDelta: this.mouse.wheelDelta || 0
    };
  }

  update() {
    // Copy current keys to previous keys for edge detection
    this.prevKeys = { ...this.keys };
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    this.mouse.leftClicked = false;
    this.mouse.rightClicked = false;
    this.mouse.middleClicked = false;
    this.mouse.wheelDelta = 0;
  }
}
