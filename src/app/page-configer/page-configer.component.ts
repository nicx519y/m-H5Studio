import { Component, OnInit, ViewChild, Input, ChangeDetectionStrategy } from '@angular/core';
import { PageConfigerService } from '../page-configer.service';
import { PageType, Direction, SwiperEffect, BackgroundModel, SwiperModel, StageModel } from '../models';
import {
	PropertyBasicModel,
	PropertyTextboxModel,
	PropertyNumberModel,
	PropertyRangeModel,
	PropertyDropdownModel,
	PropertyColorpickerModel,
	PropertyBooleanModel,
	PropertySingleSelectionModel,
	PropertySingleCheckboxModel,
	PropertyFileSelectModel,
} from '../properties';
import { MdDialogRef } from '@angular/material';

import * as Immutable from 'immutable';
import { List, Map, Record } from 'immutable';

@Component({
	selector: 'ide-page-configer',
	templateUrl: './page-configer.component.html',
	styleUrls: ['./page-configer.component.css', '../../assets/modal.form.css'],
	changeDetection: ChangeDetectionStrategy.Default,
})
export class PageConfigerComponent implements OnInit {

	private stageTitle: string = '';
	private stageBackgroundColor: string = '#ffffff';
	private firstPage: number = 1;
	private isLoop: boolean = false;
	private isAutoPlay: boolean = true;
	private canSwiper: boolean = true;
	private swiperDirection: Direction = Direction.vertial;
	private swiperEffect: SwiperEffect = SwiperEffect.slide;
	private swiperSpeed: number = 1;

	constructor(
		private service: PageConfigerService,
		private dref: MdDialogRef<PageConfigerComponent>,
	) {
		
	}

	private get model(): Map<string, any> {
		return this.service.getData();
	}

	private submitHandler() {
		this.service.setData(this.service.getData()
			.setIn(['stage', 'title'], this.stageTitle)
			.setIn(['stage', 'background', 'color'], this.stageBackgroundColor)
			.setIn(['swiper', 'initialSlide'], this.firstPage)
			.setIn(['swiper', 'loop'], this.isLoop)
			.setIn(['swiper', 'autoPlay'], this.isAutoPlay)
			.setIn(['stage', 'pageType'], this.canSwiper? PageType.swiper: PageType.none)
			.setIn(['swiper', 'direction'], this.swiperDirection)
			.setIn(['swiper', 'effect'], this.swiperEffect)
			.setIn(['swiper', 'speed'], this.swiperSpeed));
		this.dref.close();
	}

	private initData() {
		let model: Map<string, any> = this.service.getData();
		this.stageTitle = model.getIn(['stage', 'title']);
		this.stageBackgroundColor = model.getIn(['stage', 'background', 'color']);
		this.firstPage = model.getIn(['swiper', 'initialSlide']);
		this.isLoop = model.getIn(['swiper', 'loop']);
		this.isAutoPlay = model.getIn(['swiper', 'autoPlay']);
		this.canSwiper = (model.getIn(['stage', 'pageType']) === PageType.swiper);
		this.swiperDirection = model.getIn(['swiper', 'direction']);
		this.swiperEffect = model.getIn(['swiper', 'effect']);
		this.swiperSpeed = model.getIn(['swiper', 'speed']);
	}

	ngOnInit() {
		this.initData();
	}
}
