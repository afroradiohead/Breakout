import { GameInstance } from './Game';
export class Mouse {

    static x: number = 0;
    static y: number = 0;
    static ldown: boolean = false;
    static rdown: boolean = false;

    static update(event: MouseEvent) {
        var px = Mouse.x,
            py = Mouse.y;
        Mouse.x = event.clientX - GameInstance.canvasClientRect.left;
        Mouse.y = event.clientY - GameInstance.canvasClientRect.top;

        if (GameInstance.level && !GameInstance.level.player.usingMouseInput && !GameInstance.paused && (Mouse.x != px || Mouse.y != py)) {
            GameInstance.level.player.usingMouseInput = true;
        }
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