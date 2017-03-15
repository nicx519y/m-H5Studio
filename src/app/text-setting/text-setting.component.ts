import { Component, OnInit, Input, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { MF, TextModel } from '../models';
import { TimelineService } from '../timeline.service';
import { CreateTextDialogComponent } from '../create-text-dialog/create-text-dialog.component';
import { MdDialog } from '@angular/material';

@Component({
	selector: 'ide-text-setting',
	templateUrl: './text-setting.component.html',
	styleUrls: ['./text-setting.component.css']
})
export class TextSettingComponent implements OnInit {

	@Input()
	private model: TextModel;

	private formData: {
		id: '',
		width: number,							//宽度
		height: number,							//高度
		text: string,							//文字内容
		font: string,							//字体
		color: string,							//颜色
		background: {
			color: string,
			image: string,
			repeat: boolean,
		},
		fontSize: number,						//字号
		bold: boolean,							//粗体
		italic: boolean,						//斜体
		underline: boolean,						//下划线
		lineheight: number,						//行高
	} = null;

	constructor(
		private timelineService: TimelineService,
		private dialog: MdDialog,
	) { 

	}

	private hasData() {
		return !(this.formData === null);
	}

	private showCreateTextDailog() {
		this.dialog.open(CreateTextDialogComponent, {
			width: '450px',
			height: '200px',
		});
	}

	private dataChange() {
		if(!this.model) {
			this.formData = null;
			return;
		}
		if(this.model.get('id') === '') {
			this.showCreateTextDailog();
		} else {
			this.formData = this.model.toJS();
		}
	}

	private onSubmit() {
		
	}

	ngAfterViewInit() {
		
	}

	ngOnInit() {
		
	}

	ngOnChanges(changes: SimpleChanges) {
		if(changes.hasOwnProperty('model')) {
			let result;
			if(this.model) {
				result = this.model.toJS();
			} else {
				result = this.model;
			}
			console.log('text change: ', result);
			this.dataChange();
		}
	}

}
