import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { EditorState } from '../models';

@Component({
	selector: 'ide-toolsbar',
	templateUrl: './toolsbar.component.html',
	styleUrls: ['./toolsbar.component.css']
})
export class ToolsbarComponent implements OnInit {

	public state: EditorState = EditorState.choose;
	public states = [
		{
			name: '选择元素',
			state: EditorState.choose,
			class: 'open_with',
		},
		{
			name: '插入文本',
			state: EditorState.text,
			class: 'title'
		},
		{
			name: '缩放视图',
			state: EditorState.zoom,
			class: 'zoom_in'
		},
		{
			name: '绘制图形',
			state: EditorState.draw,
			class: 'brush'
		},
	];
	
	constructor() {

	}

	public changeState( state: EditorState ) {
		this.state = state;
	}

	ngOnInit() {
		
	}

}
