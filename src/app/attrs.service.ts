import { Injectable, Output, EventEmitter } from '@angular/core';
import { ElementModel, ElementStateModel } from './models';
import * as Immutable from 'immutable';
import { List, Map, Record } from 'immutable';

export enum AttrsMod {
	none,
	elementProperty,
	fontSetting,
	MultiProperties,
};

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

}