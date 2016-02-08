/*
    Feature list:
        -[x] Keyboard input
        -[x] Pause overlay
        -[ ] Particles
        -[ ] Screenshake
        -[ ] Animations
        -[ ] Incremental sounds (to reward combos)
        -[ ] Drop tiles down from top smoothly
*/
function get(what) {
    return document.getElementById(what);
}
var Game = (function () {
    function Game() {
    }
    Game.init = function () {
        Game.canvas = get('gameCanvas');
        Game.context = Game.canvas.getContext('2d');
        Game.infoContext = get('infoCanvas').getContext('2d');
        Game.canvasClientRect = Game.canvas.getBoundingClientRect();
        Game.SIZE = { w: Game.canvas.width, h: Game.canvas.height };
        Game.iSIZE = { w: Game.infoContext.canvas.width, h: Game.infoContext.canvas.height };
        Game.lastTick = Math.floor(performance.now()); // we'll only ever be adding whole numbers to this, no point in storing floating point value
        Game.lastRender = Game.lastTick; //Pretend the first draw was on first update.
        Game.tickLength = 17;
        Game.level = new Level();
        Game.loop(performance.now());
    };
    Game.loop = function (delta) {
        window.requestAnimationFrame(Game.loop);
        var nextTick = Game.lastTick + Game.tickLength;
        var numTicks = 0;
        if (delta > nextTick) {
            var timeSinceTick = delta - Game.lastTick;
            numTicks = Math.floor(timeSinceTick / Game.tickLength);
        }
        Game.queueUpdates(numTicks);
        Game.render();
        Game.lastRender = delta;
    };
    Game.queueUpdates = function (numTicks) {
        for (var i = 0; i < numTicks; i++) {
            Game.lastTick = Game.lastTick + Game.tickLength; //Now lastTick is this tick.
            Game.update(Game.lastTick);
        }
    };
    Game.update = function (tickCount) {
        Game.level.update();
    };
    Game.render = function () {
        Game.context.fillStyle = "#0e132e";
        Game.context.fillRect(0, 0, Game.SIZE.w, Game.SIZE.h);
        Game.infoContext.fillStyle = "#262d59";
        Game.infoContext.fillRect(0, 0, Game.iSIZE.w, Game.iSIZE.h);
        Game.infoContext.fillStyle = "#001";
        Game.infoContext.fillRect(0, Game.iSIZE.h - 2, Game.iSIZE.w, 2);
        Game.level.render();
    };
    Game.togglePause = function () {
        Game.paused = !Game.paused;
    };
    Game.canvasClientRect = { left: 0, top: 0 }; // used by the mouse class to determine mouse's relative position to the canvas
    Game.paused = false;
    return Game;
})();
var Level = (function () {
    function Level() {
        this.ballstill = true; // Is true at the start of the game, and after the player loses a life. Gets set to false on mouse down.
        this.deathcount = 0;
        this.player = new Paddle();
        this.balls = new Array(1);
        this.balls[0] = new Ball();
        this.camera = new Camera();
        this.xo = 70; // keep these constant for now
        this.yo = 25;
        this.heartImg = new Image();
        this.heartImg.src = "res/heart.png";
        this.particleGenerators = new Array();
        this.reset();
    }
    Level.prototype.update = function () {
        if (Game.paused) {
            if (Mouse.ldown) {
                Game.paused = false;
            }
            else {
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
                this.die();
                this.gamestate = Level.gamestates.won;
            }
        }
        else {
            if (Mouse.ldown || Keyboard.keysdown[Keyboard.KEYS.SPACE]) {
                this.reset();
            }
        }
        for (var g in this.particleGenerators) {
            this.particleGenerators[g].update();
        }
        this.camera.update();
    };
    Level.prototype.checkBoardWon = function () {
        for (var i in this.blocks) {
            if (this.blocks[i].color !== 0)
                return false;
        }
        return true;
    };
    Level.prototype.die = function () {
        var i;
        this.balls = new Array(1);
        this.balls[0] = new Ball();
        this.player.reset();
        this.ballstill = true;
        this.deathcount++;
        if (this.deathcount >= 3) {
            this.gamestate = Level.gamestates.lost;
        }
    };
    Level.prototype.destroySquare = function (xp, yp, ball) {
        Sound.play(Sound.boom);
        var x = (xp - this.xo) / 100;
        var y = (yp - this.yo) / 35;
        for (var yy = Math.max(y - 1, 0); yy <= Math.min(y + 1, Level.height - 1); yy++) {
            for (var xx = Math.max(x - 1, 0); xx <= Math.min(x + 1, Level.width - 1); xx++) {
                if (this.blocks[xx + yy * Level.width].color === 0)
                    continue;
                if (xx === x && yy === y)
                    continue;
                this.blocks[xx + yy * Level.width].destroy(ball);
            }
        }
        this.camera.shake(this.balls[0].xv * 2, this.balls[0].yv * 2);
    };
    Level.prototype.reset = function () {
        var i;
        Game.paused = false;
        this.gamestate = Level.gamestates.playing;
        this.deathcount = 0;
        this.ballstill = true;
        this.balls = new Array(1);
        this.balls[0] = new Ball();
        this.player.reset();
        this.blocks = new Array(Level.width * Level.height);
        for (i = 0; i < this.blocks.length; i++) {
            this.blocks[i] = new Block((i % Level.width) * 100 + this.xo, Math.floor(i / Level.width) * 35 + this.yo, this.getColor(i));
        }
    };
    Level.prototype.getColor = function (i) {
        return (i % 9) + 1;
    };
    Level.prototype.render = function () {
        var i;
        this.player.render();
        for (i = 0; i < this.balls.length; i++) {
            this.balls[i].render();
        }
        for (i in this.blocks) {
            if (this.blocks[i].color === 0)
                continue;
            else
                this.blocks[i].render();
        }
        if (this.gamestate === Level.gamestates.lost || this.gamestate === Level.gamestates.won) {
            drawHorizontallyCenteredRectangle(112, 220, 100);
            drawHorizontallyCenteredRectangle(252, 160, 30);
            Game.context.fillStyle = "white";
            Game.context.font = "36px Poiret One";
            var msg = "Game Over!";
            Game.context.fillText(msg, Game.SIZE.w / 2 - Game.context.measureText(msg).width / 2, 150);
            Game.context.font = "28px Poiret One";
            msg = "You " + (this.gamestate === Level.gamestates.won ? "Won!" : "Lost!");
            Game.context.fillText(msg, Game.SIZE.w / 2 - Game.context.measureText(msg).width / 2, 200);
            Game.context.font = "20px Poiret One";
            if (Game.lastTick % 800 > 400)
                Game.context.fillStyle = "grey";
            msg = "Click to restart";
            Game.context.fillText(msg, Game.SIZE.w / 2 - Game.context.measureText(msg).width / 2, 275);
        }
        else if (Game.paused) {
            drawHorizontallyCenteredRectangle(112, 220, 50);
            drawHorizontallyCenteredRectangle(248, 230, 35);
            Game.context.fillStyle = "white";
            Game.context.font = "36px Poiret One";
            var msg = "Paused";
            Game.context.fillText(msg, Game.SIZE.w / 2 - Game.context.measureText(msg).width / 2, 150);
            Game.context.font = "28px Poiret One";
            if (Game.lastTick % 800 > 400)
                Game.context.fillStyle = "grey";
            msg = "Click to unpause";
            Game.context.fillText(msg, Game.SIZE.w / 2 - Game.context.measureText(msg).width / 2, 275);
        }
        else if (this.ballstill) {
            if (Game.lastTick % 1000 > 500)
                Game.context.fillStyle = "grey";
            else
                Game.context.fillStyle = "white";
            Game.context.font = "30px Poiret One";
            var msg = "Click to begin";
            Game.context.fillText(msg, Game.SIZE.w / 2 - Game.context.measureText(msg).width / 2, 380);
        }
        for (i = 0; i < 3 - this.deathcount; i++) {
            Game.infoContext.drawImage(this.heartImg, 25 + i * 40, Game.iSIZE.h / 2 - 16);
        }
        for (var g in this.particleGenerators) {
            this.particleGenerators[g].render();
        }
    };
    Level.width = 6; // how many blocks wide the field is
    Level.height = 8; // how many blocks tall the field is
    Level.gamestates = { playing: -1, lost: 0, won: 1 };
    return Level;
})();
function drawHorizontallyCenteredRectangle(y, w, h) {
    Game.context.fillStyle = "#123";
    Game.context.fillRect(Game.SIZE.w / 2 - w / 2, y, w, h);
    Game.context.strokeStyle = "#EEF";
    Game.context.lineWidth = 2;
    Game.context.strokeRect(Game.SIZE.w / 2 - w / 2, y, w, h);
}
var Block = (function () {
    function Block(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.powerup = Math.floor(Math.random() * 24);
        if (this.powerup > Block.powerups.length - 1) {
            this.powerup = 0;
        }
    }
    Block.loadImages = function () {
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
    };
    Block.prototype.destroy = function (ball) {
        if (this.color === 0)
            return;
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
        Game.level.particleGenerators.push(new ParticleGenerator(this.x + Block.width / 2, this.y, Color.convert(this.color)));
        this.color = 0;
    };
    Block.prototype.render = function () {
        Game.context.drawImage(Block.block_images[this.color], this.x + Game.level.camera.xo, this.y + Game.level.camera.yo);
        if (this.powerup !== 0) {
            Game.context.drawImage(Block.powerup_images[this.powerup], this.x + Block.width / 2 - 7 + Game.level.camera.xo, this.y + 3 + Game.level.camera.yo);
        }
    };
    Block.width = 80;
    Block.height = 20;
    Block.block_images = Array();
    Block.powerups = ["", "bomb", "bigger_paddle", "slice_ball", "extra_ball", "extra_life"];
    Block.powerup_images = Array();
    return Block;
})();
var Paddle = (function () {
    function Paddle() {
        this.biggerTimer = 0;
        this.reset();
        this.img = new Image();
        this.img.src = "res/player_paddle.png";
        this.usingMouseInput = true;
    }
    Paddle.prototype.reset = function () {
        this.x = 270;
        this.y = 450;
        this.width = 180;
        this.height = 25;
        this.maxv = 25;
        this.biggerTimer = 0;
    };
    Paddle.prototype.update = function () {
        this.biggerTimer--;
        if (this.biggerTimer > 0) {
            if (this.biggerTimer < 100) {
                this.width = 180 + this.biggerTimer;
            }
            else {
                this.width = 280;
            }
        }
        else {
            this.width = 180;
        }
        if (Game.level.ballstill && Mouse.ldown) {
            Game.level.balls[0].shoot();
            return;
        }
        if (Game.level.ballstill)
            return;
        var left = !!(Keyboard.keysdown[Keyboard.KEYS.A] || Keyboard.keysdown[Keyboard.KEYS.LEFT]);
        var right = !!(Keyboard.keysdown[Keyboard.KEYS.D] || Keyboard.keysdown[Keyboard.KEYS.RIGHT]);
        var destx = this.x;
        var amount = 0;
        if (this.usingMouseInput) {
            destx = Math.min(Math.max(Mouse.x - this.width / 2, 0), Game.SIZE.w - this.width);
        }
        else {
            if (left) {
                destx = 0;
            }
            else if (right) {
                destx = Game.canvas.width - this.width;
            }
        }
        amount = Math.min(Math.abs(this.x - destx), this.maxv);
        this.x += destx > this.x ? amount : -amount;
    };
    Paddle.prototype.render = function () {
        Game.context.drawImage(this.img, this.x, this.y, this.width, this.height);
    };
    return Paddle;
})();
var Ball = (function () {
    function Ball() {
        this.maxXv = 8;
        this.slices = 0;
        this.reset();
        this.img = new Image();
        this.img.src = "res/ball.png";
        this.img_slicing = new Image();
        this.img_slicing.src = "res/ball_slicing.png";
    }
    Ball.prototype.reset = function () {
        this.x = 360;
        this.y = 440;
        this.xv = 0;
        this.yv = 0;
        this.r = 10;
    };
    Ball.prototype.update = function (player) {
        this.x += this.xv;
        this.y += this.yv;
        this.slices--;
        // check for colisions with player paddle
        if (this.x + this.r > player.x && this.x - this.r < player.x + player.width && this.y + this.r > player.y && this.y - this.r < player.y + player.height) {
            Sound.play(Sound.blip);
            Game.level.camera.shake(this.xv, this.yv);
            this.yv = -this.yv;
            this.y = player.y - this.r;
            this.xv += ((this.x - player.x - player.width / 2) / 100) * 5;
            if (this.xv > this.maxXv)
                this.xv = this.maxXv;
            if (this.xv < -this.maxXv)
                this.xv = -this.maxXv;
            return;
        }
        // check for colisions with window edges
        if (this.x > Game.SIZE.w - this.r) {
            Sound.play(Sound.bloop);
            Game.level.camera.shake(this.xv * 3, this.yv);
            this.xv = -this.xv;
            this.x = Game.SIZE.w - this.r;
        }
        if (this.x < this.r) {
            Sound.play(Sound.bloop);
            Game.level.camera.shake(this.xv * 3, this.yv);
            this.xv = -this.xv;
            this.x = this.r;
        }
        if (this.y < this.r) {
            Sound.play(Sound.bloop);
            Game.level.camera.shake(this.xv, this.yv * 3);
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
                Game.level.camera.shake(this.xv * 2, this.yv);
            }
            if (this.x < Game.level.blocks[c].x) {
                this.xv = -Math.abs(this.xv);
                Game.level.camera.shake(this.xv * 2, this.yv);
            }
            if (this.y > Game.level.blocks[c].y + Block.height) {
                this.yv = Math.abs(this.yv);
                Game.level.camera.shake(this.xv, this.yv * 2);
            }
            if (this.y < Game.level.blocks[c].y) {
                this.yv = -Math.abs(this.yv);
                Game.level.camera.shake(this.xv, this.yv * 2);
            }
        }
    };
    Ball.prototype.collides = function () {
        for (var i in Game.level.blocks) {
            var b = Game.level.blocks[i];
            if (b.color === 0)
                continue;
            if (this.x + this.r > b.x && this.x - this.r < b.x + Block.width && this.y + this.r > b.y && this.y - this.r < b.y + Block.height) {
                Game.level.blocks[i].destroy(this);
                return i;
            }
        }
        return -1;
    };
    Ball.prototype.shoot = function () {
        Game.level.ballstill = false;
        this.yv = -7;
        do {
            this.xv = Math.floor(Math.random() * 10) - 5;
        } while (this.xv >= -1 && this.xv <= 1);
    };
    Ball.prototype.render = function () {
        var x = this.x - this.r + Game.level.camera.xo;
        var y = this.y - this.r + Game.level.camera.yo;
        if (this.slices < 60 && this.slices % 20 < 10) {
            Game.context.drawImage(this.img, x, y);
        }
        else {
            Game.context.drawImage(this.img_slicing, x, y);
        }
    };
    return Ball;
})();
var Mouse = (function () {
    function Mouse() {
    }
    Mouse.update = function (event) {
        var px = Mouse.x, py = Mouse.y;
        Mouse.x = event.clientX - Game.canvasClientRect.left;
        Mouse.y = event.clientY - Game.canvasClientRect.top;
        if (Game.level && !Game.level.player.usingMouseInput && !Game.paused && (Mouse.x != px || Mouse.y != py)) {
            Game.level.player.usingMouseInput = true;
        }
    };
    Mouse.down = function (event) {
        if (event.button === 1 || event.which === 1)
            Mouse.ldown = true;
        else if (event.button === 3 || event.which === 3)
            Mouse.rdown = true;
    };
    Mouse.up = function (event) {
        if (event.button === 1 || event.which === 1)
            Mouse.ldown = false;
        else if (event.button === 3 || event.which === 3)
            Mouse.rdown = false;
    };
    Mouse.x = 0;
    Mouse.y = 0;
    Mouse.ldown = false;
    Mouse.rdown = false;
    return Mouse;
})();
var Sound = (function () {
    function Sound() {
    }
    Sound.init = function () {
        Sound.blip = get('blipSound');
        Sound.bloop = get('bloopSound');
        Sound.die = get('dieSound');
        Sound.boom = get('boomSound');
        Sound.life = get('lifeSound');
        Sound.volumeSlider = get('volumeSlider');
        Sound.changeVolume();
    };
    Sound.changeVolume = function () {
        Sound.volume = Number(Sound.volumeSlider.value) / 100;
    };
    Sound.toggleMute = function () {
        Sound.muted = !Sound.muted;
    };
    Sound.play = function (sound) {
        if (Sound.muted)
            return;
        sound.volume = Sound.volume;
        sound.currentTime = 0;
        sound.play();
    };
    Sound.muted = false;
    Sound.volume = 0.5;
    return Sound;
})();
var ParticleGenerator = (function () {
    function ParticleGenerator(x, y, color) {
        this.particles = new Array();
        var size = new Size();
        size.w = size.h = 6;
        for (var i = 0; i < 25; ++i) {
            this.particles.push(new Particle(this, PARTICLE_TYPE.SQUARE, size, color, x, y, Math.random() * 10 - 5, Math.random() * 10 - 5, 0, 0.5, 45));
        }
    }
    ParticleGenerator.prototype.remove = function (particle) {
        this.particles.splice(this.particles.indexOf(particle));
    };
    ParticleGenerator.prototype.update = function () {
        for (var p in this.particles) {
            this.particles[p].update();
        }
    };
    ParticleGenerator.prototype.render = function () {
        for (var p in this.particles) {
            this.particles[p].render();
        }
    };
    return ParticleGenerator;
})();
var PARTICLE_TYPE;
(function (PARTICLE_TYPE) {
    PARTICLE_TYPE[PARTICLE_TYPE["CIRCLE"] = 0] = "CIRCLE";
    PARTICLE_TYPE[PARTICLE_TYPE["SQUARE"] = 1] = "SQUARE";
})(PARTICLE_TYPE || (PARTICLE_TYPE = {}));
var Size = (function () {
    function Size() {
    }
    return Size;
})();
var Color = (function () {
    function Color(r, g, b) {
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
    }
    Color.convert = function (c) {
        switch (c) {
            case 1:
                return new Color(158, 158, 158);
            case 2:
                return new Color(172, 0, 0);
            case 3:
                return new Color(172, 105, 0);
            case 4:
                return new Color(182, 176, 0);
            case 5:
                return new Color(52, 172, 0);
            case 6:
                return new Color(0, 172, 170);
            case 7:
                return new Color(0, 103, 182);
            case 8:
                return new Color(68, 0, 172);
            case 9:
                return new Color(180, 0, 182);
            default:
                return new Color(0, 0, 0);
        }
    };
    return Color;
})();
var Particle = (function () {
    function Particle(generator, type, size, color, x, y, xv, yv, xa, ya, life) {
        this.generator = generator;
        this.type = type;
        this.size = size;
        this.color = color;
        this.x = x;
        this.y = y;
        this.xv = xv;
        this.yv = yv;
        this.xa = xa;
        this.ya = ya;
        this.life = life;
        this.startingLife = life;
    }
    Particle.prototype.update = function () {
        this.life--;
        if (this.life < 0) {
            this.generator.remove(this);
            return;
        }
        this.xv += this.xa;
        this.yv += this.ya;
        this.x += this.xv;
        this.y += this.yv;
    };
    Particle.prototype.render = function () {
        var x = this.x + Game.level.camera.xo;
        var y = this.y + Game.level.camera.yo;
        Game.context.fillStyle = "rgba(" + this.color.r + ", " + this.color.g + ", " + this.color.b + ", " + (this.life / this.startingLife) + ")";
        if (this.type === PARTICLE_TYPE.SQUARE) {
            Game.context.fillRect(x, y, this.size.w, this.size.h);
        }
        else if (this.type === PARTICLE_TYPE.CIRCLE) {
            Game.context.arc(x, y, this.size.r, 0, 0);
        }
    };
    return Particle;
})();
var Camera = (function () {
    function Camera() {
        this.xo = 0;
        this.yo = 0;
        this.shakeX = 0;
        this.shakeY = 0;
    }
    Camera.prototype.update = function () {
        this.shakeX *= 0.90;
        this.shakeY *= 0.90;
        if (this.shakeX < 0.001) {
            this.shakeX = 0;
        }
        if (this.shakeY < 0.001) {
            this.shakeY = 0;
        }
        this.xo = this.shakeX;
        this.yo = this.shakeY;
    };
    Camera.prototype.shake = function (amountX, amountY) {
        this.shakeX = (Math.random() * amountX) * (Math.random() > 0.5 ? 1 : -1);
        this.shakeY = (Math.random() * amountY) * (Math.random() > 0.5 ? 1 : -1);
    };
    return Camera;
})();
// class BallCollideParticle extends Particle {
//     constructor(generator: ParticleGenerator, type: PARTICLE_TYPE, size: Size, x: number, y: number, xv: number, yv: number, xa: number, ya: number, life: number) {
//         super(generator, type, size, x, y, xv, ya, xa, ya, life);
//     }
//     render() {
//     }
// }
var Keyboard = (function () {
    function Keyboard() {
    }
    Keyboard.keychange = function (event, down) {
        var keycode = event.keyCode ? event.keyCode : event.which;
        Keyboard.keysdown[keycode] = down;
        if (down && keycode === Keyboard.KEYS.ESC) {
            Game.togglePause();
            if (Game.level.ballstill)
                Game.paused = false;
        }
        if (keycode === Keyboard.KEYS.A || keycode === Keyboard.KEYS.D || keycode === Keyboard.KEYS.LEFT || keycode === Keyboard.KEYS.RIGHT) {
            Game.paused = false;
            Game.level.player.usingMouseInput = false;
        }
        if (keycode === Keyboard.KEYS.SPACE) {
            if (Game.level.ballstill) {
                Game.level.balls[0].shoot();
            }
        }
    };
    Keyboard.KEYS = {
        BACKSPACE: 8, TAB: 9, RETURN: 13, ESC: 27, SPACE: 32, PAGEUP: 33, PAGEDOWN: 34, END: 35, HOME: 36, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, INSERT: 45, DELETE: 46, ZERO: 48, ONE: 49, TWO: 50, THREE: 51, FOUR: 52, FIVE: 53, SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57, A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90, TILDE: 192, SHIFT: 999
    };
    Keyboard.keysdown = [];
    return Keyboard;
})();
function keydown(event) {
    Keyboard.keychange(event, true);
    if (event.keyCode === Keyboard.KEYS.SPACE)
        return false;
}
function keyup(event) {
    Keyboard.keychange(event, false);
}
window.onkeydown = keydown;
window.onkeyup = keyup;
function toggleFooter(which) {
    var front = '1', back = '0', about = get('aboutFooter');
    if (which === 'about') {
        if (about.className === 'short') {
            about.style.zIndex = front;
            about.className = 'long';
        }
        else {
            about.className = 'short';
        }
    }
}
window.onload = function () {
    Block.loadImages();
    Sound.init();
    Game.init();
};
