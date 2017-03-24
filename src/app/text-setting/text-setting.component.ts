import { Component, OnInit, Input, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { MF, TextModel } from '../models';
import { TimelineService } from '../timeline.service';
import { MdSelect } from '@angular/material';

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
			alpha: number,
		},
		fontSize: number,						//字号
		bold: boolean,							//粗体
		italic: boolean,						//斜体
		underline: boolean,						//下划线
		lineheight: number,						//行高
	} = null;

	constructor(
		private timelineService: TimelineService,
	) { 

	}

	private hasData() {
		return !(this.formData === null);
	}

	private dataChange() {
		if (!this.model) {
			this.formData = null;
			console.log('text change: ', this.model);
		} else {
			console.log('text change: ', this.model.toJS());
			this.formData = this.model.toJS();
		}
	}

	private onSubmit() {
		console.log('submit text setting: ', this.formData);
		this.timelineService.setTextByTextId(this.formData.id, new TextModel(this.formData));
	}

	private btnsChanged(evt) {
		// console.log('btnchanges', evt);
		if(this.formData.hasOwnProperty(evt.source.name)) {
			this.formData[evt.source.name] = evt.source.checked;
			this.onSubmit();
		}
	}

	private fontChanged(evt) {
		this.onSubmit();
	}

	ngAfterViewInit() {
		
	}

	ngOnInit() {
		
	}

	ngOnChanges(changes: SimpleChanges) {
		if(changes.hasOwnProperty('model')) {
			this.dataChange();
		}
	}

}
