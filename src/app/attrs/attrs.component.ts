import { Component, OnInit, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { PropertyBasicModel } from '../properties';
import { TimelineService } from '../timeline.service';
import { ElementModel, ElementStateModel, EditorState, FrameModel, Rectangle, SelectionElementModel, SelectionModel } from '../models';
import * as Immutable from 'immutable';
import { List, Map as ImmutableMap, Record } from 'immutable';

const SCREEN_WIDTH: number = 750;	//编辑框宽度
const SCREEN_HEIGHT: number = 1334;	//编辑框高度

export enum AttrsMode {
	none,
	elementProperty,
	MultiProperties,
	fontSetting,
};

export enum AlignMode {
	top,
	middle,
	bottom,
	left,
	center,
	right
}

export class ElementWithBounds {
	x: number = 0;
	y: number = 0;
	bounds: {
		x: number,
		y: number,
		width: number,
		height: number,
	} = {
		x: 0,
		y: 0,
		width: 0,
		height: 0,
	};
	constructor(options: {
		x?: number,
		y?: number,
		bounds?: {
			x: number,
			y: number,
			width: number,
			height: number,
		}
	}) {
		this.x = options.x || 0;
		this.y = options.y || 0;
		options.bounds && (this.bounds = options.bounds);
	}
}

@Component({
	selector: 'ide-attrs',
	templateUrl: './attrs.component.html',
	styleUrls: ['./attrs.component.css'],
	changeDetection: ChangeDetectionStrategy.Default,
})
export class AttrsComponent implements OnInit {

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
				let obj = {};
				obj['transformedBounds'] = this.model.getIn(['transformedBounds', idx]);
				obj['frameIndex'] = this.model.get('frameIndex');
				obj['state'] = {};
				for(let i in this.formData) {
					if(isNaN(this.formData[i])) {
						obj['state'][i] = this.model.getIn(['states', idx, i]);
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

	private makeSinglePropertyFormData() {
		this.mode = AttrsMode.elementProperty;
		let state = this.model.getIn(['elements', 0, 'elementState']);
		if(state) {
			this.formData = state.toJS();
			this.formData.hasOwnProperty('rotation') && (this.formData['rotation'] = this.angleInit(this.formData['rotation']));
			this.formData.hasOwnProperty('skewX') && (this.formData['skewX'] = this.angleInit(this.formData['skewX']));
			this.formData.hasOwnProperty('skewY') && (this.formData['skewY'] = this.angleInit(this.formData['skewY']));
			this.accuracyControl();
			console.log('fromData: ', this.formData);
		}
	}

	private makeSingleMultiPropertiesData() {
		this.mode = AttrsMode.MultiProperties;
	}

	private clearFormData() {
		this.mode = AttrsMode.none;
		this.formData = {};
	}

	private accuracyControl() {
		['originX', 'originY', 'skewX', 'skewY', 'x', 'y', 'rotation'].forEach(key => {
			this.formData.hasOwnProperty(key) && (this.formData[key] = Math.round(this.formData[key]));
		});
		['scaleX', 'scaleY', 'alpha'].forEach(key => {
			this.formData.hasOwnProperty(key) && (this.formData[key] = Math.round(this.formData[key] * 100) / 100);
		});
	}

	private singleAlignWithMode(mode: AlignMode = AlignMode.top) {
		let targets = new Map<AlignMode, number>();
		targets.set(AlignMode.top, 0);
		targets.set(AlignMode.left, 0);
		targets.set(AlignMode.bottom, SCREEN_HEIGHT);
		targets.set(AlignMode.right, SCREEN_WIDTH);
		targets.set(AlignMode.middle, SCREEN_HEIGHT / 2);
		targets.set(AlignMode.center, SCREEN_WIDTH / 2);

		let ele: ElementWithBounds = new ElementWithBounds({
			x: this.formData['x'],
			y: this.formData['y'],
			bounds: this.model.getIn(['elements', 0, 'transformBounds']),
		});

		let result = this.singleAlign(ele, targets.get(mode), mode);
		this.formData['x'] = result.x;
		this.formData['y'] = result.y;

		this.onSubmit();
	}

	private mutliAlignWithMode() {

	}

	/**
	 * 单元素对齐
	 */
	public singleAlign(element: ElementWithBounds, target: number, mode: AlignMode = AlignMode.top): ElementWithBounds {
		let result = element;
		switch(mode) {
			case AlignMode.top:
				result.y -= element.bounds.y - target;
				break;
			case AlignMode.middle:
				result.y -= element.bounds.y + element.bounds.height / 2 - target;
				break;
			case AlignMode.bottom:
				result.y -= element.bounds.y + element.bounds.height - target;
				break;
			case AlignMode.left:
				result.x -= element.bounds.x - target;
				break;
			case AlignMode.center:
				result.x -= element.bounds.x + element.bounds.width / 2 - target;
				break;
			case AlignMode.right:
				result.x -= element.bounds.x + element.bounds.width - target;
				break;
		}

		return result;
	}

	/**
	 * 多元素对齐
	 */
	public multiAlign(selection: ElementWithBounds[], mode: AlignMode = AlignMode.top): ElementWithBounds[] {
		let target: number;
		switch(mode) {
			case AlignMode.top:
				target = Math.min.apply(null, selection.map(ele => ele.y));
				break;
			case AlignMode.middle:
				let top: number = Math.min.apply(null, selection.map(ele => ele.bounds.y));
				let bottom: number = Math.max.apply(null, selection.map(ele => ele.bounds.y + ele.bounds.height));
				target = (top + bottom) / 2;
				break;
			case AlignMode.bottom:
				target = Math.max.apply(null, selection.map(ele => ele.bounds.y + ele.bounds.height));
				break;
			case AlignMode.left:
				target = Math.min.apply(null, selection.map(ele => ele.bounds.x));
				break;
			case AlignMode.center:
				let left: number = Math.min.apply(null, selection.map(ele => ele.bounds.x));
				let right: number = Math.max.apply(null, selection.map(ele => ele.bounds.x + ele.bounds.width));
				target = (left + right) / 2;
				break;
			case AlignMode.bottom:
				target = Math.max.apply(null, selection.map(ele => ele.bounds.x + ele.bounds.width));
				break;
		}
		return selection.map(ele => this.singleAlign(ele, target, mode));
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
