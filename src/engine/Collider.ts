export namespace Collider {
	export interface IRectangle{
		collider : {
			x: number;
			y: number;
			width: number;
			height: number;
		}
	}

	export interface ICircle{
		collider : {
			x: number;
			y: number;
			r: number;
		}
	}

	export type TShape = ICircle | IRectangle;

	//@todo make it shape agnostic
	export function checkCollision(shape1: IRectangle, shape2: ICircle): boolean{
		return shape2.collider.x + shape2.collider.r > shape1.collider.x 
			&& shape2.collider.x - shape2.collider.r < shape1.collider.x + shape1.collider.width 
			&& shape2.collider.y + shape2.collider.r > shape1.collider.y 
			&& shape2.collider.y - shape2.collider.r < shape1.collider.y + shape1.collider.height;
	}
}