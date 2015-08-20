
function get(what: string): HTMLElement {
    return document.getElementById(what);
}

class Game {
    static SIZE: { w: number, h: number }; // size of gameCanvas
    static iSIZE: { w: number, h: number }; // size of infoCanvas

    static canvas: HTMLCanvasElement;
    static context: CanvasRenderingContext2D; // context for the gameCanvas
    static infoContext: CanvasRenderingContext2D; // context for the infoCanvas
    static canvasClientRect = { left: 0, top: 0 }; // used by the mouse class to determine mouse's relative position to the canvas

    static level: Level;

    static lastTick: number;
    static lastRender: number;
    static tickLength: number;

    static init() {
        Game.canvas = <HTMLCanvasElement>get('gameCanvas');
        Game.context = Game.canvas.getContext('2d');
        Game.infoContext = (<HTMLCanvasElement>get('infoCanvas')).getContext('2d');
        Game.canvasClientRect = Game.canvas.getBoundingClientRect();
        Game.SIZE = { w: Game.canvas.width, h: Game.canvas.height };
        Game.iSIZE = { w: Game.infoContext.canvas.width, h: Game.infoContext.canvas.height };

        Game.lastTick = Math.floor(performance.now()); // we'll only ever be adding whole numbers to this, no point in storing floating point value
        Game.lastRender = Game.lastTick; //Pretend the first draw was on first update.
        Game.tickLength = 17;

        Game.level = new Level();

        Game.loop(performance.now());
    }

    static loop(tFrame) {
        window.requestAnimationFrame(Game.loop);

        var nextTick = Game.lastTick + Game.tickLength;
        var numTicks = 0;

        if (tFrame > nextTick) {
            var timeSinceTick = tFrame - Game.lastTick;
            numTicks = Math.floor(timeSinceTick / Game.tickLength);
        }

        Game.queueUpdates(numTicks);
        Game.render();
        Game.lastRender = tFrame;
    }

    static queueUpdates(numTicks: number) {
        for (var i = 0; i < numTicks; i++) {
            Game.lastTick = Game.lastTick + Game.tickLength; //Now lastTick is this tick.
            Game.update(Game.lastTick);
        }
    }

    static update(tickCount: number) {
        Game.level.update();
    }

    static render() {
        Game.context.fillStyle = "#0e132e";
        Game.context.fillRect(0, 0, Game.SIZE.w, Game.SIZE.h);

        Game.infoContext.fillStyle = "#262d59";
        Game.infoContext.fillRect(0, 0, Game.iSIZE.w, Game.iSIZE.h);

        Game.infoContext.fillStyle = "#001";
        Game.infoContext.fillRect(0, Game.iSIZE.h - 2, Game.iSIZE.w, 2);

        Game.level.render();
    }

}

class Level {

    blocks: Array<Block>;

    xo: number;
    yo: number;

    static width: number = 6; // how many blocks wide the field is
    static height: number = 8; // how many blocks tall the field is

    player: Paddle;
    balls: Ball[];

    ballstill: boolean = true; // Is true at the start of the game, and after the player loses a life. Gets set to false on mouse down.
    deathcount: number = 0;
    static gamestates = { playing: -1, lost: 0, won: 1 };
    gamestate: number;

    heartImg: HTMLImageElement;

    constructor() {
        this.player = new Paddle();
        this.balls = new Array<Ball>(1);
        this.balls[0] = new Ball();

        this.xo = 70; // keep these constant for now
        this.yo = 25;

        this.heartImg = new Image();
        this.heartImg.src = "res/heart.png";

        this.reset();
    }

    update() {
        if (this.gamestate === Level.gamestates.playing) {
            this.player.update();
            for (var i = 0; i < this.balls.length; i++) {
                this.balls[i].update(this.player);
            }

            if (this.checkBoardWon()) {
                this.deathcount--;
                this.die();
                this.gamestate = Level.gamestates.won;
            }
        } else {
            if (Mouse.ldown) { // the player wants to restart
                this.reset();
            }
        }
    }

    checkBoardWon(): boolean {
        for (var i in this.blocks) {
            if (this.blocks[i].colour !== 0) return false;
        }
        return true;
    }

    die() { // TODO rename this: it gets called whenever the ball goes off the bottom of the screen
        var i;

        this.balls = new Array<Ball>(1);
        this.balls[0] = new Ball();
        this.player.reset();
        this.ballstill = true;
        this.deathcount++;
        if (this.deathcount >= 3) {
            this.gamestate = Level.gamestates.lost;
        }

    }

    destroySquare(xp: number, yp: number, ball: Ball) { // destroys a 3x3 square (bomb tile)
        Sound.play(Sound.boom);
        var x = (xp - this.xo) / 100;
        var y = (yp - this.yo) / 35;
        for (var yy = Math.max(y - 1, 0); yy <= Math.min(y + 1, Level.height - 1); yy++) {
            for (var xx = Math.max(x - 1, 0); xx <= Math.min(x + 1, Level.width - 1); xx++) {
                if (this.blocks[xx + yy * Level.width].colour === 0) continue;
                this.blocks[xx + yy * Level.width].destroy(ball);
            }
        }
    }

    reset() {
        var i;

        this.gamestate = Level.gamestates.playing;
        this.deathcount = 0;
        this.ballstill = true;
        this.balls = new Array<Ball>(1);
        this.balls[0] = new Ball();
        this.player.reset();

        this.blocks = new Array(Level.width * Level.height);
        for (i = 0; i < this.blocks.length; i++) {
            this.blocks[i] = new Block((i % Level.width) * 100 + this.xo, Math.floor(i / Level.width) * 35 + this.yo, this.getColour(i, 3));
        }
    }

    getColour(i: number, pattern?: number): number {
        if (!pattern) pattern = 6;
        switch (pattern) {
            case 0: // checker board
                return (i % 2 - Math.floor(i / Level.width) % 2) === 0 ? 1 : 2;
            case 1: // rainbow columns
                return i % Level.width + 2;
            case 2: // rainbow rows
                return Math.floor(i / Level.width) + 2;
            case 3: // rainbow rows (flipped)
                return 7 - Math.floor(i / Level.width) + 2;
            case 4: // rainbow diagonal
                return (Math.floor(i / Level.width) + i % Level.width) % 8 + 2;
            case 5: // rainbow diagonal (flipped)
                return (Math.floor(i / Level.width) + (8 - i % Level.width)) % 8 + 2;
            case 6:
                return Math.floor(Math.random() * 8) + 2;
            default:
                console.error("invalid number passed to Level.getColour: ", pattern);
                return i % Level.width + 1;
        }
    }

    render() {
        var i;

        this.player.render();
        for (i = 0; i < this.balls.length; i++) {
            this.balls[i].render();
        }

        for (i in this.blocks) {
            if (this.blocks[i].colour === 0) continue;
            else this.blocks[i].render();
        }

        if (this.gamestate === Level.gamestates.lost || this.gamestate === Level.gamestates.won) {
            Game.context.fillStyle = "#123";
            Game.context.fillRect(Game.SIZE.w / 2 - 110, 112, 220, 100);
            Game.context.fillRect(Game.SIZE.w / 2 - 80, 252, 160, 30);

            Game.context.strokeStyle = "#EEF";
            Game.context.lineWidth = 2;
            Game.context.strokeRect(Game.SIZE.w / 2 - 112, 110, 224, 104);
            Game.context.strokeRect(Game.SIZE.w / 2 - 82, 250, 164, 34);

            Game.context.fillStyle = "white";
            Game.context.font = "36px Poiret One";
            var msg = "Game Over!";
            Game.context.fillText(msg, Game.SIZE.w / 2 - Game.context.measureText(msg).width / 2, 150);
            Game.context.font = "28px Poiret One";

            msg = "You " + (this.gamestate === Level.gamestates.won ? "Won!" : "Lost!");
            Game.context.fillText(msg, Game.SIZE.w / 2 - Game.context.measureText(msg).width / 2, 200);
            Game.context.font = "20px Poiret One";

            if (Game.lastTick % 800 > 400) Game.context.fillStyle = "grey";
            msg = "Click to restart";
            Game.context.fillText(msg, Game.SIZE.w / 2 - Game.context.measureText(msg).width / 2, 275);
        } else if (this.ballstill) {
            if (Game.lastTick % 1000 > 500) Game.context.fillStyle = "grey";
            else Game.context.fillStyle = "white";
            Game.context.font = "30px Poiret One";
            var msg = "Click to begin";
            Game.context.fillText(msg, Game.SIZE.w / 2 - Game.context.measureText(msg).width / 2, 380);
        }

        for (i = 0; i < 3 - this.deathcount; i++) {
            Game.infoContext.drawImage(this.heartImg, 25 + i * 40, Game.iSIZE.h / 2 - 16);
        }

    }
}

class Block {

    static width: number = 80;
    static height: number = 20;
    x: number;
    y: number;

    static block_images = Array<HTMLImageElement>();
    colour: number; // an index in Block.block_images array


    static powerups = ["", "bomb", "bigger_paddle", "slice_ball", "extra_ball", "extra_life"];
    static powerup_images = Array<HTMLImageElement>();
    powerup: number;

    static loadImages() {
        Block.block_images = new Array(10);
        Block.block_images[0] = null;
        Block.block_images[1] = new Image();
        Block.block_images[1].src = "res/blocks/grey.png";
        Block.block_images[2] = new Image();
        Block.block_images[2].src = "res/blocks/red.png";
        Block.block_images[3] = new Image();
        Block.block_images[3].src = "res/blocks/orange.png";
        Block.block_images[4] = new Image();
        Block.block_images[4].src = "res/blocks/yellow.png";
        Block.block_images[5] = new Image();
        Block.block_images[5].src = "res/blocks/green.png";
        Block.block_images[6] = new Image();
        Block.block_images[6].src = "res/blocks/blue.png";
        Block.block_images[7] = new Image();
        Block.block_images[7].src = "res/blocks/darkblue.png";
        Block.block_images[8] = new Image();
        Block.block_images[8].src = "res/blocks/purple.png";
        Block.block_images[9] = new Image();
        Block.block_images[9].src = "res/blocks/pink.png";

        Block.powerup_images[0] = null;
        Block.powerup_images[1] = new Image();
        Block.powerup_images[1].src = "res/powerups/bomb.png";
        Block.powerup_images[2] = new Image();
        Block.powerup_images[2].src = "res/powerups/longer_paddle.png";
        Block.powerup_images[3] = new Image();
        Block.powerup_images[3].src = "res/powerups/slicing_ball.png";
        Block.powerup_images[4] = new Image();
        Block.powerup_images[4].src = "res/powerups/add_ball.png";
        Block.powerup_images[5] = new Image();
        Block.powerup_images[5].src = "res/powerups/add_heart.png";
    }

    constructor(x: number, y: number, colour: number) {
        this.x = x;
        this.y = y;
        this.colour = colour;
        this.powerup = Math.floor(Math.random() * 24);
        if (this.powerup > Block.powerups.length - 1) {
            this.powerup = 0;
        }
    }

    destroy(ball: Ball) {
        if (this.colour === 0) return;
        this.colour = 0;
        switch (Block.powerups[this.powerup]) {
            case "":
                break;
            case "bomb":
                Game.level.destroySquare(this.x, this.y, ball);
                break;
            case "bigger_paddle":
                Game.level.player.biggerTimer = 300;
                break;
            case "slice_ball":
                ball.slices = 100;
                break;
            case "extra_ball":
                Game.level.balls.push(new Ball());
                Game.level.balls[Game.level.balls.length - 1].shoot();
                break;
            case "extra_life":
                Game.level.deathcount--;
                break;
        }
    }

    render() {
        Game.context.drawImage(Block.block_images[this.colour], this.x, this.y);
        if (this.powerup !== 0) {
            Game.context.drawImage(Block.powerup_images[this.powerup], this.x + Block.width / 2 - 7, this.y + 3);
        }
    }

}

class Paddle {

    x: number;
    y: number;
    width: number;
    height: number;
    maxv: number;
    biggerTimer: number = 0;
    img: HTMLImageElement;

    constructor() {
        this.reset();

        this.img = new Image();
        this.img.src = "res/player_paddle.png";
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

        if (Game.level.ballstill && Mouse.ldown) {
            Game.level.balls[0].shoot();
            return;
        }
        if (Game.level.ballstill) return;

        var destx = Math.min(Math.max(Mouse.x - this.width / 2, 0), Game.SIZE.w - this.width);
        var amount = Math.min(Math.abs(this.x - destx), this.maxv);
        this.x += destx > this.x ? amount : -amount;
    }

    render() {
        Game.context.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

}

class Ball {

    x: number;
    y: number;
    xv: number;
    yv: number;
    maxXv: number = 8;
    r: number;
    img: HTMLImageElement;
    img_slicing: HTMLImageElement;
    slices: number = 0;

    constructor() {
        this.reset();

        this.img = new Image();
        this.img.src = "res/ball.png";

        this.img_slicing = new Image();
        this.img_slicing.src = "res/ball_slicing.png";
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

        this.slices--;

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
        if (this.x > Game.SIZE.w - this.r) {
            Sound.play(Sound.bloop);
            this.xv = -this.xv;
            this.x = Game.SIZE.w - this.r;
        }
        if (this.x < this.r) {
            Sound.play(Sound.bloop);
            this.xv = -this.xv;
            this.x = this.r;
        }
        if (this.y < this.r) {
            Sound.play(Sound.bloop);
            this.yv = -this.yv;
            this.y = this.r;
        }
        if (this.y > Game.SIZE.h) {
            if (Game.level.balls.length > 1) {
                Game.level.balls.splice(Game.level.balls.indexOf(this), 1);
                return;
            }
            Sound.play(Sound.die);
            Game.level.die();
            return;
        }

        // check for collisions with blocks
        var c = this.collides();
        if (c !== -1) {
            Sound.play(Sound.bloop);
            if (this.slices > 0) {
                return;
            }

            if (this.x > Game.level.blocks[c].x + Block.width) {
                this.xv = Math.abs(this.xv);
            }
            if (this.x < Game.level.blocks[c].x) {
                this.xv = -Math.abs(this.xv);
            }
            if (this.y > Game.level.blocks[c].y + Block.height) {
                this.yv = Math.abs(this.yv);
            }
            if (this.y < Game.level.blocks[c].y) {
                this.yv = -Math.abs(this.yv);
            }
        }
    }

    collides(): number {
        for (var i in Game.level.blocks) {
            var b = Game.level.blocks[i];
            if (b.colour === 0) continue;
            if (this.x + this.r > b.x && this.x - this.r < b.x + Block.width && this.y + this.r > b.y && this.y - this.r < b.y + Block.height) {
                Game.level.blocks[i].destroy(this);
                return i;
            }
        }
        return -1;
    }

    shoot() { // shoot off the player's paddle
        Game.level.ballstill = false;
        this.yv = -7;
        do {
            this.xv = Math.floor(Math.random() * 10) - 5;
        } while (this.xv >= -1 && this.xv <= 1);

    }

    render() {
        if (this.slices < 60 && this.slices % 20 < 10) { // blinking effect when slicing effect is about to wear off
            Game.context.drawImage(this.img, this.x - this.r, this.y - this.r);
        } else {
            Game.context.drawImage(this.img_slicing, this.x - this.r, this.y - this.r);
        }
    }

}

class Mouse {

    static x: number = 0;
    static y: number = 0;
    static ldown: boolean = false;
    static rdown: boolean = false;

    static update(event: MouseEvent) {
        Mouse.x = event.clientX - Game.canvasClientRect.left;
        Mouse.y = event.clientY - Game.canvasClientRect.top;
    }

    static down(event: MouseEvent) {
        if (event.button === 1 || event.which === 1) Mouse.ldown = true;
        else if (event.button === 3 || event.which === 3) Mouse.rdown = true;
    }

    static up(event: MouseEvent) {
        if (event.button === 1 || event.which === 1) Mouse.ldown = false;
        else if (event.button === 3 || event.which === 3) Mouse.rdown = false;
    }

}

class Sound {

    static blip;
    static bloop;
    static die;
    static boom;
    static life;

    static muted = false;
    static volume = 0.5;
    static volumeSlider;

    static init() {
        Sound.blip = <HTMLAudioElement>get('blipSound');
        Sound.bloop = <HTMLAudioElement>get('bloopSound');
        Sound.die = <HTMLAudioElement>get('dieSound');
        Sound.boom = <HTMLAudioElement>get('boomSound');
        Sound.life = <HTMLAudioElement>get('lifeSound');

        Sound.volumeSlider = <HTMLInputElement>get('volumeSlider');
    }

    static changeVolume() {
        Sound.volume = Number(Sound.volumeSlider.value) / 100;
    }

    static toggleMute(): void {
        Sound.muted = !Sound.muted;
    }

    static play(sound: HTMLAudioElement): void {
        if (Sound.muted) return;
        sound.volume = Sound.volume;
        sound.currentTime = 0;
        sound.play();
    }
}

function toggleFooter(which: string) {
    var front = '1',
        back = '0',
        about = get('aboutFooter');

    if (which === 'about') {
        if (about.className === 'short') {
            about.style.zIndex = front;
            about.className = 'long';
        } else {
            about.className = 'short';
        }
    }
}

window.onload = function() {
    Block.loadImages();
    Sound.init();
    Game.init();
};
