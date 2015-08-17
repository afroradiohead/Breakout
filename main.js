function get(what) {
    return document.getElementById(what);
}
var Game = (function () {
    function Game() {
    }
    Game.init = function () {
        Game.context = get('gameCanvas').getContext('2d');
        Game.infoContext = get('infoCanvas').getContext('2d');
        Game.SIZE = { w: Game.context.canvas.width, h: Game.context.canvas.height };
        Game.iSIZE = { w: Game.infoContext.canvas.width, h: Game.infoContext.canvas.height };
        Game.level = new Level();
        Game.lastTick = Math.floor(performance.now());
        Game.lastRender = Game.lastTick;
        Game.tickLength = 17;
        Game.loop(performance.now());
    };
    Game.loop = function (tFrame) {
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
    };
    Game.queueUpdates = function (numTicks) {
        for (var i = 0; i < numTicks; i++) {
            Game.lastTick = Game.lastTick + Game.tickLength;
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
    return Game;
})();
var Level = (function () {
    function Level() {
        this.ballstill = true;
        this.deathcount = 0;
        this.player = new Paddle();
        this.ball = new Ball();
        this.xo = 70;
        this.yo = 25;
        this.heartImg = new Image();
        this.heartImg.src = "res/heart.png";
        this.reset();
    }
    Level.prototype.getType = function (i, pattern) {
        if (!pattern)
            pattern = 6;
        switch (pattern) {
            case 0:
                return (i % 2 - Math.floor(i / 6) % 2) === 0 ? 1 : 2;
            case 1:
                return i % 6 + 2;
            case 2:
                return Math.floor(i / 6) + 2;
            case 3:
                return 7 - Math.floor(i / 6) + 2;
            case 4:
                return (Math.floor(i / 6) + i % 6) % 8 + 2;
            case 5:
                return (Math.floor(i / 6) + (8 - i % 6)) % 8 + 2;
            case 6:
                return Math.floor(Math.random() * 8) + 2;
            default:
                console.error("invalid number passed to Level.getType: ", pattern);
                return i % 6 + 1;
        }
    };
    Level.prototype.update = function () {
        if (this.gamestate === Level.gamestates.playing) {
            this.player.update();
            this.ball.update(this.player);
            if (this.checkBoardWon()) {
                this.deathcount--;
                this.die();
                this.gamestate = Level.gamestates.won;
            }
        }
        else {
            if (Mouse.ldown) {
                this.reset();
            }
        }
    };
    Level.prototype.checkBoardWon = function () {
        for (var i in this.blocks) {
            if (this.blocks[i].type !== 0)
                return false;
        }
        return true;
    };
    Level.prototype.die = function () {
        this.ball.reset();
        this.player.reset();
        this.ballstill = true;
        this.deathcount++;
        if (this.deathcount >= 3) {
            this.gamestate = Level.gamestates.lost;
        }
    };
    Level.prototype.reset = function () {
        this.gamestate = Level.gamestates.playing;
        this.deathcount = 0;
        this.ballstill = true;
        this.player.reset();
        this.ball.reset();
        this.blocks = new Array(48);
        for (var i = 0; i < this.blocks.length; i++) {
            this.blocks[i] = new Block((i % 6) * 100 + this.xo, Math.floor(i / 6) * 35 + this.yo, this.getType(i, 3));
        }
    };
    Level.prototype.render = function () {
        var i;
        this.player.render();
        this.ball.render();
        for (i in this.blocks) {
            if (this.blocks[i].type === 0)
                continue;
            else
                this.blocks[i].render();
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
                if (Game.lastTick % 800 > 400)
                    Game.context.fillStyle = "grey";
                msg = "Click to restart";
                Game.context.fillText(msg, Game.SIZE.w / 2 - Game.context.measureText(msg).width / 2, 275);
                break;
        }
        for (i = 0; i < 3 - this.deathcount; i++) {
            Game.infoContext.drawImage(this.heartImg, 25 + i * 40, Game.iSIZE.h / 2 - 16);
        }
    };
    Level.gamestates = { playing: -1, lost: 0, won: 1 };
    return Level;
})();
var Block = (function () {
    function Block(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }
    Block.loadImages = function () {
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
    };
    Block.prototype.render = function () {
        Game.context.drawImage(Block.images[this.type], this.x, this.y);
    };
    Block.width = 80;
    Block.height = 20;
    Block.images = Array();
    return Block;
})();
var Paddle = (function () {
    function Paddle() {
        this.reset();
        this.img = new Image();
        this.img.src = "res/player_paddle.png";
    }
    Paddle.prototype.reset = function () {
        this.x = 270;
        this.y = 450;
        this.width = 180;
        this.height = 25;
        this.maxv = 25;
    };
    Paddle.prototype.update = function () {
        if (Game.level.ballstill && Mouse.ldown) {
            Game.level.ballstill = false;
            Game.level.ball.yv = -7;
            do {
                Game.level.ball.xv = Math.floor(Math.random() * 10) - 5;
            } while (Game.level.ball.xv >= -1 && Game.level.ball.xv <= 1);
            return;
        }
        if (Game.level.ballstill)
            return;
        var destx = Math.min(Math.max(Mouse.x - this.width / 2, 0), Game.SIZE.w - this.width);
        var amount = Math.min(Math.abs(this.x - destx), this.maxv);
        this.x += destx > this.x ? amount : -amount;
    };
    Paddle.prototype.render = function () {
        Game.context.drawImage(this.img, this.x, this.y);
    };
    return Paddle;
})();
var Ball = (function () {
    function Ball() {
        this.reset();
        this.img = new Image();
        this.img.src = "res/ball.png";
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
        if (this.x + this.r > player.x && this.x - this.r < player.x + player.width && this.y + this.r > player.y && this.y - this.r < player.y + player.height) {
            Sound.play(Sound.blip);
            this.yv = -this.yv;
            this.y = player.y - this.r;
            this.xv += ((this.x - player.x - player.width / 2) / 100) * 5;
            return;
        }
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
    };
    Ball.prototype.collides = function () {
        for (var i in Game.level.blocks) {
            var b = Game.level.blocks[i];
            if (b.type === 0)
                continue;
            if (this.x + this.r > b.x && this.x - this.r < b.x + Block.width && this.y + this.r > b.y && this.y - this.r < b.y + Block.height) {
                Game.level.blocks[i].type = 0;
                return i;
            }
        }
        return -1;
    };
    Ball.prototype.render = function () {
        Game.context.drawImage(this.img, this.x - this.r, this.y - this.r);
    };
    return Ball;
})();
var Mouse = (function () {
    function Mouse() {
    }
    Mouse.update = function (event) {
        Mouse.x = event.clientX - get('gameCanvas').getBoundingClientRect().left;
        Mouse.y = event.clientY - get('gameCanvas').getBoundingClientRect().top;
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
    Sound.changeVolume = function () {
        Sound.volume = Number(get('volumeSlider').value) / 100;
    };
    Sound.toggleMute = function () {
        Sound.muted = !Sound.muted;
    };
    Sound.play = function (sound) {
        if (Sound.muted)
            return;
        get(sound).volume = Sound.volume;
        get(sound).currentTime = 0;
        get(sound).play();
    };
    Sound.blip = 'blipSound';
    Sound.bloop = 'bloopSound';
    Sound.die = 'dieSound';
    Sound.muted = false;
    Sound.volume = 0.5;
    return Sound;
})();
window.onload = function () {
    Block.loadImages();
    Game.init();
};
