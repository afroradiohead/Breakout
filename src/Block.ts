import {UTILS, Game, Base, Ball, ParticleGenerator, Color} from "./imports"

const IMAGE_LIST = [null, "grey", "red", "orange", "yellow", "green", "blue", "darkblue", "purple", "pink"].map(color => {
	return UTILS.generateImageElement({
		src: `res/blocks/${color}.png`
	});
});

function generateImageSrc(type: "powerups" | "blocks", name: string): HTMLImageElement{
	return UTILS.generateImageElement({src: `res/${type}/${name}.png`})
}


export class Block extends Base<"destroyed">{
    static width: number = 80;
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
	destroyingBall: Ball;
	powerUpName: Block.POWER_UPS = Block.POWER_UPS.NONE;
    constructor(public config: Block.IConfig) {
		super();
		const randomPowerUpSeed = Math.floor(Math.random() * 24);
		const powerUpCount = Object.keys(Block.POWER_UPS).length;
		
		if(randomPowerUpSeed < powerUpCount - 1){
			this.powerUpName = Block.POWER_UPS[UTILS.LODASH.sample(Object.keys(Block.POWER_UPS))];
		}
    }

    destroy(ball: Ball) {
		this.destroyingBall = ball;
		if (this.color > 0) {
			const powerUpConfig = Block.POWER_UP_CONFIG_BY_NAME[this.powerUpName];
			if(powerUpConfig && powerUpConfig.action){
				powerUpConfig.action(this, ball);
			}
	
			this.game.level.particleGenerators.push(new ParticleGenerator(this.x + Block.width / 2, this.y, Color.convert(this.color)));
	
			this.config.color = 0;
		}
		this.emit("destroyed");
    }

    render() {
        this.game.context.drawImage(IMAGE_LIST[this.color], this.x + this.game.level.camera.xo, this.y + this.game.level.camera.yo);
		const powerUpConfig = Block.POWER_UP_CONFIG_BY_NAME[this.powerUpName];
        if (powerUpConfig) {
            this.game.context.drawImage(powerUpConfig.image, this.x + Block.width / 2 - 7 + this.game.level.camera.xo, this.y + 3 + this.game.level.camera.yo);
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
		color: number
	}
}