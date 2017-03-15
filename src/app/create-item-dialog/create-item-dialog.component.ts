import * as Immutable from 'immutable';
import { List, Map, Record } from 'immutable';
import { Component, OnInit, ChangeDetectionStrategy, } from '@angular/core';
import { MF, ItemModel, ItemType, PageModel, ElementModel, ElementType } from '../models';
import { ItemsService } from '../items.service';
import { MdDialog, MdDialogRef } from '@angular/material';

@Component({
	templateUrl: './create-item-dialog.component.html',
	styleUrls: ['./create-item-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateItemDialogComponent implements OnInit {

	private itemName: string = '';
	private itemType: ItemType = ItemType.movieclip;

	constructor(
		private service: ItemsService,
		private dialog: MdDialog,
		private dref: MdDialogRef<CreateItemDialogComponent>,
	) { 

	}

	private addNewEmptyItem(value: { name: string, type: ItemType }) {
		let source: any;
		if(value.type == ItemType.movieclip) {
			source = MF.g(PageModel, {
				name: value.name
			});
		}
		let newItem: ItemModel = MF.g(ItemModel, {
			name: value.name,
			type: Number(value.type),
			source: source,
		});
		this.service.addItem(newItem);
		this.dref.close();
	}

	ngOnInit() {

	}

}
