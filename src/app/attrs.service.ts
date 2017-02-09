import { Injectable, Output, EventEmitter } from '@angular/core';
import { ElementModel, ElementStateModel } from './models';
import * as Immutable from 'immutable';
import { List, Map, Record } from 'immutable';

export enum AttrsMod {
	none,
	elementProperty,
	MultiProperties,
	fontSetting,
};

export enum AlignMode {
	top,
	middle,
	bottom,
	left,
	center,
	right
}

export class ElementWithBounds {
	x: number = 0;
	y: number = 0;
	bounds: {
		x: number,
		y: number,
		width: number,
		height: number,
	} = {
		x: 0,
		y: 0,
		width: 0,
		height: 0,
	};
	constructor(options: {
		x?: number,
		y?: number,
		bounds?: {
			x: number,
			y: number,
			width: number,
			height: number,
		}
	}) {
		this.x = options.x || 0;
		this.y = options.y || 0;
		options.bounds && (this.bounds = options.bounds);
	}
}

@Injectable()
export class AttrsService {
	public mod: AttrsMod = AttrsMod.none;
	private model: Map<string, any> = Immutable.Map<string, any>();

	constructor() {

	}

	public getData(): Map<string, any> {
		return this.model;
	}

	public setData(data: Map<string, any>) {
		this.model = data;
	}

	public clearData() {
		this.model = Immutable.Map<string, any>();
	}

	/**
	 * 单元素对齐
	 */
	private singleAlign(element: ElementWithBounds, target: number, mode: AlignMode = AlignMode.top): ElementWithBounds {
		let result = element;
		switch(mode) {
			case AlignMode.top:
				result.y -= element.bounds.y - target;
				break;
			case AlignMode.middle:
				result.y -= element.bounds.y + element.bounds.height / 2 - target;
				break;
			case AlignMode.bottom:
				result.y -= element.bounds.y + element.bounds.height - target;
				break;
			case AlignMode.left:
				result.x -= element.bounds.x - target;
				break;
			case AlignMode.center:
				result.x -= element.bounds.x + element.bounds.width / 2 - target;
				break;
			case AlignMode.right:
				result.x -= element.bounds.x + element.bounds.width - target;
				break;
		}

		return result;
	}

	/**
	 * 多元素对齐
	 */
	private multiAlign(selection: ElementWithBounds[], mode: AlignMode = AlignMode.top) {
		let target: number;
		switch(mode) {
			case AlignMode.top:
				target = Math.min.apply(null, selection.map(ele => ele.y));
				break;
			case AlignMode.middle:
				let top: number = Math.min.apply(null, selection.map(ele => ele.bounds.y));
				let bottom: number = Math.max.apply(null, selection.map(ele => ele.bounds.y + ele.bounds.height));
				target = (top + bottom) / 2;
				break;
			case AlignMode.bottom:
				target = Math.max.apply(null, selection.map(ele => ele.bounds.y + ele.bounds.height));
				break;
			case AlignMode.left:
				target = Math.min.apply(null, selection.map(ele => ele.bounds.x));
				break;
			case AlignMode.center:
				break;
			case AlignMode.bottom:
				break;
		}
	}

}