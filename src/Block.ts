import { Sound } from './main';
import {UTILS, Game, Ball, ParticleGenerator, Color} from "./imports"
import {Base } from "./Base";
import { GameEvent } from './engine/annotations/GameEvent';

function generateImageSrc(type: "powerups" | "blocks", name: string): HTMLImageElement{
	return UTILS.generateImageElement({src: `res/${type}/${name}.png`})
}

export class Block extends Base<"destroyed"> implements Base.IBoundingBox{
	boundingBox = {
        x: 0,
        y: 0,
        height: 0,
        width: 0
    }
	static height: number = 20;

	get game(): Game{
		return this.config.game;
	}
	
	public get x(): number {
		return this.config.x;
	}

	public get y(): number {
		return this.config.y
	}
	public get color(): any {
		return this.config.color;
	}

	public get width(): number {
		return this.config.width;
	}

	public get height(): number {
		return Block.height;
	}
	shape = new UTILS.CREATEJS.Shape()
	destroyingBall: Ball;
	powerUpName: Block.POWER_UPS = Block.POWER_UPS.NONE;


    constructor(public config: Block.IConfig) {
		super();
		const randomPowerUpSeed = Math.floor(Math.random() * 24);
		const powerUpCount = Object.keys(Block.POWER_UPS).length;
		this.boundingBox = {
			x: config.x,
			y: config.y,
			width: config.width,
			height: this.height
		}
		
		if(randomPowerUpSeed < powerUpCount - 1){
			this.powerUpName = Block.POWER_UPS[UTILS.LODASH.sample(Object.keys(Block.POWER_UPS))];
		}
		this.shape.graphics.beginFill(`rgb(${this.config.color.r}, ${this.config.color.g}, ${this.config.color.b})`).drawRect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height);
		
		this.game.stage.addChild(this.shape);
    }

    destroy(ball: Ball) {
		this.destroyingBall = ball;
		this.game.level.particleGenerators.push(new ParticleGenerator(this.boundingBox.x + this.boundingBox.width / 2, this.boundingBox.y, this.color));
		this.emit("destroyed");
		Sound.play(Sound.bloop);
		this.game.stage.removeChild(this.shape);
    }

    async render() {
		const powerUpConfig = Block.POWER_UP_CONFIG_BY_NAME[this.powerUpName];
        if (powerUpConfig) {
            this.game.context.drawImage(powerUpConfig.image, this.boundingBox.x + this.boundingBox.width / 2 - 7 + this.game.level.camera.xo, this.boundingBox.y + 3 + this.game.level.camera.yo);
        }
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