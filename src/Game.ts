import { Level, UTILS} from './imports';

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

    stage: UTILS.CREATEJS.Stage;
    init() {
        this.canvas = <HTMLCanvasElement>UTILS.getHtmlElementById('gameCanvas');
        this.canvas.width = 720;
        this.canvas.height = 480;
        this.context = this.canvas.getContext('2d');
        this.stage = new UTILS.CREATEJS.Stage("gameCanvas");
        

        // this.stage.gra
                // this.context.fillStyle = "#0e132e";
        // this.context.fillRect(0, 0, this.SIZE.w, this.SIZE.h);

        // // Background colour
        // this.infoContext.fillStyle = "#262d59";
        // this.infoContext.fillRect(0, 0, this.iSIZE.w, this.iSIZE.h);

        // // Black line
        // this.infoContext.fillStyle = "#001";
        // this.infoContext.fillRect(0, this.iSIZE.h - 2, this.iSIZE.w, 2);

        this.infoCanvas = <HTMLCanvasElement>UTILS.getHtmlElementById('infoCanvas');
        this.infoCanvas.width = 720;
        this.infoCanvas.height = 80;
        this.infoContext = (<HTMLCanvasElement>UTILS.getHtmlElementById('infoCanvas')).getContext('2d');
        this.canvasClientRect = this.canvas.getBoundingClientRect();
        this.SIZE = { w: this.canvas.width, h: this.canvas.height };
        this.iSIZE = { w: this.infoContext.canvas.width, h: this.infoContext.canvas.height };

        this.lastTick = Math.floor(performance.now()); // we'll only ever be adding whole numbers to this, no point in storing floating point value
        this.lastRender = this.lastTick; //Pretend the first draw was on first update.
        this.tickLength = 17;

       
        
        const top = new UTILS.CREATEJS.Shape();   
        top.graphics.beginFill("#0e132e").drawRect(0, 0, this.iSIZE.w, this.iSIZE.h);     
        const background = new UTILS.CREATEJS.Shape();
        background.graphics.beginFill("#262d59").drawRect(0, 0, this.SIZE.w, this.SIZE.h);
        
 

        const blackLine = new UTILS.CREATEJS.Shape();    
        top.graphics.beginFill("#001").drawRect(0, this.iSIZE.h - 2, this.iSIZE.w, 2);

        this.stage.addChild(background);
        this.stage.addChild(top);
        this.stage.addChild(blackLine);

        this.level = new Level();

        
        UTILS.CREATEJS.Ticker.addEventListener("tick", (e) => {
            this.level.update();
            this.stage.update();
        });
    }

    togglePause() {
        this.paused = !this.paused;
    }
}

export const GameInstance = new Game();
