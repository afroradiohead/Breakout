import { Subject as rxSubject, Observable as rxObservable} from 'rxjs';
import { filter as rxfilter} from "rxjs/operators"
import { sample as _sample, times as _times } from "lodash";

export namespace UTILS {
	export namespace RXJS {
		export class Subject<T> extends rxSubject<T>{};
		export class Observable<T> extends rxObservable<T>{};
		export const filter = rxfilter;
	}

	export namespace LODASH {
		export const sample = _sample;
		export const times = _times;
	}

	export function generateImageElement(config: {src: string}): HTMLImageElement{
		if(config.src){
			const image = new Image();
			image.src = config.src;
			return image;
		}
		return null
	}

	export function getHtmlElementById(id: string): HTMLElement {
		return document.getElementById(id);
	}
}


export function generateImageElement(config: {src: string}): HTMLImageElement{
	if(config.src){
		const image = new Image();
		image.src = config.src;
		return image;
	}
	return null
}