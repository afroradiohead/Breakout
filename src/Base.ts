import { UTILS } from "./utils";
import { GameEvent } from "./engine/annotations/GameEvent";

const subject = GameEvent.subject;



export abstract class Base<TEvents> {
	public EVENTS: TEvents;

	
	public emit(name: TEvents){
		subject.next({
			name: name,
			instance: this
		});
	}

	listen<T extends Base<TEvents>>(name: T['EVENTS']): UTILS.RXJS.Observable<{name: string; instance: T}> {
		return subject.pipe(UTILS.RXJS.filter(event => event.name === name)) ;
	}
}


export namespace Base {
	
	export interface IBoundingBox {
		boundingBox: {
			x: number;
			y: number;
			width: number;
			height: number;
			r?: number
		}
	}
}