import { UTILS, Mouse, GameInstance, Keyboard } from "./imports";

/*
    Feature list:
        -[x] Keyboard input
        -[x] Pause overlay
        -[x] Particles
        -[x] Screenshake
        -[x] Animate hearts
        -[x] Ball trail
        -[x] Drop tiles down from top smoothly
        -[x] Use variables for fonts
        -[x] Reimplement different starting colour layouts
        -[ ] Render ball tails even after ball deaths
        -[ ] Incremental sounds (to reward combos)
*/



export class PreviousPosition {
    x: number;
    y: number;
    green: boolean;

    constructor(x: number, y: number, green?: boolean) {
        this.x = x;
        this.y = y;
        this.green = green || false;
    }

    equals(pos: PreviousPosition): boolean {
        return (this.x === pos.x && this.y === pos.y && this.green === pos.green);
    }
}

window['Mouse'] = Mouse;

export class Sound {

    static blip;
    static bloop;
    static die;
    static boom;
    static life;

    static muted = false;
    static volume = 0.5;
    static volumeSlider;

    static init() {
        Sound.blip = <HTMLAudioElement>UTILS.getHtmlElementById('blipSound');
        Sound.bloop = <HTMLAudioElement>UTILS.getHtmlElementById('bloopSound');
        Sound.die = <HTMLAudioElement>UTILS.getHtmlElementById('dieSound');
        Sound.boom = <HTMLAudioElement>UTILS.getHtmlElementById('boomSound');
        Sound.life = <HTMLAudioElement>UTILS.getHtmlElementById('lifeSound');

        Sound.volumeSlider = <HTMLInputElement>UTILS.getHtmlElementById('volumeSlider');
        Sound.changeVolume();
    }

    static changeVolume() {
        Sound.volume = Number(Sound.volumeSlider.value) / 100;
    }

    static toggleMute(): void {
        Sound.muted = !Sound.muted;
    }

    static play(sound: HTMLAudioElement): void {
        if (Sound.muted) return;
        sound.volume = Sound.volume;
        sound.currentTime = 0;
        sound.play();
    }
}



function keydown(event: KeyboardEvent) {
    Keyboard.keychange(event, true);

    // Prevent the page from scrolling down on space press
    if (event.keyCode === Keyboard.KEYS.SPACE) return false;
}

function keyup(event: KeyboardEvent) {
    Keyboard.keychange(event, false);
}

window.onkeydown = keydown;
window.onkeyup = keyup;

function toggleFooter(which: string) {
    var front = '1',
        back = '0',
        about = UTILS.getHtmlElementById('aboutFooter');

    if (which === 'about') {
        if (about.className === 'short') {
            about.style.zIndex = front;
            about.className = 'long';
        } else {
            about.className = 'short';
        }
    }
}

window['Mouse'] = Mouse;

window.onblur = function() {
    GameInstance.paused = true;
}

window.onresize = function() {
    GameInstance.canvasClientRect = GameInstance.canvas.getBoundingClientRect();
}

window.onload = function() {
    Sound.init();
    GameInstance.init();
};
