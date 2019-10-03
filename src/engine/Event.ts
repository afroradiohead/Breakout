import { UTILS } from "../utils";


export namespace Event {
	export const subject = new UTILS.RXJS.Subject<{
		name: any;
		instance: any
	}>();
	export interface IObject {
		EVENTS: any;
	}
	export function ListenTo<T extends IObject>(name: T['EVENTS']) {
		return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
			subject.pipe(UTILS.RXJS.filter(event => event.name === name)).subscribe((e) => {
				descriptor.value(e.instance);
			})
			return descriptor;
		}
	}
}

