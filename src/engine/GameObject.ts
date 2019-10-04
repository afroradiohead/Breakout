import { UTILS } from "../utils";

export interface GameObject {
	onTick?: () => void
	onDestroy?: () => void
}
export namespace GameObject {
	const OBJECT_LIST:GameObject[] = [];
	UTILS.CREATEJS.Ticker.addEventListener("tick", (e) => {
		UTILS.LODASH.invokeMap(OBJECT_LIST, "onTick");
	});
	export function register(object: GameObject){
		OBJECT_LIST.push(object);
	}

	export function unregister(object: GameObject) {
		UTILS.LODASH.invoke(object, "onDestroy");
		UTILS.LODASH.remove(OBJECT_LIST, object);
	}
}