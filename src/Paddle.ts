import { Mouse, Keyboard, GameInstance, Block, Base } from './imports';
import { UTILS } from './utils';
import { GameEngine } from './engine';
export class Paddle extends Base<any> implements GameEngine.Collider.IRectangle{
    collider = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    }

    x: number;
    y: number;
    width: number;
    height: number;
    maxv: number;
    biggerTimer: number = 0;
    img: HTMLImageElement;
    usingMouseInput: boolean;

    shape = new UTILS.CREATEJS.Shape();

    constructor() {
        super();
        this.reset();

        this.img = new Image();
        this.img.src = "res/player_paddle.png";

        this.usingMouseInput = true;

        this.listen<Block>("destroyed").subscribe((event) => {
            if(event.instance.powerUpName === Block.POWER_UPS.BIGGER_PADDLE){
                this.biggerTimer = 300;
            }
        });

        this.shape.graphics.beginFill("blue").drawRect(0,0, this.collider.width, this.collider.height);
        GameInstance.stage.addChild(this.shape);
    }

    reset() {
        this.collider.x = 270;
        this.collider.y = 450;
        this.collider.width = 180;
        this.collider.height = 25;
        this.maxv = 25;
        this.biggerTimer = 0;
        this.shape.x = this.collider.x;
        this.shape.y = this.collider.y;
    }

    update() {
        this.biggerTimer--;
        if (this.biggerTimer > 0) {
            if (this.biggerTimer < 100) {
                this.collider.width = 180 + this.biggerTimer;
            } else {
                this.collider.width = 280;
            }
        } else {
            this.collider.width = 180;
        }

        if (GameInstance.level.ballstill && Mouse.ldown) {
            GameInstance.level.balls[0].shoot();
            return;
        }
        if (GameInstance.level.ballstill) return;

        var left = !!(Keyboard.keysdown[Keyboard.KEYS.A] || Keyboard.keysdown[Keyboard.KEYS.LEFT]);
        var right = !!(Keyboard.keysdown[Keyboard.KEYS.D] || Keyboard.keysdown[Keyboard.KEYS.RIGHT]);
        var destx = this.collider.x;
        var amount = 0;

        if (this.usingMouseInput) {
            destx = Math.min(Math.max(Mouse.x - this.collider.width / 2, 0), GameInstance.SIZE.w - this.collider.width);
        } else {
            if (left) {
                destx = 0;
            } else if (right) {
                destx = GameInstance.canvas.width - this.collider.width;
            }
        }
        amount = Math.min(Math.abs(this.collider.x - destx), this.maxv);

        this.collider.x += destx > this.collider.x ? amount : -amount;
        this.shape.x = this.collider.x + GameInstance.level.camera.xo;
        this.shape.y = this.collider.y + GameInstance.level.camera.yo;
    }

    render() {

    }
}