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
			name: '元素变换',
			state: EditorState.choose,
			class: 'flip_to_front',
		},
		{
			name: '插入文本',
			state: EditorState.text,
			class: 'format_shapes'
		},
		{
			name: '移动视图',
			state: EditorState.move,
			class: 'open_with'
		},
		{
			name: '缩放视图',
			state: EditorState.zoom,
			class: 'zoom_in'
		},
		// {
		// 	name: '绘制图形',
		// 	state: EditorState.draw,
		// 	class: 'brush'
		// },
	];
	
	constructor() {

	}

	public changeState( state: EditorState ) {
		this.state = state;
	}

	public changeSelectMode() {
		this.changeState(EditorState.choose);
	}

	public changeZoomMode() {
		this.changeState(EditorState.zoom);
	}

	public changeTextEditMode() {
		this.changeState(EditorState.text);
	}

	// public changeDrawMode() {
	// 	this.changeState(EditorState.draw);
	// }

	public changeMoveMode() {
		this.changeState(EditorState.move);
	}

	ngOnInit() {
		
	}

}
