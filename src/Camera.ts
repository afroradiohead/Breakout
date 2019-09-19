import { Block, Base } from "./imports";

export class Camera extends Base<any>{
    xo: number = 0;
    yo: number = 0;

    shakeX: number = 0;
    shakeY: number = 0;

    constructor() {
		super();
        this.listen<Block>("destroyed").subscribe(({instance: block}) => {
            if(block.powerUpName === Block.POWER_UPS.BOMB){
                this.shake(block.destroyingBall.xv * 4, block.destroyingBall.yv * 4)
            }
        })
    }

    update() {
        this.shakeX *= 0.90;
        this.shakeY *= 0.90;

        if (this.shakeX < 0.001 && this.shakeX > -0.001) {
            this.shakeX = 0;
        }
        if (this.shakeY < 0.001 && this.shakeY > -0.001) {
            this.shakeY = 0;
        }

        this.xo = this.shakeX;
        this.yo = this.shakeY;
    }

    shake(amountX: number, amountY: number) {
        this.shakeX += (Math.random() * (amountX / 2) + (amountX / 2));
        this.shakeY += (Math.random() * (amountY / 2) + (amountX / 2));
    }
}
