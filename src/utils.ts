import { Subject as rxSubject, Observable as rxObservable} from 'rxjs';
import { filter as rxfilter} from "rxjs/operators"
import { sample as _sample, times as _times, memoize as _memoize} from "lodash";
import { Memoize as _dMemoize, MemoizeAll } from "lodash-decorators"
import * as createjs from "createjs-module";



export namespace UTILS {
	export import CREATEJS = createjs;
	export namespace RXJS {
		export class Subject<T> extends rxSubject<T>{};
		export class Observable<T> extends rxObservable<T>{};
		export const filter = rxfilter;
	}

	export namespace LODASH {
		export namespace DECORATORS {
			export const Memoize = _dMemoize;
		}
		export const sample = _sample;
		export const times = _times;
		export const memoize = _memoize;
	}

	export const generateImageElement = LODASH.memoize((config: {src: string}): HTMLImageElement => {
		if(config.src){
			const image = new Image();
			image.src = config.src;
			return image;
		}
		return null
	}, JSON.stringify);

	export function getHtmlElementById(id: string): HTMLElement {
		return document.getElementById(id);
	}
}
