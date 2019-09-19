import { GameInstance } from './Game';
import { Base } from "./Base";
import { PreviousPosition, Sound } from "./main";
import { Block } from "./Block";
import { Paddle } from './Paddle';

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
