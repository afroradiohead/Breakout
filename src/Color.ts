export class Color {
    r: number;
    g: number;
    b: number;

    constructor(r?: number, g?: number, b?: number) {
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
    }

    static convert(c: number): Color {
        switch(c) {
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
    }
}