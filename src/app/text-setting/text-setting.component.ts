import { Component, OnInit } from '@angular/core';
import { TextModel } from '../models';

@Component({
	selector: 'ide-text-setting',
	templateUrl: './text-setting.component.html',
	styleUrls: ['./text-setting.component.css']
})
export class TextSettingComponent implements OnInit {

	private formData = {
		width: 0,							//宽度
		height: 0,							//高度
		text: '  ',							//文字内容
		font: 'arial',						//字体
		color: '#ffffff',					//颜色
		backgroundColor: '#ffffff',			//背景色
		fontSize: 12,						//字号
		bold: false,						//粗体
		italic: false,						//斜体
		underline: false,					//下划线
		lineheight: 20,						//行高
	};

	constructor() { }

	ngOnInit() {

	}

}
