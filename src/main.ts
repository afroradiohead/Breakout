import { UTILS, Block, GameInstance, Paddle, Base } from "./imports";

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



class PreviousPosition {
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

export class Ball extends Base<any> {

    x: number;
    y: number;
    xv: number;
    yv: number;
    maxXv: number = 8;

    r: number;

    img: HTMLImageElement;
    img_slicing: HTMLImageElement;
    /** How many ticks are left in the green "slicing" powerup
        if > 0, the ball is rendered green and doesn't bounce when
        coming in contact with blocks */
    slices: number = 0;

    previousPositions: PreviousPosition[];
    numberOfPreviousPositions: number = 50;
    previousPositionIndex: number = 0;

    constructor() {
        super()
        this.reset();

        this.img = new Image();
        this.img.src = "res/ball.png";

        this.img_slicing = new Image();
        this.img_slicing.src = "res/ball_slicing.png";

        this.previousPositions = new Array<PreviousPosition>();

        this.listen<Block>("destroyed").subscribe(({instance: block}) => {
            if(block.powerUpName === Block.POWER_UPS.SLICE_BALL){
                this.slices = 100;
            }
        })
    }

    reset() {
        this.x = 360;
        this.y = 440;
        this.xv = 0;
        this.yv = 0;
        this.r = 10;
    }

    update(player: Paddle) {
        this.x += this.xv;
        this.y += this.yv;

        this.addPosition(new PreviousPosition(this.x, this.y, !(this.slices < 60 && this.slices % 20 < 10)));

        if (this.slices > 0) {
            this.slices--;
        }

        // check for colisions with player paddle
        if (this.x + this.r > player.x && this.x - this.r < player.x + player.width && this.y + this.r > player.y && this.y - this.r < player.y + player.height) {
            Sound.play(Sound.blip);
            this.yv = -this.yv;
            this.y = player.y - this.r;
            this.xv += ((this.x - player.x - player.width / 2) / 100) * 5;
            if (this.xv > this.maxXv) this.xv = this.maxXv;
            if (this.xv < -this.maxXv) this.xv = -this.maxXv;
            return;
        }

        // check for colisions with window edges
        if (this.x > GameInstance.SIZE.w - this.r) {
            Sound.play(Sound.bloop);
            GameInstance.level.camera.shake(this.xv * 2, 0);
            this.xv = -this.xv;
            this.x = GameInstance.SIZE.w - this.r;
        }
        if (this.x < this.r) {
            Sound.play(Sound.bloop);
            GameInstance.level.camera.shake(this.xv * 2, 0);
            this.xv = -this.xv;
            this.x = this.r;
        }
        if (this.y < this.r) {
            Sound.play(Sound.bloop);
            GameInstance.level.camera.shake(0, this.yv * 2);
            this.yv = -this.yv;
            this.y = this.r;
        }
        if (this.y > GameInstance.SIZE.h) {
            if (GameInstance.level.balls.length > 1) {
                GameInstance.level.balls.splice(GameInstance.level.balls.indexOf(this), 1);
                return;
            }
            Sound.play(Sound.die);
            GameInstance.level.die();
            return;
        }

        // check for collisions with blocks
        var c = this.collides();
        if (c !== -1) {
            Sound.play(Sound.bloop);
            if (this.slices > 0) {
                return;
            }

            if (this.x > GameInstance.level.blocks[c].x + Block.width) {
                GameInstance.level.camera.shake(this.xv, 0);
                this.xv = Math.abs(this.xv);
            }
            if (this.x < GameInstance.level.blocks[c].x) {
                GameInstance.level.camera.shake(this.xv, 0);
                this.xv = -Math.abs(this.xv);
            }
            if (this.y > GameInstance.level.blocks[c].y + Block.height) {
                GameInstance.level.camera.shake(0, this.yv);
                this.yv = Math.abs(this.yv);
            }
            if (this.y < GameInstance.level.blocks[c].y) {
                GameInstance.level.camera.shake(0, this.yv);
                this.yv = -Math.abs(this.yv);
            }
        }
    }

    addPosition(pos: PreviousPosition) {
        if (this.previousPositions.length === this.numberOfPreviousPositions) {
            if (this.previousPositions[this.previousPositionIndex] === pos) {
                // Don't add the same position twice
                return;
            }
            this.previousPositions[this.previousPositionIndex++] = pos;
            this.previousPositionIndex %= this.numberOfPreviousPositions;
        } else {
            if (this.previousPositions.length > 0 && this.previousPositions[this.previousPositions.length - 1].equals(pos)) {
                // Don't add the same position twice
                return;
            }
            this.previousPositions.push(pos);
        }
    }

    collides(): number {
        for (var i in GameInstance.level.blocks) {
            var b = GameInstance.level.blocks[i];
            if (b.color === 0) continue;
            if (this.x + this.r > b.x && this.x - this.r < b.x + Block.width && this.y + this.r > b.y && this.y - this.r < b.y + Block.height) {
                GameInstance.level.blocks[i].destroy(this);
                return parseInt(i);
            }
        }
        return -1;
    }

    shoot() { // shoot off the player's paddle
        GameInstance.level.ballstill = false;
        this.yv = -7;
        do {
            this.xv = Math.floor(Math.random() * 10) - 5;
        } while (this.xv >= -1 && this.xv <= 1);
    }

    render() {
        // Render ball trail
        for (var i = this.previousPositionIndex - 1; i > this.previousPositionIndex - this.previousPositions.length; i--) {
            var value = i + (this.previousPositions.length - this.previousPositionIndex) + 1;
            GameInstance.context.globalAlpha = (value / this.previousPositions.length) / 4;
            var index = i;
            if (index < 0) {
                index += this.previousPositions.length;
            }
            var pos = this.previousPositions[index];
            var x = pos.x - this.r + GameInstance.level.camera.xo;
            var y = pos.y - this.r + GameInstance.level.camera.yo;

            if (this.previousPositions[index].green) {
                GameInstance.context.drawImage(this.img_slicing, x, y);
            } else {
                GameInstance.context.drawImage(this.img, x, y);
            }
        }
        GameInstance.context.globalAlpha = 1.0;

        var x = this.x - this.r + GameInstance.level.camera.xo;
        var y = this.y - this.r + GameInstance.level.camera.yo;
        if (this.slices < 60 && this.slices % 20 < 10) { // blinking effect when slicing effect is about to wear off
            GameInstance.context.drawImage(this.img, x, y);
        } else {
            GameInstance.context.drawImage(this.img_slicing, x, y);
        }
    }
}

export class Mouse {

    static x: number = 0;
    static y: number = 0;
    static ldown: boolean = false;
    static rdown: boolean = false;

    static update(event: MouseEvent) {
        var px = Mouse.x,
            py = Mouse.y;
        Mouse.x = event.clientX - GameInstance.canvasClientRect.left;
        Mouse.y = event.clientY - GameInstance.canvasClientRect.top;

        if (GameInstance.level && !GameInstance.level.player.usingMouseInput && !GameInstance.paused && (Mouse.x != px || Mouse.y != py)) {
            GameInstance.level.player.usingMouseInput = true;
        }
    }

    static down(event: MouseEvent) {
        if (event.button === 1 || event.which === 1) Mouse.ldown = true;
        else if (event.button === 3 || event.which === 3) Mouse.rdown = true;
    }

    static up(event: MouseEvent) {
        if (event.button === 1 || event.which === 1) Mouse.ldown = false;
        else if (event.button === 3 || event.which === 3) Mouse.rdown = false;
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

export class ParticleGenerator {
    particles: Particle[];

    constructor(x: number, y: number, color: Color) {
        this.particles = new Array<Particle>();

        var size = new Size();
        size.w = size.h = 6;

        for (var i = 0; i < 25; ++i) {
            this.particles.push(new Particle(this, PARTICLE_TYPE.SQUARE, size, color, x, y, Math.random() * 10 - 5, Math.random() * 10 - 5, 0, 0.5, 45));
        }
    }

    remove(particle: Particle) {
        this.particles.splice(this.particles.indexOf(particle));
    }

    update() {
        for (var p in this.particles) {
            this.particles[p].update();
        }
    }

    render() {
        for (var p in this.particles) {
            this.particles[p].render();
        }
    }
}

enum PARTICLE_TYPE {
    CIRCLE, SQUARE
}

class Size {
    w: number;
    h: number;
    r: number;
}

export class Color {
    r: number;
    g: number;
    b: number;

    constructor(r?: number, g?: number, b?: number) {
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
    }

    static convert(c: number): Color {
        switch(c) {
            case 1:
                return new Color(158, 158, 158);
            case 2:
                return new Color(172, 0, 0);
            case 3:
                return new Color(172, 105, 0);
            case 4:
                return new Color(182, 176, 0);
            case 5:
                return new Color(52, 172, 0);
            case 6:
                return new Color(0, 172, 170);
            case 7:
                return new Color(0, 103, 182);
            case 8:
                return new Color(68, 0, 172);
            case 9:
                return new Color(180, 0, 182);
            default:
                return new Color(0, 0, 0);
        }
    }
}

class Particle {

    generator: ParticleGenerator;
    type: PARTICLE_TYPE;
    xa: number;
    ya: number;
    xv: number;
    yv: number;
    x: number;
    y: number;
    size: Size;
    life: number; // Number of ticks until this particle dissapears
    startingLife: number;
    color: Color;

    constructor(generator: ParticleGenerator, type: PARTICLE_TYPE, size: Size, color: Color, x: number, y: number, xv: number, yv: number, xa: number, ya: number, life: number) {
        this.generator = generator;
        this.type = type;
        this.size = size;
        this.color = color;
        this.x = x;
        this.y = y;
        this.xv = xv;
        this.yv = yv;
        this.xa = xa;
        this.ya = ya;
        this.life = life;
        this.startingLife = life;
    }

    update() {
        this.life--;
        if (this.life < 0) {
            this.generator.remove(this);
            return;
        }

        this.xv += this.xa;
        this.yv += this.ya;

        this.x += this.xv;
        this.y += this.yv;
    }

    render() {
        var x = this.x + GameInstance.level.camera.xo;
        var y = this.y + GameInstance.level.camera.yo;
        GameInstance.context.fillStyle = "rgba(" + this.color.r + ", " + this.color.g + ", " + this.color.b + ", " + (this.life / this.startingLife) + ")";
        if (this.type === PARTICLE_TYPE.SQUARE) {
            GameInstance.context.fillRect(x, y, this.size.w, this.size.h);
        } else if (this.type === PARTICLE_TYPE.CIRCLE) {
            GameInstance.context.arc(x, y, this.size.r, 0, 0);
        }
    }
}


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

window.onblur = function() {
    GameInstance.paused = true;
}

// window.onfocus = function() {
//     Game.paused = false;
// }

window.onresize = function() {
    GameInstance.canvasClientRect = GameInstance.canvas.getBoundingClientRect();
}

window.onload = function() {
    Sound.init();
    GameInstance.init();
};
