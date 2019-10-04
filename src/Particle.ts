import { GameInstance, Color, ParticleGenerator } from "./imports";
import { Size } from "./Size";
import { PARTICLE_TYPE } from "./PARTICLE_TYPE";
import { UTILS } from "./utils";
import { GameEngine } from "./engine";
export class Particle implements GameEngine.GameObject {    
    xv: number;
    yv: number;
    x: number;
    y: number;
    life: number; // Number of ticks until this particle dissapears
    startingLife: number;
    shape = new UTILS.CREATEJS.Shape();
    constructor(public config: Particle.IConfig) {
        this.xv = this.config.xv;
        this.yv = this.config.yv;
        this.x = this.config.x;
        this.y = this.config.y;
        this.life = this.config.life;
        this.startingLife = this.config.life;

        this.shape.graphics.beginFill(`rgb(${this.config.color.r}, ${this.config.color.g }, ${this.config.color.b})`)
        if (this.config.type === PARTICLE_TYPE.SQUARE) {
            this.shape.graphics.drawRect(0, 0, this.config.size.w, this.config.size.h);
        }
        else if (this.config.type === PARTICLE_TYPE.CIRCLE) {
            this.shape.graphics.drawCircle(0,0, this.config.size.r);
        }

        GameEngine.GameObject.register(this);
        GameInstance.stage.addChild(this.shape);
        
    }

    onTick(){
        if (this.life >= 1) {
            this.life--;       
            this.xv += this.config.xa;
            this.yv += this.config.ya;
            this.x += this.xv;
            this.y += this.yv;
            this.shape.alpha = this.life / this.startingLife;
            this.shape.x = this.x;
            this.shape.y = this.y;
        }else {
            GameEngine.GameObject.unregister(this);
        }
    }

    onDestroy(){
        GameInstance.stage.removeChild(this.shape);
        console.log('aaa');
    }
}


export namespace Particle{
    export interface IConfig {
        generator: ParticleGenerator,
        type: PARTICLE_TYPE, 
        size: Size, 
        color: Color, 
        x: number, 
        y: number, 
        xv: number, 
        yv: number, 
        
        xa: number, 
        ya: number, 
        life: number
    }
}