import { Component, OnInit, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { PropertyBasicModel } from '../properties';
import { TimelineService } from '../timeline.service';
import { ElementModel, ElementStateModel, EditorState, FrameModel } from '../models';
import { AttrsService, AttrsMod, AlignMode, ElementWithBounds } from '../attrs.service';
import * as Immutable from 'immutable';
import { List, Map as ImmutableMap, Record } from 'immutable';

const SCREEN_WIDTH: number = 750;	//编辑框宽度
const SCREEN_HEIGHT: number = 1334;	//编辑框高度

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
	private model: ImmutableMap<string, any>;

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
				x: value.x,
				y: value.y,
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

	private singleAlignWithMode(mode: AlignMode = AlignMode.top) {

		let targets = new Map<AlignMode, number>();
		targets.set(AlignMode.top, 0);
		targets.set(AlignMode.left, 0);
		targets.set(AlignMode.bottom, SCREEN_HEIGHT);
		targets.set(AlignMode.right, SCREEN_WIDTH);
		targets.set(AlignMode.middle, SCREEN_HEIGHT / 2);
		targets.set(AlignMode.center, SCREEN_WIDTH / 2);

		let ele: ElementWithBounds = new ElementWithBounds({
			x: this.data['x'],
			y: this.data['y'],
			bounds: this.data['transformedBounds'],
		});

		let result = this.attrsService.singleAlign(ele, targets.get(mode), mode);
		this.data['x'] = result.x;
		this.data['y'] = result.y;

		this.onSubmit();
	}

	private mutliAlignWithMode() {

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
