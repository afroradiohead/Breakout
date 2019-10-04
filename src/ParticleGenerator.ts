import { Particle, Color, Size, PARTICLE_TYPE } from "./imports";
import { UTILS } from "./utils";

const size = new Size();
size.w = size.h = 6;
export class ParticleGenerator {
	
    particles: Particle[] = [];

    constructor(public x: number, public y: number, public color: Color) {
		this.particles = UTILS.LODASH.times(25, () => {
            return new Particle({
                generator: this, 
                type: PARTICLE_TYPE.SQUARE, 
                size: size, 
                color: color, 
                x: this.x, 
                y: this.y, 
                xv: Math.random() * 10 - 5, 
                yv: Math.random() * 10 - 5, 
                xa: 0, 
                ya: 0.5, 
                life: 45
            })
        });
    }

    update() {
 
    }

    render() {
        // this.particles.forEach(p => p.render());
    }
}