import { Subject as rxSubject, Observable as rxObservable} from 'rxjs';
import * as rx from "rxjs";
import * as rop from "rxjs/operators";
import { filter as rxfilter} from "rxjs/operators"
import { sample as _sample, times as _times, memoize as _memoize} from "lodash";
import { Memoize as _dMemoize, MemoizeAll } from "lodash-decorators"
import * as createjs from "createjs-module";
import * as _ from "lodash";



export namespace UTILS {
	export import CREATEJS = createjs;
	export import RXJS = rx;
	export import RXJSOperators = rop;
	export import LODASH = _;
	
	// export namespace LODASH {
	// 	export namespace DECORATORS {
	// 		export const Memoize = _dMemoize;
	// 	}

	// }

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
