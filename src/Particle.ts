import { GameInstance, Color, ParticleGenerator } from "./imports";
import { Size } from "./Size";
import { PARTICLE_TYPE } from "./PARTICLE_TYPE";
export class Particle {
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
    constructor(public generator: ParticleGenerator, type: PARTICLE_TYPE, size: Size, color: Color, x: number, y: number, xv: number, yv: number, xa: number, ya: number, life: number) {
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
        }
        else if (this.type === PARTICLE_TYPE.CIRCLE) {
            GameInstance.context.arc(x, y, this.size.r, 0, 0);
        }
    }
}
