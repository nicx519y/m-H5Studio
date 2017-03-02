import { Injectable, Output, EventEmitter } from '@angular/core';
import { PageModel } from './models';
import * as Immutable from 'immutable';
import { List, Map, Record } from 'immutable';

@Injectable()
export class PagesService {

	private _data: List<PageModel> = Immutable.List<PageModel>();
	private _dataIndexes: Map<string, number> = Immutable.Map<string, number>();
	public activePageId: string = '';

	constructor() {

	}

	public getData(): List<PageModel> {
		return this._data;
	}

	public setData(options: List<PageModel>) {
		this._data = options;
	}

	public getPage(index: number): PageModel {
		return this._data.get(index);
	}

	public getPageById(pageId: string): PageModel {
		return this._data.find(page => page.get('id') === pageId);
	}

	public setPage(page: PageModel, index: number) {
		if(this._data.has(index))
			this._data = this._data.set(index, page);
	}

	public setPageById(page: PageModel, pageId: string) {
		this._data = this._data.set(this._data.findIndex(page => page.get('id') === pageId), page);
	}

	public addPage(page: PageModel, index: number = -1) {
		if(index >= 0 && index < this._data.size){
			this._data = this._data.insert(index, page);
		} else {
			this._data = this._data.push(page);
		}
	}

	public removePage(index: number) {
		if(index >= 0 && index <= this._data.size - 1) {
			this._data = this._data.delete(index);
		}
	}

	public swapPages(index1: number, index2: number) {
		if(this._data.has(index1) && this._data.has(index2)) {
			let page1 = this._data.get(index1);
			let page2 = this._data.get(index2);
			this._data = this._data.set(index2, page1).set(index1, page2);
		}
	}

	public upPage(index: number) {
		this.swapPages(index, index - 1);
	}

	public downPage(index: number) {
		this.swapPages(index, index + 1);
	}

	public createIndexes() {
		this._dataIndexes = this._dataIndexes.clear();
		this._data.forEach((page, key) => this._dataIndexes = this._dataIndexes.set(page.get('id'), key));
	}

	public findPageByIndexes(id: string): PageModel {
		return this._data.get(this._dataIndexes.get(id));
	}

}