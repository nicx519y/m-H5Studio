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
	private model: {};

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

		console.log(ao, fo);

        this.timelineService.setTimelineData(this.timelineService.setToKeyFrames(ao, fo));
	}

	private elementStateSubmit(value: any) {
		this.changeElementStateInActionFrame([{
			id: value.eleId,
			frameIndex: value.frameIndex,
			state: {
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

	onSubmit(form: any) {
		this.elementStateSubmit(form.value);
	}

	ngOnInit() {

	}

	ngAfterViewInit() {
		
	}

	ngOnChanges(changes: SimpleChanges) {
	}
}
