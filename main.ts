
function get(what: string): HTMLElement {
    return document.getElementById(what);
}

class Game {
    static SIZE: { w: number, h: number }; // size of gameCanvas
    static iSIZE: { w: number, h: number }; // size of infoCanvas
    static context: CanvasRenderingContext2D; // context for the gameCanvas
    static infoContext: CanvasRenderingContext2D; // context for the infoCanvas
    static level: Level;

    static lastTick: number;
    static lastRender: number;
    static tickLength: number;

    static init() {
        Game.context = (<HTMLCanvasElement>get('gameCanvas')).getContext('2d');
        Game.infoContext = (<HTMLCanvasElement>get('infoCanvas')).getContext('2d');
        Game.SIZE = { w: Game.context.canvas.width, h: Game.context.canvas.height };
        Game.iSIZE = { w: Game.infoContext.canvas.width, h: Game.infoContext.canvas.height };

        Game.level = new Level();

        Game.lastTick = Math.floor(performance.now()); // we'll only ever be adding whole numbers to this, no point in storing floating point value
        Game.lastRender = Game.lastTick; //Pretend the first draw was on first update.
        Game.tickLength = 17;

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

    player: Paddle;
    ball: Ball;

    ballstill: boolean = true; // Is true at the start of the game, and after the player loses a life. Gets set to false on mouse down.
    deathcount: number = 0;
    static gamestates = { playing: -1, lost: 0, won: 1 };
    gamestate: number;

    heartImg;

    constructor() {
        this.player = new Paddle();
        this.ball = new Ball();

        this.xo = 70; // keep these constant for now
        this.yo = 25;

        this.heartImg = new Image();
        this.heartImg.src = "res/heart.png";

        this.reset();
    }

    getType(i: number, pattern?: number): number {
        if (!pattern) pattern = 6;
        switch (pattern) {
            case 0: // checker board
                return (i % 2 - Math.floor(i / 6) % 2) === 0 ? 1 : 2;
            case 1: // rainbow columns
                return i % 6 + 2;
            case 2: // rainbow rows
                return Math.floor(i / 6) + 2;
            case 3: // rainbow rows (flipped)
                return 7 - Math.floor(i / 6) + 2;
            case 4: // rainbow diagonal
                return (Math.floor(i / 6) + i % 6) % 8 + 2;
            case 5: // rainbow diagonal (flipped)
                return (Math.floor(i / 6) + (8 - i % 6)) % 8 + 2;
            case 6:
                return Math.floor(Math.random() * 8) + 2;
            default:
                console.error("invalid number passed to Level.getType: ", pattern);
                return i % 6 + 1;
        }
    }

    update() {
        if (this.gamestate === Level.gamestates.playing) {
            this.player.update();
            this.ball.update(this.player);

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
            if (this.blocks[i].type !== 0) return false;
        }
        return true;
    }

    die() { // TODO rename this: it gets called whenever the ball goes off the bottom of the screen
        this.ball.reset();
        this.player.reset();
        this.ballstill = true;
        this.deathcount++;
        if (this.deathcount >= 3) {
            this.gamestate = Level.gamestates.lost;
        }

    }

    reset() {
        this.gamestate = Level.gamestates.playing;
        this.deathcount = 0;
        this.ballstill = true;
        this.player.reset();
        this.ball.reset();

        this.blocks = new Array(48);
        for (var i = 0; i < this.blocks.length; i++) {
            this.blocks[i] = new Block((i % 6) * 100 + this.xo, Math.floor(i / 6) * 35 + this.yo, this.getType(i, 3));
        }
    }

    render() {
        var i;

        this.player.render();
        this.ball.render();

        for (i in this.blocks) {
            if (this.blocks[i].type === 0) continue;
            else this.blocks[i].render();
        }

        switch (this.gamestate) {
            case Level.gamestates.playing:
                break;
            case Level.gamestates.lost:
            case Level.gamestates.won:
                Game.context.fillStyle = "#124";
                Game.context.fillRect(Game.SIZE.w / 2 - 110, 122, 220, 45);
                Game.context.fillRect(Game.SIZE.w / 2 - 80, 222, 160, 35);
                Game.context.fillRect(Game.SIZE.w / 2 - 90, 278, 180, 30);
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
                break;
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

    static images = Array<HTMLImageElement>();
    type: number;

    static loadImages() {
        Block.images = new Array(10);
        Block.images[0] = null;
        Block.images[1] = new Image();
        Block.images[1].src = "res/block_grey.png";
        Block.images[2] = new Image();
        Block.images[2].src = "res/block_red.png";
        Block.images[3] = new Image();
        Block.images[3].src = "res/block_orange.png";
        Block.images[4] = new Image();
        Block.images[4].src = "res/block_yellow.png";
        Block.images[5] = new Image();
        Block.images[5].src = "res/block_green.png";
        Block.images[6] = new Image();
        Block.images[6].src = "res/block_blue.png";
        Block.images[7] = new Image();
        Block.images[7].src = "res/block_darkblue.png";
        Block.images[8] = new Image();
        Block.images[8].src = "res/block_purple.png";
        Block.images[9] = new Image();
        Block.images[9].src = "res/block_pink.png";
    }

    constructor(x: number, y: number, type: number) {
        this.x = x;
        this.y = y;
        this.type = type;
    }

    render() {
        // Game.context.fillStyle = Game.level.colours[this.type];
        // Game.context.fillRect(this.x, this.y, Block.width, Block.height);
        Game.context.drawImage(Block.images[this.type], this.x, this.y);
    }

}

class Paddle {

    x: number;
    y: number;
    width: number;
    height: number;
    maxv: number;
    img;

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
    }

    update() {
        if (Game.level.ballstill && Mouse.ldown) {
            Game.level.ballstill = false;
            Game.level.ball.yv = -7;
            do {
                Game.level.ball.xv = Math.floor(Math.random() * 10) - 5;
            } while (Game.level.ball.xv >= -1 && Game.level.ball.xv <= 1);

            return;
        }
        if (Game.level.ballstill) return;

        var destx = Math.min(Math.max(Mouse.x - this.width / 2, 0), Game.SIZE.w - this.width);
        var amount = Math.min(Math.abs(this.x - destx), this.maxv);
        this.x += destx > this.x ? amount : -amount;
    }

    render() {
        // Game.context.fillStyle = "#457";
        // Game.context.fillRect(this.x, this.y, this.width, this.height);
        Game.context.drawImage(this.img, this.x, this.y);
    }

}

class Ball {

    x: number;
    y: number;
    xv: number;
    yv: number;
    r: number;
    img;

    constructor() {
        this.reset();

        this.img = new Image();
        this.img.src = "res/ball.png";
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

        // check for colisions with player paddle
        if (this.x + this.r > player.x && this.x - this.r < player.x + player.width && this.y + this.r > player.y && this.y - this.r < player.y + player.height) {
            Sound.play(Sound.blip);
            this.yv = -this.yv;
            this.y = player.y - this.r;
            this.xv += ((this.x - player.x - player.width / 2) / 100) * 5;
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
            Sound.play(Sound.die);
            Game.level.die();
            return;
        }

        // check for collisions with blocks
        var c = this.collides();
        if (c !== -1) {
            Sound.play(Sound.bloop);

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
            if (b.type === 0) continue;
            if (this.x + this.r > b.x && this.x - this.r < b.x + Block.width && this.y + this.r > b.y && this.y - this.r < b.y + Block.height) {
                Game.level.blocks[i].type = 0;
                return i;
            }
        }
        return -1;
    }

    render() {
        Game.context.drawImage(this.img, this.x - this.r, this.y - this.r);
    }

}

class Mouse {

    static x: number = 0;
    static y: number = 0;
    static ldown: boolean = false;
    static rdown: boolean = false;

    static update(event: MouseEvent) {
        Mouse.x = event.clientX - get('gameCanvas').getBoundingClientRect().left;
        Mouse.y = event.clientY - get('gameCanvas').getBoundingClientRect().top;
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

    static blip = 'blipSound';
    static bloop = 'bloopSound';
    static die = 'dieSound';

    static muted = false;
    static volume = 0.5;

    static changeVolume() {
        Sound.volume = Number((<HTMLInputElement>get('volumeSlider')).value) / 100;
    }

    static toggleMute(): void {
        Sound.muted = !Sound.muted;
    }

    static play(sound: string): void {
        if (Sound.muted) return;
        (<HTMLAudioElement>get(sound)).volume = Sound.volume;
        (<HTMLAudioElement>get(sound)).currentTime = 0;
        (<HTMLAudioElement>get(sound)).play();
    }
}

window.onload = function() {
    Block.loadImages();
    Game.init();
};
