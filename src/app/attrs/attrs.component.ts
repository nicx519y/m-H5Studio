import { Component, OnInit, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { PropertyBasicModel } from '../properties';
import { TimelineService } from '../timeline.service';
import { ElementModel, ElementStateModel, EditorState, FrameModel } from '../models';
import { AttrsService, AttrsMod } from '../attrs.service';
import * as Immutable from 'immutable';
import { List, Map, Record } from 'immutable';

@Component({
	selector: 'ide-attrs',
	templateUrl: './attrs.component.html',
	styleUrls: ['./attrs.component.css'],
	changeDetection: ChangeDetectionStrategy.Default,
})
export class AttrsComponent implements OnInit {

	@Input()
	private attrsMod: AttrsMod = AttrsMod.none;

	@Input()
	private model: Map<string, any>;

	//表单数据
	private data: {} = {};

	constructor(
		private attrsService: AttrsService,
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

        this.timelineService.setTimelineData(this.timelineService.setToKeyFrames(ao, fo));
	}

	/**
	 * 提交element state 状态更新
	 */
	private elementStateSubmit(value: any) {
		this.changeElementStateInActionFrame([{
			id: value.id,
			frameIndex: value.frameIndex,
			state: {
				originX: value.originX,
				originY: value.originY,
				x: value.eleX,
				y: value.eleY,
				scaleX: value.scaleX,
				scaleY: value.scaleY,
				skewX: value.skewX,
				skewY: value.skewY,
				rotation: value.rotation,
				alpha: value.alpha,
			}
		}]);
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
		this.data = this.model.toJS();
		this.data.hasOwnProperty('rotation') && (this.data['rotation'] = this.angleInit(this.data['rotation']));
		this.data.hasOwnProperty('skewX') && (this.data['skewX'] = this.angleInit(this.data['skewX']));
		this.data.hasOwnProperty('skewY') && (this.data['skewY'] = this.angleInit(this.data['skewY']));
	}


	onSubmit() {
		this.elementStateSubmit(Object.assign({}, this.data));
	}

	ngOnInit() {

	}

	ngAfterViewInit() {
		
	}

	ngOnChanges(changes: SimpleChanges) {
		changes.hasOwnProperty('model') && this.dataInit();
	}
}
