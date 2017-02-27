import {
	Component,
	Optional,
	ViewChild,
	Output,
	EventEmitter,
	QueryList,
	ElementRef,
	ViewChildren,
	Input,
	OnInit,
	ChangeDetectionStrategy,
} from '@angular/core';
import { ItemsService } from '../items.service';
import { TimelineService } from '../timeline.service';
import { MF, ItemModel, ItemType, PageModel, ElementModel, ElementType } from '../models';
import { CreateItemDialogComponent } from '../create-item-dialog/create-item-dialog.component';
import { MdDialog, MdDialogRef } from '@angular/material';
import * as Immutable from 'immutable';
import { List, Map, Record } from 'immutable';

@Component({
	selector: 'ide-item-list',
	templateUrl: './item-list.component.html',
	styleUrls: ['./item-list.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemListComponent implements OnInit {

	@ViewChild('nameInput')
	nameInput: ElementRef;

	@Input()
	private model: List<ItemModel>;

	@Input()
	private active: number;

	@Input()
	private editingId: string;			//正在编辑的元素id

	constructor(
		private service: ItemsService,
		private timelineService: TimelineService,
		private dialog: MdDialog,
	) {

	}

	public openCreateItemModal() {
		let dialogRef = this.dialog.open(CreateItemDialogComponent, {
			width: '400px',
			height: '250px'
		});
	}

	public removeActiveItem() {
		this.service.removeItem(this.service.active);
		this.changeActive(-1);
	}

	private changeActive(index: number) {
		this.service.active = index;
	}

	private insertActiveItem() {
		let ele: ElementModel = MF.g(ElementModel, {
			type: ElementType.symbol,
			item: this.model.getIn([this.active, 'id']), 
		});

		this.timelineService.addElement(ele, this.model.getIn([this.active, 'name']));
	}

	private editActiveItem() {
		this.timelineService.registerDataSource(this.getActiveItem.bind(this));
	}

	private getActiveItem(): ItemModel {
		return this.model.get(this.active);
	}


	private submitItemName(index: number, value: string) {
		let item = this.service.getItem(index).set('name', value);
		if(this.service.getItem(index).get('type') === ItemType.movieclip) {
			item = item.setIn(['source', 'name'], value);
		}
		this.service.setItem(item, index);
	}

	private getItemTypeIcon(itemType: ItemType): string {
		let icons = [
			'movie_creation',
			'image',
			'font_download',
			'ondemand_video',
		];
		return icons[itemType];
	}

	private getEditorIcon(): string {
		return 'edit';
	}

	private getInsertIcon(): string {
		return 'add_circle';
	}

	private getEditingStatus(id: string): boolean {
		return id === this.editingId;
	}

	ngAfterViewInit() {
	}

	ngOnInit() {

	}

}


