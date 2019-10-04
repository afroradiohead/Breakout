import { UTILS } from "./utils";
import { Event } from "./engine/Event";

const subject = Event.subject;



export abstract class Base<TEvents> {
	public EVENTS: TEvents;

	
	public emit(name: TEvents){
		subject.next({
			name: name,
			instance: this
		});
	}

	listen<T extends Base<TEvents>>(name: T['EVENTS']): UTILS.RXJS.Observable<{name: string; instance: T}> {
		return subject.pipe(UTILS.RXJSOperators.filter(event => event.name === name)) ;
	}
}


