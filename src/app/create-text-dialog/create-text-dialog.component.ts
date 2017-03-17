import * as Immutable from 'immutable';
import { List, Map, Record } from 'immutable';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MdDialog, MdDialogRef } from '@angular/material';

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
		private dref: MdDialogRef<CreateTextDialogComponent>,
		
	) {

	}

	/**
	 * 新建一个text element
	 */
	onSubmit() {
		this.dref.close(this.text);
	}

	ngOnInit() {
		
	}

}
