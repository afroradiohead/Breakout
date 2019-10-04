import { GameInstance } from './Game';
import { Base } from "./Base";
import { PreviousPosition, Sound } from "./main";
import { Block } from "./Block";
import { Paddle } from './Paddle';
import { UTILS } from './utils';
import { GameEngine } from './engine';

export class Ball extends Base<any> implements GameEngine.GameObject, GameEngine.Collider.ICircle{
    collider = {
        x: 0,
        y: 0,
        r: 0
    }

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
    shape = new UTILS.CREATEJS.Shape();

    constructor() {
        super()
        this.reset();

        this.img = new Image();
        this.img.src = "res/ball.png";

        this.img_slicing = new Image();
        this.img_slicing.src = "res/ball_slicing.png";

        this.previousPositions = new Array<PreviousPosition>();

        GameEngine.Event.listen<Block>("destroyed")
        this.listen<Block>("destroyed").subscribe(({instance: block}) => {
            if(block.powerUpName === Block.POWER_UPS.SLICE_BALL){
                this.slices = 100;
            }
        });

        this.shape.graphics.beginFill("red").drawCircle(0, 0, this.collider.r);
        this.shape.shadow = new UTILS.CREATEJS.Shadow("red", 0, 0, 15);
        GameInstance.stage.addChild(this.shape);
        GameEngine.GameObject.register(this);
    }

    reset() {
        this.collider.x = 360;
        this.collider.y = 440;
        this.collider.r = 10;
        this.xv = 0;
        this.yv = 0;
    }

    destroy(){

    }

    onTick(){
        const player = GameInstance.level.player;
        this.collider.x += this.xv;
        this.collider.y += this.yv;

        this.addPosition(new PreviousPosition(this.collider.x, this.collider.y, !(this.slices < 60 && this.slices % 20 < 10)));

        if (this.slices > 0) {
            this.slices--;
        }

        // check for colisions with player paddle
        if (GameEngine.Collider.checkCollision(player, this)) {
            Sound.play(Sound.blip);
            this.yv = -this.yv;
            this.collider.y = player.collider.y - this.collider.r;
            this.xv += ((this.collider.x - player.collider.x - player.collider.width / 2) / 100) * 5;
            if (this.xv > this.maxXv) this.xv = this.maxXv;
            if (this.xv < -this.maxXv) this.xv = -this.maxXv;
            return;
        }

        // check for colisions with window edges
        if (this.collider.x > GameInstance.SIZE.w - this.collider.r) {
            Sound.play(Sound.bloop);
            GameInstance.level.camera.shake(this.xv * 2, 0);
            this.xv = -this.xv;
            this.collider.x = GameInstance.SIZE.w - this.collider.r;
        }
        if (this.collider.x < this.collider.r) {
            Sound.play(Sound.bloop);
            GameInstance.level.camera.shake(this.xv * 2, 0);
            this.xv = -this.xv;
            this.collider.x = this.collider.r;
        }
        if (this.collider.y < this.collider.r) {
            Sound.play(Sound.bloop);
            GameInstance.level.camera.shake(0, this.yv * 2);
            this.yv = -this.yv;
            this.collider.y = this.collider.r;
        }
        if (this.collider.y > GameInstance.SIZE.h) {
            GameInstance.stage.removeChild(this.shape);
            GameEngine.GameObject.unregister(this);
            if (GameInstance.level.balls.length > 1) {
                GameInstance.level.balls.splice(GameInstance.level.balls.indexOf(this), 1);
                
                return;
            }
            Sound.play(Sound.die);
            GameInstance.level.die();
            return;
        }

        // check for collisions with blocks
        const block = GameInstance.level.blocks
            .find(block => !block.destroyingBall && GameEngine.Collider.checkCollision(block, this))
        if (block) {
            block.destroy(this);
            this.speed *= 1.0000005;
            if (this.slices > 0) {
                return;
            }

            if (this.collider.x > block.collider.x + block.collider.width) {
                GameInstance.level.camera.shake(this.xv, 0);
                this.xv = Math.abs(this.xv) * this.speed;
            }
            if (this.collider.x < block.collider.x) {
                GameInstance.level.camera.shake(this.xv, 0);
                this.xv = -Math.abs(this.xv) * this.speed;
            }
            if (this.collider.y > block.collider.y + block.collider.height) {
                GameInstance.level.camera.shake(0, this.yv);
                this.yv = Math.abs(this.yv) * this.speed;
            }
            if (this.collider.y < block.collider.y) {
                GameInstance.level.camera.shake(0, this.yv);
                this.yv = -Math.abs(this.yv) * this.speed;
            }
        }

        this.shape.x = this.collider.x;
        this.shape.y = this.collider.y;
        this.shape.shadow.offsetX = -this.xv;
        this.shape.shadow.offsetY = -this.yv;
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

    speed = 1;
    shoot() { // shoot off the player's paddle
        GameInstance.level.ballstill = false;
        this.yv = -10 * this.speed;
        do {
            this.xv = Math.floor(Math.random() * 10) - 5;
        } while (this.xv >= -1 && this.xv <= 1);
    }

    render() {
        // Render ball trail
        // for (var i = this.previousPositionIndex - 1; i > this.previousPositionIndex - this.previousPositions.length; i--) {
        //     var value = i + (this.previousPositions.length - this.previousPositionIndex) + 1;
        //     GameInstance.context.globalAlpha = (value / this.previousPositions.length) / 4;
        //     var index = i;
        //     if (index < 0) {
        //         index += this.previousPositions.length;
        //     }
        //     var pos = this.previousPositions[index];
        //     var x = pos.x - this.collider.r + GameInstance.level.camera.xo;
        //     var y = pos.y - this.collider.r + GameInstance.level.camera.yo;

        //     if (this.previousPositions[index].green) {
        //         GameInstance.context.drawImage(this.img_slicing, x, y);
        //     } else {
        //         GameInstance.context.drawImage(this.img, x, y);
        //     }
        // }
        // GameInstance.context.globalAlpha = 1.0;

        // var x = this.collider.x - this.collider.r + GameInstance.level.camera.xo;
        // var y = this.collider.y - this.collider.r + GameInstance.level.camera.yo;
        // if (this.slices < 60 && this.slices % 20 < 10) { // blinking effect when slicing effect is about to wear off
        //     GameInstance.context.drawImage(this.img, x, y);
        // } else {
        //     GameInstance.context.drawImage(this.img_slicing, x, y);
        // }
    }
}
