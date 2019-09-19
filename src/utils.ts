export {sample} from "lodash"

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
