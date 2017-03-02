import { Injectable, Output, EventEmitter } from '@angular/core';
import { ItemModel, ItemType, BitmapModel, PageModel, MF } from './models';

import * as Immutable from 'immutable';
import { List, Map, Record } from 'immutable';

@Injectable()
export class ItemsService {

	private _data: List<ItemModel> = Immutable.List<ItemModel>();
	private _dataIndexes: Map<string, number> = Immutable.Map<string, number>();
	private _active: number = -1;

	constructor() {

	}

	public setData(data: List<ItemModel>) {
		this._data = data;
	}

	public getData() {
		return this._data;
	}

	public set active(index: number) {
		if(this._data.has(index)) {
			this._active = index;
		} else {
			this._active = -1;
		}
	}

	public get active(): number {
		return this._active;
	}

	public setItem(item: ItemModel, index: number) {
		if(this._data.has(index))
			this._data = this._data.set(index, item);
	}

	public getItem(index: number): ItemModel {
		return this._data.get(index);
	}

	public getItemById(itemId: string): ItemModel {
		return this._data.find(item => item.get('id') === itemId);
	}

	public setItemById(data: ItemModel, itemId: string) {
		this.setData(
			this._data.set(this._data.findIndex(item => item.get('id') === itemId), data)
		);
	}

	public removeItem(index: number) {
		this._data = this._data.delete(index);
	}

	public addItem(item: ItemModel, index: number = -1) {
		if(index >= 0 && index < this._data.size) {
			this._data = this._data.insert(index, item);
		} else {
			this._data = this._data.push(item);
		}
	}

	public addItems(items: List<ItemModel>, index: number = -1) {
		if(items.size <= 0) return;
		let data = this._data;
		let idx: number = index;
		if(index < 0 || index > this._data.size)
			idx = this._data.size;

		items.forEach(item => {
			data = data.insert(idx, item);
			idx ++;
		});

		this._data = data;
	}

	public addMovieClips(pages: List<PageModel>) {
		let items = pages.map(page => MF.g(ItemModel, {
			name: page.get('name'),
			type: ItemType.movieclip,
			thumbnail: '',
			source: pages,
		}));
		this.addItems(items as List<ItemModel>);
	}

	public addBitmaps(bitmaps: List<BitmapModel>) {
		let items = bitmaps.map(bitmap => MF.g(ItemModel, {
			name: bitmap.get('name'),
			type: ItemType.bitmap,
			thumbnail: bitmap.get('url'),
			source: bitmap,
		}));
		this.addItems(items as List<ItemModel>);
	}

	/**
	 * 建立id=>index索引
	 */
	public createIndexes() {
		this._dataIndexes = this._dataIndexes.clear();
		this._data.forEach((item, key) => this._dataIndexes = this._dataIndexes.set(item.get('id'), key));
	}

	/**
	 * 通过索引查找元素
	 */
	public findItemByIndexes(id: string): ItemModel {
		return this._data.get(this._dataIndexes.get(id));
	}
}