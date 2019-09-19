import { Particle, Color, Size, PARTICLE_TYPE } from "./imports";
import { UTILS } from "./utils";

const size = new Size();
size.w = size.h = 6;
export class ParticleGenerator {
	
    particles: Particle[] = UTILS.LODASH.times(25, () => {
		return new Particle(this, PARTICLE_TYPE.SQUARE, size, this.color, this.x, this.y, Math.random() * 10 - 5, Math.random() * 10 - 5, 0, 0.5, 45)
	});

    constructor(public x: number, public y: number, public color: Color) {
		
    }

    remove(particle: Particle) {
        this.particles.splice(this.particles.indexOf(particle));
    }

    update() {
        this.particles.forEach(p => p.update());
    }

    render() {
        this.particles.forEach(p => p.render());
    }
}