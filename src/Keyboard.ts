import { GameInstance } from './Game';
export class Keyboard {
    static KEYS = {
        BACKSPACE: 8, TAB: 9, RETURN: 13, ESC: 27, SPACE: 32, PAGEUP: 33, PAGEDOWN: 34, END: 35, HOME: 36, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, INSERT: 45, DELETE: 46, ZERO: 48, ONE: 49, TWO: 50, THREE: 51, FOUR: 52, FIVE: 53, SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57, A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90, TILDE: 192, SHIFT: 999
    };

    static keysdown = [];

    static keychange(event: KeyboardEvent, down: boolean): void {
        var keycode = event.keyCode ? event.keyCode : event.which;
        Keyboard.keysdown[keycode] = down;

        if (down && keycode === Keyboard.KEYS.ESC) {
            GameInstance.togglePause();
            if (GameInstance.level.ballstill) GameInstance.paused = false;
        }

        if (keycode === Keyboard.KEYS.A || keycode === Keyboard.KEYS.D || keycode === Keyboard.KEYS.LEFT || keycode === Keyboard.KEYS.RIGHT) {
            GameInstance.paused = false;
            GameInstance.level.player.usingMouseInput = false;

        }
        if (keycode === Keyboard.KEYS.SPACE) {
            if (GameInstance.level.ballstill) {
                GameInstance.level.balls[0].shoot();
            }
        }
    }
}