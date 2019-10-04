import { UTILS } from "../utils";


export namespace Event {
	export namespace Annotation {
		export function OnTick() {
			return function(target: any, _propertyKey: string | symbol, descriptor: PropertyDescriptor) {
				subject.pipe(UTILS.RXJSOperators.filter(event => event.name === name)).subscribe((e) => {
					descriptor.value(e.instance);
				})
				return descriptor;
			}
		}
	}
	export const subject = new UTILS.RXJS.Subject<{
		name: any;
		instance: any
	}>();
	export interface IObject<TEvents> {
		EVENTS: TEvents;
	}
	export function ListenTo<T extends IObject<any>>(name: T['EVENTS']) {
		return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
			subject.pipe(UTILS.RXJSOperators.filter(event => event.name === name)).subscribe((e) => {
				descriptor.value.call(target, e.instance);
			})
			return descriptor;
		}
	}
	
	export function listen<T extends IObject<any>>(name: T['EVENTS']): UTILS.RXJS.Observable<T>{
		return subject.pipe(
			UTILS.RXJSOperators.filter(event => event.name === name),
			UTILS.RXJSOperators.map(event => event.instance)
		);
	}
	export function emit<T>(instance: IObject<T>, name: T) {
		subject.next({
			name: name,
			instance: instance
		});
	}
	
}

