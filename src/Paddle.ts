import { Mouse, Keyboard, GameInstance, Block, Base } from './imports';
export class Paddle extends Base {

    x: number;
    y: number;
    width: number;
    height: number;
    maxv: number;
    biggerTimer: number = 0;
    img: HTMLImageElement;
    usingMouseInput: boolean;

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
        })
    }

    reset() {
        this.x = 270;
        this.y = 450;
        this.width = 180;
        this.height = 25;
        this.maxv = 25;
        this.biggerTimer = 0;
    }

    update() {
        this.biggerTimer--;
        if (this.biggerTimer > 0) {
            if (this.biggerTimer < 100) {
                this.width = 180 + this.biggerTimer;
            } else {
                this.width = 280;
            }
        } else {
            this.width = 180;
        }

        if (GameInstance.level.ballstill && Mouse.ldown) {
            GameInstance.level.balls[0].shoot();
            return;
        }
        if (GameInstance.level.ballstill) return;

        var left = !!(Keyboard.keysdown[Keyboard.KEYS.A] || Keyboard.keysdown[Keyboard.KEYS.LEFT]);
        var right = !!(Keyboard.keysdown[Keyboard.KEYS.D] || Keyboard.keysdown[Keyboard.KEYS.RIGHT]);
        var destx = this.x;
        var amount = 0;

        if (this.usingMouseInput) {
            destx = Math.min(Math.max(Mouse.x - this.width / 2, 0), GameInstance.SIZE.w - this.width);
        } else {
            if (left) {
                destx = 0;
            } else if (right) {
                destx = GameInstance.canvas.width - this.width;
            }
        }
        amount = Math.min(Math.abs(this.x - destx), this.maxv);

        this.x += destx > this.x ? amount : -amount;
    }

    render() {
        GameInstance.context.drawImage(this.img, this.x + GameInstance.level.camera.xo, this.y + GameInstance.level.camera.yo, this.width, this.height);
    }
}