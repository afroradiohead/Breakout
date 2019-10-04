import { GameInstance } from './Game';
import { Sound } from './main';
import {UTILS, Game, Ball, Color, ParticleGenerator} from "./imports"
import {Base } from "./Base";
import { GameEngine } from './engine';

function generateImageSrc(type: "powerups" | "blocks", name: string): HTMLImageElement{
	return UTILS.generateImageElement({src: `res/${type}/${name}.png`})
}





export class Block extends Base<any>
	implements GameEngine.GameObject, GameEngine.Collider.IRectangle, GameEngine.Event.IObject<"destroyed">{
	collider = {
        x: 0,
        y: 0,
        height: 20,
        width: 0
    }
	get game(): Game{
		return this.config.game;
	}
	
	public get color(): any {
		return this.config.color;
	}

	shape = new UTILS.CREATEJS.Shape()
	destroyingBall: Ball;
	powerUpName: Block.POWER_UPS = Block.POWER_UPS.NONE;


    constructor(public config: Block.IConfig) {
		super();
		this.game.stage.addChild(this.shape);
		const randomPowerUpSeed = Math.floor(Math.random() * 24);
		const powerUpCount = Object.keys(Block.POWER_UPS).length;
		this.collider.x = config.x;
		this.collider.y = config.y;
		this.collider.width = config.width;

		if(randomPowerUpSeed < powerUpCount - 1){
			this.powerUpName = Block.POWER_UPS[UTILS.LODASH.sample(Object.keys(Block.POWER_UPS))];
		}
		this.shape.graphics.beginFill(`rgb(${this.config.color.r}, ${this.config.color.g}, ${this.config.color.b})`);
		const powerUpConfig = Block.POWER_UP_CONFIG_BY_NAME[this.powerUpName];
        if (powerUpConfig) {
			this.shape.graphics.beginBitmapFill(powerUpConfig.image);
		}
		this.shape.graphics.drawRect(0,0, this.collider.width, this.collider.height);
		
		GameEngine.GameObject.register(this);
	}
	
	onTick(){
		this.collider.x = this.config.x + GameInstance.level.camera.xo;
		this.collider.y = this.config.y + GameInstance.level.camera.yo;
		this.shape.x = this.collider.x;
		this.shape.y = this.collider.y;
	}

    destroy(ball: Ball) {
		this.destroyingBall = ball;
		this.game.level.particleGenerators.push(new ParticleGenerator(this.collider.x, this.collider.y, this.color));

		GameEngine.Event.emit(this, "destroyed");
		Sound.play(Sound.bloop);
		this.game.stage.removeChild(this.shape);
		this.powerUpName = Block.POWER_UPS.NONE;
	}
}

export namespace Block {
	export enum POWER_UPS {
		NONE = "NONE",
		BOMB = "BOMB",
		BIGGER_PADDLE = "BIGGER_PADDLE",
		SLICE_BALL = "SLICE_BALL",
		EXTRA_BALL = "EXTRA_BALL",
		EXTRA_LIFE = "EXTRA_LIFE"
	}

	export const POWER_UP_CONFIG_BY_NAME = {
		[Block.POWER_UPS.BOMB]: {
			image: generateImageSrc("powerups", "bomb")
		},
		[Block.POWER_UPS.BIGGER_PADDLE]: {
			image: generateImageSrc("powerups", "longer_paddle"),
		},
		[Block.POWER_UPS.SLICE_BALL]: {
			image: generateImageSrc("powerups", "slicing_ball")
		},
		[Block.POWER_UPS.EXTRA_BALL]: {
			image: generateImageSrc("powerups", "add_ball")
		},
		[Block.POWER_UPS.EXTRA_LIFE]: {
			image: generateImageSrc("powerups", "add_heart")
		}
	};
	export interface IConfig{
		game: Game;
		x: number;
		y: number, 
		color: Color,
		width: number
	}
}