import { Level } from './level';
import { getHtmlElementById } from "./utils";

export class Game {
    SIZE: { w: number, h: number }; // size of gameCanvas
    iSIZE: { w: number, h: number }; // size of infoCanvas

    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D; // context for the gameCanvas
    infoCanvas: HTMLCanvasElement;
    infoContext: CanvasRenderingContext2D; // context for the infoCanvas
    canvasClientRect = { left: 0, top: 0 }; // used by the mouse class to determine mouse's relative position to the canvas

    public level: Level;
    public paused: boolean = false;

    lastTick: number;
    lastRender: number;
    tickLength: number;

    font36 = "36px Poiret One";
    font30 = "30px Poiret One";
    font28 = "28px Poiret One";
    font20 = "20px Poiret One";

    init() {
        this.canvas = <HTMLCanvasElement>getHtmlElementById('gameCanvas');
        this.canvas.width = 720;
        this.canvas.height = 480;
        this.context = this.canvas.getContext('2d');

        this.infoCanvas = <HTMLCanvasElement>getHtmlElementById('infoCanvas');
        this.infoCanvas.width = 720;
        this.infoCanvas.height = 80;
        this.infoContext = (<HTMLCanvasElement>getHtmlElementById('infoCanvas')).getContext('2d');
        this.canvasClientRect = this.canvas.getBoundingClientRect();
        this.SIZE = { w: this.canvas.width, h: this.canvas.height };
        this.iSIZE = { w: this.infoContext.canvas.width, h: this.infoContext.canvas.height };

        this.lastTick = Math.floor(performance.now()); // we'll only ever be adding whole numbers to this, no point in storing floating point value
        this.lastRender = this.lastTick; //Pretend the first draw was on first update.
        this.tickLength = 17;

        this.level = new Level();
        this.loop(performance.now());
    }

    loop(delta: number) {
        window.requestAnimationFrame(this.loop.bind(this));
        const nextTick = this.lastTick + this.tickLength;
        let numTicks = 0;

        if (delta > nextTick) {
            var timeSinceTick = delta - this.lastTick;
            numTicks = Math.floor(timeSinceTick / this.tickLength);
        }

        this.queueUpdates(numTicks);
        this.render();
        this.lastRender = delta;
    }

    queueUpdates(numTicks: number) {
        for (var i = 0; i < numTicks; i++) {
            this.lastTick = this.lastTick + this.tickLength; //Now lastTick is this tick.
            this.update(this.lastTick);
        }
    }

    update(tickCount: number) {
        this.level.update();
    }

    render() {
        this.context.fillStyle = "#0e132e";
        this.context.fillRect(0, 0, this.SIZE.w, this.SIZE.h);

        // Background colour
        this.infoContext.fillStyle = "#262d59";
        this.infoContext.fillRect(0, 0, this.iSIZE.w, this.iSIZE.h);

        // Black line
        this.infoContext.fillStyle = "#001";
        this.infoContext.fillRect(0, this.iSIZE.h - 2, this.iSIZE.w, 2);

        this.level.render();
    }

    togglePause() {
        this.paused = !this.paused;
    }
}

export const GameInstance = new Game();
