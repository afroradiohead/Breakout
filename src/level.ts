import { Block } from './Block';
import {Ball, ParticleGenerator, Camera, Mouse, Keyboard, Sound} from "./main";
import {GameInstance} from "./Game";
import {times} from "lodash";
import { Paddle } from './Paddle';

export class Level {

    blocks: Array<Block>;

    xo: number;
    yo: number;

    camera: Camera;

    static width: number = 6; // how many blocks wide the field is
    static height: number = 8; // how many blocks tall the field is

    player: Paddle;
    balls: Ball[];

    ballstill: boolean = true; // Is true at the start of the game, and after the player loses a life. Gets set to false on mouse down.
    deathcount: number = 0;
    static gamestates = { playing: -1, lost: 0, won: 1 };
    gamestate: number;

    heartImg: HTMLImageElement;
    heartScale = 1.0; // Used to draw hearts extra large when first acquired

    particleGenerators: ParticleGenerator[];

    constructor() {
        this.player = new Paddle();
        this.balls = new Array<Ball>(1);
        this.balls[0] = new Ball();

        this.camera = new Camera();

        this.xo = 70; // keep these constant for now
        this.yo = 25;

        this.heartImg = new Image();
        this.heartImg.src = "res/heart.png";

        this.particleGenerators = new Array<ParticleGenerator>();

        this.camera.shake(0, -2000); // Drop tiles in from top of screen

        this.reset();
    }

    update() {
        if (GameInstance.paused) {
            if (Mouse.ldown) {
                GameInstance.paused = false;
            } else {
                return;
            }
        }

        if (this.gamestate === Level.gamestates.playing) {
            this.player.update();
            for (var i = 0; i < this.balls.length; i++) {
                this.balls[i].update(this.player);
            }

            if (this.checkBoardWon()) {
                this.deathcount--;
                this.gamestate = Level.gamestates.won;
                this.die();
            }
        } else {
            if (Mouse.ldown || Keyboard.keysdown[Keyboard.KEYS.SPACE]) {
                this.reset();
            }
        }

        for (var g in this.particleGenerators) {
            this.particleGenerators[g].update();
        }

        this.camera.update();
    }

    checkBoardWon(): boolean {
        for (var i in this.blocks) {
            if (this.blocks[i].color !== 0) return false;
        }
        return true;
    }

    die() {
        this.balls = new Array<Ball>(1);
        this.balls[0] = new Ball();
        this.player.reset();
        this.ballstill = true;
        this.deathcount++;
        if (this.deathcount >= 3) {
            this.gamestate = Level.gamestates.lost;
        }

        // If we've won, we're calling this just to reset things
        if (this.gamestate != Level.gamestates.won) {
            // Render the last heart shrinking into oblivion
            this.heartScale = 0.99;
        }
    }

    destroySquare(xp: number, yp: number, ball: Ball) { // destroys a 3x3 square (bomb tile)
        Sound.play(Sound.boom);
        var x = (xp - this.xo) / 100;
        var y = (yp - this.yo) / 35;
        for (var yy = Math.max(y - 1, 0); yy <= Math.min(y + 1, Level.height - 1); yy++) {
            for (var xx = Math.max(x - 1, 0); xx <= Math.min(x + 1, Level.width - 1); xx++) {
                if (this.blocks[xx + yy * Level.width].color === 0) continue;
                if (xx === x && yy === y) continue;
                this.blocks[xx + yy * Level.width].destroy(ball);
            }
        }

        this.camera.shake(ball.xv * 4, ball.yv * 4);
    }

    reset() {

        GameInstance.paused = false;
        this.gamestate = Level.gamestates.playing;
        this.deathcount = 0;
        this.ballstill = true;
        this.balls = new Array<Ball>(1);
        this.balls[0] = new Ball();
        this.player.reset();        
        const rand = Math.floor(Math.random() * 5);

        this.blocks = times(Level.width * Level.height, (i) => {
            return new Block({
                game: GameInstance,
                x: (i % Level.width) * 100 + this.xo,
                y: Math.floor(i / Level.width) * 35 + this.yo,
                color: this.getColor(i, rand)
            })
        })

    }

    /** Returns a value in the range [1-9] inclusive */
    getColor(i: number, type?: number): number {
        if (!type) {
            type = Math.floor(GameInstance.lastTick % 5);
        } else {
            type %= 5;
        }

        var x = i % Level.width;
        var y = Math.floor(i / Level.width);
        switch (type) {
            case 0:
            {
                // // DISTANCE from (0,0)
                var dist = Math.sqrt(x*x + y*y);
                var maxDist = Math.sqrt(Level.width * Level.width + Level.height * Level.height);
                return Math.floor(dist / maxDist * 9) + 2; // add two so we don't have any greys
            }
            case 1:
            {    // ORDERED
                return (i % 9) + 1;
            }
            case 2:
            {
                // RANDOM
                return Math.floor(Math.random() * 9 + 1);
            }
            case 3:
            {
                // DISTANCE from (width, 0)
                var dist = Math.sqrt((Level.width-x)*(Level.width-x) + y*y);
                var maxDist = Level.width + Math.sqrt(0 + Level.height * Level.height);

                return (Math.floor((dist / maxDist) * 9) + 2);
            }
            case 4:
            {
                // CHECKERBOARD
                // Use the last games tick time (essentially a random number) to
                // vary the colours, but maintain consistency for each time this is
                // called in one frame
                return ((i + (y % 2 === 0 ? 0 : 1)) % 2) * 2 + GameInstance.lastTick % 7 + 1;
            }
        }
    }

    render() {
        var i;

        this.player.render();
        for (i = 0; i < this.balls.length; i++) {
            this.balls[i].render();
        }

        for (i in this.blocks) {
            if (this.blocks[i].color === 0) continue;
            else this.blocks[i].render();
        }

        this.renderRemainingLives();

        for (var g in this.particleGenerators) {
            this.particleGenerators[g].render();
        }

        // Game over / Game won / Paused overlays
        if (this.gamestate === Level.gamestates.lost || this.gamestate === Level.gamestates.won) {
            drawHorizontallyCenteredRectangle(112, 220, 100);
            drawHorizontallyCenteredRectangle(252, 160, 30);

            GameInstance.context.fillStyle = "white";
            GameInstance.context.font = GameInstance.font36;
            var msg = "Game Over!";
            GameInstance.context.fillText(msg, GameInstance.SIZE.w / 2 - GameInstance.context.measureText(msg).width / 2, 150);
            GameInstance.context.font = GameInstance.font28;

            msg = "You " + (this.gamestate === Level.gamestates.won ? "Won!" : "Lost!");
            GameInstance.context.fillText(msg, GameInstance.SIZE.w / 2 - GameInstance.context.measureText(msg).width / 2, 200);
            GameInstance.context.font = GameInstance.font20;

            if (GameInstance.lastTick % 800 > 400) GameInstance.context.fillStyle = "grey";
            msg = "Click to restart";
            GameInstance.context.fillText(msg, GameInstance.SIZE.w / 2 - GameInstance.context.measureText(msg).width / 2, 275);

        } else if(GameInstance.paused) {

            drawHorizontallyCenteredRectangle(112, 220, 50);
            drawHorizontallyCenteredRectangle(248, 230, 35);

            GameInstance.context.fillStyle = "white";
            GameInstance.context.font = GameInstance.font36;
            var msg = "Paused";
            GameInstance.context.fillText(msg, GameInstance.SIZE.w / 2 - GameInstance.context.measureText(msg).width / 2, 150);
            GameInstance.context.font = GameInstance.font28;

            if (GameInstance.lastTick % 800 > 400) GameInstance.context.fillStyle = "grey";
            msg = "Click to unpause";
            GameInstance.context.fillText(msg, GameInstance.SIZE.w / 2 - GameInstance.context.measureText(msg).width / 2, 275);
        } else if (this.ballstill) {
            if (GameInstance.lastTick % 1000 > 500) GameInstance.context.fillStyle = "grey";
            else GameInstance.context.fillStyle = "white";
            GameInstance.context.font = GameInstance.font30;
            var msg = "Click to begin";
            GameInstance.context.fillText(msg, GameInstance.SIZE.w / 2 - GameInstance.context.measureText(msg).width / 2, 380);
        }
    }

    renderRemainingLives() {
        var i;

        for (i = 0; i < 3 - this.deathcount; i++) {
            var scale;
            // We just gained a heart and are going towards 1.0
            // Render the last gained heart larger
            if ((this.heartScale > 1.0) && (i === (3 - this.deathcount) - 1)) {
                scale = this.heartScale;
                var difference = Math.abs(this.heartScale - 1.0);
                this.heartScale -= (difference * 0.08);
                if (this.heartScale < 1.0001) {
                    this.heartScale = 1.0;
                }
            } else {
                scale = 1.0;
            }
            var width = this.heartImg.width * scale;
            var height = this.heartImg.height * scale;
            var x = (35 + i * 40) - (width / 2.0);
            var y = (GameInstance.iSIZE.h / 2) - (height / 2.0);
            GameInstance.infoContext.drawImage(this.heartImg, x, y, width, height);
        }
        // Render last heart shrinking
        if (this.heartScale < 1.0) {
            var difference = Math.abs(this.heartScale - 1.0);
            this.heartScale -= (difference * 0.3);
            if (this.heartScale < 0.0001) {
                this.heartScale = 1.0;
                return;
            }
            var width = this.heartImg.width * this.heartScale;
            var height = this.heartImg.height * this.heartScale;
            var x = (35 + (3 - this.deathcount) * 40) - (width / 2.0);
            var y = (GameInstance.iSIZE.h / 2) - (height / 2.0);
            GameInstance.infoContext.drawImage(this.heartImg, x, y, width, height);
        }
    }
}

function drawHorizontallyCenteredRectangle(y: number, w: number, h: number): void {
    GameInstance.context.fillStyle = "#123";
    GameInstance.context.fillRect(GameInstance.SIZE.w / 2 - w / 2, y, w, h);

    GameInstance.context.strokeStyle = "#EEF";
    GameInstance.context.lineWidth = 2;
    GameInstance.context.strokeRect(GameInstance.SIZE.w / 2 - w / 2, y, w, h);
}
