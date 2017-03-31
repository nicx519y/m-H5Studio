import { Component, ViewContainerRef, ChangeDetectionStrategy, enableProdMode, ViewChild } from '@angular/core';
import { PagesService } from '../pages.service';
// import { MainService } from '../main.service';
import { ItemsService } from '../items.service';
import { BitmapImporterService } from '../bitmap-importer.service';
import { TimelineService } from '../timeline.service';
import { PageConfigerService } from '../page-configer.service';
import { MdDialog } from '@angular/material';
import { BitmapImporterComponent } from '../bitmap-importer/bitmap-importer.component';
import { PageConfigerComponent } from '../page-configer/page-configer.component';
import { CanvasRenderService } from '../canvas-render.service';

import { TimelineComponent } from '../timeline/timeline.component';
import { ToolsbarComponent } from '../toolsbar/toolsbar.component';
import { PageListComponent } from '../page-list/page-list.component';
import { ItemListComponent } from '../item-list/item-list.component';

enableProdMode();	//防止出现一些dev版本才会出现的错误 

@Component({
	selector: 'ide',
	templateUrl: './ide.component.html',
	styleUrls: ['./ide.component.css'],
	changeDetection: ChangeDetectionStrategy.Default,
})

export class IdeComponent {

	@ViewChild('timeline')
	private timeline: TimelineComponent;

	@ViewChild('toolsbar')
	private toolsbar: ToolsbarComponent;

	@ViewChild('pageList')
	private pageList: PageListComponent;

	@ViewChild('itemList')
	private itemList: ItemListComponent;

	private viewInit: boolean;

	constructor(
		// private service: MainService,
		private pagesService: PagesService,
		private itemsService: ItemsService,
		private timelineService: TimelineService,
		private bitmapImporterService: BitmapImporterService,
		private pageConfigerService: PageConfigerService,
		private canvasRenderService: CanvasRenderService,
		private dialog: MdDialog,
	){
	}

	public saveData() {
		console.log('save');
		// this.service.saveData();
	}

	public preview() {
		console.log('preview');
	}

	public publish() {
		console.log('publish');
	}

	public createNewProject() {
		// this.service.createNewProject();
	}

	public fullscreen() {
		document.documentElement.webkitRequestFullscreen();
	}

	public openImportBitmapsDialog() {
		this.dialog.open(BitmapImporterComponent, {
			width: '800px',
			height: '500px'
		});
	}

	public openPageConfigerDialog() {
		this.dialog.open(PageConfigerComponent, {
			width: '500px',
			height: '500px'
		});
	}

	public getHotKeyApis() {
		if(!this.viewInit) return null;
		return {
			changeToKeyFrames: this.timeline.changeActiveToKeyFrames.bind(this.timeline),
			removeKeyFrames: this.timeline.removeActiveKeyFrames.bind(this.timeline),
			changeToFrames: this.timeline.changeActiveToFrames.bind(this.timeline),
			removeFrames: this.timeline.removeActiveFrames.bind(this.timeline),
			changeToEmptyKeyFrames: this.timeline.changeActiveToEmptyKeyFrames.bind(this.timeline),
			addTweens: this.timeline.createActiveTweens.bind(this.timeline),
			removeTweens: this.timeline.removeActiveTweens.bind(this.timeline),
			selectElementMode: this.toolsbar.changeSelectMode.bind(this.toolsbar),
			moveMode: this.toolsbar.changeMoveMode.bind(this.toolsbar),
			zoomMode: this.toolsbar.changeZoomMode.bind(this.toolsbar),
			prevMode: this.toolsbar.changePrevMode.bind(this.toolsbar),
			// drawMode: this.toolsbar.changeDrawMode.bind(this.toolsbar),
			textEditMode: this.toolsbar.changeTextEditMode.bind(this.toolsbar),
			saveData: this.saveData.bind(this),
			preview: this.preview.bind(this),
			fullscreen: this.fullscreen.bind(this),
			showPageConfiger: this.openPageConfigerDialog.bind(this),
			importBitmaps: this.openImportBitmapsDialog.bind(this),
			createItem: this.itemList.openCreateItemModal.bind(this.itemList),
			addPage: this.pageList.addEmptyPageAtLast.bind(this.pageList),
		};
	}

	ngAfterViewInit() {
		this.viewInit = true;
	}
}