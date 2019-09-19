import { UTILS } from "./utils";

const subject = new UTILS.RXJS.Subject<{
	name: any;
	instance: any
}>();

export abstract class Base<TEvents> {
	public EVENTS: TEvents;

	// public abstract destroy(): void;
	
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