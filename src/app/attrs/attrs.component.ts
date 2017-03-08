import { Component, OnInit, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { PropertyBasicModel } from '../properties';
import { TimelineService } from '../timeline.service';
import { ElementModel, ElementStateModel, EditorState, FrameModel, Rectangle, SelectionElementModel, SelectionModel } from '../models';
import * as Immutable from 'immutable';
import { List, Map as ImmutableMap, Record } from 'immutable';

const SCREEN_WIDTH: number = 750;	//编辑框宽度
const SCREEN_HEIGHT: number = 1334;	//编辑框高度

function isEquals(): boolean {
	return (new Set(arguments).size === 1);
}

export enum AttrsMode {
	none,
	elementProperty,
	MultiProperties,
};

export enum AlignMode {
	top,
	middle,
	bottom,
	left,
	center,
	right
}

@Component({
	selector: 'ide-attrs',
	templateUrl: './attrs.component.html',
	styleUrls: ['./attrs.component.css'],
	changeDetection: ChangeDetectionStrategy.Default,
})
export class AttrsComponent implements OnInit {

	@Input()
	private toolbarState: EditorState;

	@Input()
	private model: SelectionModel;

	private mode: AttrsMode = AttrsMode.none;
	//表单数据
	private formData: {} = {};

	constructor(
		private timelineService: TimelineService,
	) {
		
	}

	private changeElementStateInActionFrame(selection: any[]) {
		let ao = selection.map(ele => {
            return {
                elementId: ele.id,
                start: ele.frameIndex,
                duration: 1,
            };
        });
        let fo = selection.map(ele => {
            return {
                elementId: ele.id,
                isEmptyFrame: false,
                elementState: ele.state,
            }
        });

        this.timelineService.setData(this.timelineService.setToKeyFrames(ao, fo));
	}

	/**
	 * 提交element state 状态更新
	 */
	private elementStateSubmit(value: any) {
		if(this.mode === AttrsMode.elementProperty) {
			this.changeElementStateInActionFrame([{
				id: this.model.getIn(['elements', 0, 'elementId']),
				frameIndex: this.model.get('frameIndex'),
				state: value,
			}]);
		} else if(this.mode === AttrsMode.MultiProperties) {
			let data = [];
			this.model.get('elements').forEach((ele, idx) => {
				let obj = {
					'frameIndex': this.model.get('frameIndex'),
					'id': ele.get('elementId'),
					'state': {},
				};

				for(let i in this.formData) {
					if(isNaN(this.formData[i])) {
						obj['state'][i] = ele.getIn(['elementState', i]);
					} else {
						obj['state'][i] = this.formData[i];
					}
				}
				data.push(obj);
			});
			this.changeElementStateInActionFrame(data);
		}
	}

	/**
	 * 初始化角度值，将任意角度值规范至-180° ~ 180°
	 */
	private angleInit(angle: number): number {
		let result = angle % 360;
		if(result > 180) {
			result -= 360;
		} else if(result < -180) {
			result += 360;
		}
		return result;
	}

	/**
	 * 初始化表单数据
	 */
	private dataInit() {
		if(!this.model || !this.model.has('elements')) {
			this.clearFormData();
			return;
		}
		if(this.model.get('elements').size === 1) {
			this.makeSinglePropertyFormData();
		} else if(this.model.get('elements').size > 1) {
			this.makeSingleMultiPropertiesData();
		} else {
			this.clearFormData();
		}
	}

	/**
	 * 单选元素属性面板数据拼合
	 */
	private makeSinglePropertyFormData() {
		this.mode = AttrsMode.elementProperty;
		let state = this.model.getIn(['elements', 0, 'elementState']);
		if(state) {
			this.formData = state.toJS();
			this.formData.hasOwnProperty('rotation') && (this.formData['rotation'] = this.angleInit(this.formData['rotation']));
			this.formData.hasOwnProperty('skewX') && (this.formData['skewX'] = this.angleInit(this.formData['skewX']));
			this.formData.hasOwnProperty('skewY') && (this.formData['skewY'] = this.angleInit(this.formData['skewY']));
			this.accuracyControl();
		}
	}

	/**
	 * 多选元素属性面板数据拼合
	 */
	private makeSingleMultiPropertiesData() {
		this.mode = AttrsMode.MultiProperties;
		['originX', 'originY', 'x', 'y', 'scaleX', 'scaleY', 'skewX', 'skewY', 'rotation', 'alpha'].forEach(key => {
			let isSame: boolean = isEquals.apply(null, this.model.get('elements').map(element => element.getIn(['elementState', key])).toJS());
			if(isSame) {
				this.formData[key] = this.model.getIn(['elements', 0, 'elementState', key]);
				if(['rotation', 'skewX', 'skewY'].indexOf(key) >= 0) {
					this.formData[key] = this.angleInit(this.formData[key]);
				}
				this.accuracyControl();
			} else {
				this.formData[key] = NaN;
			}
		});
	}

	/**
	 * 清空表单面板
	 */
	private clearFormData() {
		this.mode = AttrsMode.none;
		this.formData = {};
	}

	/**
	 * 表单数据精度控制
	 */
	private accuracyControl() {
		['originX', 'originY', 'skewX', 'skewY', 'x', 'y', 'rotation'].forEach(key => {
			this.formData.hasOwnProperty(key) && (this.formData[key] = Math.round(this.formData[key]));
		});
		['scaleX', 'scaleY', 'alpha'].forEach(key => {
			this.formData.hasOwnProperty(key) && (this.formData[key] = Math.round(this.formData[key] * 100) / 100);
		});
	}

	private alignWithMode(mode: AlignMode = AlignMode.top) {
		if(this.mode === AttrsMode.elementProperty) {
			this.singleAlignWithMode(mode);
		} else if(this.mode === AttrsMode.MultiProperties) {
			this.mutliAlignWithMode(mode);
		}
	}

	/**
	 * 单选对齐
	 */
	private singleAlignWithMode(mode: AlignMode = AlignMode.top) {
		let targets = new Map<AlignMode, number>();
		targets.set(AlignMode.top, 0);
		targets.set(AlignMode.left, 0);
		targets.set(AlignMode.bottom, SCREEN_HEIGHT);
		targets.set(AlignMode.right, SCREEN_WIDTH);
		targets.set(AlignMode.middle, SCREEN_HEIGHT / 2);
		targets.set(AlignMode.center, SCREEN_WIDTH / 2);

		let result = this.singleAlign(this.model.getIn(['elements', 0]), targets.get(mode), mode);
		this.formData['x'] = result.getIn(['elementState', 'x']);
		this.formData['y'] = result.getIn(['elementState', 'y']);
		this.accuracyControl();

		this.onSubmit();
	}

	/**
	 * 多选对齐
	 */
	private mutliAlignWithMode(mode: AlignMode = AlignMode.top) {
		let data = this.multiAlign(this.model.get('elements'), mode)
			.map((ele, idx) => {
				return {
					'transformedBounds': ele.get('transformBounds'),
					'frameIndex': this.model.get('frameIndex'),
					'id': ele.get('elementId'),
					'state': ele.get('elementState').toJS()
				};
			}).toArray();
		this.changeElementStateInActionFrame(data);
	}

	/**
	 * 单元素对齐
	 */
	public singleAlign(element: SelectionElementModel, target: number, mode: AlignMode = AlignMode.top): SelectionElementModel {
		let result = element;
		let bounds: Rectangle = element.get('transformBounds').toJS();
		let state: ElementStateModel = result.get('elementState').toJS();
		switch(mode) {
			case AlignMode.top:
				result = result.setIn(['elementState', 'y'], state['y'] - (bounds['y'] - target));
				break;
			case AlignMode.middle:
				result = result.setIn(['elementState', 'y'], state['y'] - (bounds['y'] + bounds['height'] / 2 - target));
				break;
			case AlignMode.bottom:
				result = result.setIn(['elementState', 'y'], state['y'] - (bounds['y'] + bounds['height'] - target));
				break;
			case AlignMode.left:
				result = result.setIn(['elementState', 'x'], state['x'] - (bounds['x'] - target));
				break;
			case AlignMode.center:
				result = result.setIn(['elementState', 'x'], state['x'] - (bounds['x'] + bounds['width'] / 2 - target));
				break;
			case AlignMode.right:
				result = result.setIn(['elementState', 'x'], state['x'] - (bounds['x'] + bounds['width'] - target));
				break;
		}

		return result;
	}

	/**
	 * 多元素对齐
	 */
	public multiAlign(selection: List<SelectionElementModel>, mode: AlignMode = AlignMode.top): List<SelectionElementModel> {
		let target: number;
		let selectionArr = selection.toJS();
		switch(mode) {
			case AlignMode.top:
				target = Math.min.apply(null, selectionArr.map(ele => ele['transformBounds']['y']));
				break;
			case AlignMode.middle:
				let top: number = Math.min.apply(null, selectionArr.map(ele => ele['transformBounds']['y']));
				let bottom: number = Math.max.apply(null, selectionArr.map(ele => ele['transformBounds']['y'] + ele['transformBounds']['height']));
				target = (top + bottom) / 2;
				break;
			case AlignMode.bottom:
				target = Math.max.apply(null, selectionArr.map(ele => ele['transformBounds']['y'] + ele['transformBounds']['height']));
				break;
			case AlignMode.left:
				target = Math.min.apply(null, selectionArr.map(ele => ele['transformBounds']['x']));
				break;
			case AlignMode.center:
				let left: number = Math.min.apply(null, selectionArr.map(ele => ele['transformBounds']['x']));
				let right: number = Math.max.apply(null, selectionArr.map(ele => ele['transformBounds']['x'] + ele['transformBounds']['width']));
				target = (left + right) / 2;
				break;
			case AlignMode.right:
				target = Math.max.apply(null, selectionArr.map(ele => ele['transformBounds']['x'] + ele['transformBounds']['width']));
				break;
		}
		let result = selection.map(ele => this.singleAlign(ele, target, mode)).toList();
		return result;
	}

	onSubmit() {
		this.elementStateSubmit(Object.assign({}, this.formData));
	}

	ngOnInit() {

	}

	ngAfterViewInit() {
		
	}

	ngOnChanges(changes: SimpleChanges) {
		changes.hasOwnProperty('model') && this.dataInit();
	}
}
