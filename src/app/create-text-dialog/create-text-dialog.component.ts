import * as Immutable from 'immutable';
import { List, Map, Record } from 'immutable';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MdDialog, MdDialogRef } from '@angular/material';
import { TimelineService } from '../timeline.service';
import { MF, TextModel, ElementModel, ElementType } from '../models';

@Component({
	selector: 'app-create-text-dialog',
	templateUrl: './create-text-dialog.component.html',
	styleUrls: ['./create-text-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTextDialogComponent implements OnInit {

	private text: string = '';

	constructor(
		private dialog: MdDialog,
		private timelineService: TimelineService,
		private dref: MdDialogRef<CreateTextDialogComponent>,
		
	) {

	}

	/**
	 * 新建一个text element
	 */
	onSubmit() {
		let newElement: ElementModel = ElementModel.fromText(MF.g(TextModel, { text: this.text }));
		this.timelineService.addElement(newElement, this.text);
		this.dref.close();
	}

	ngOnInit() {
		
	}

}
