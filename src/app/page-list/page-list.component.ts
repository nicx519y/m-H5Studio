import { Component, Input, ViewChildren, QueryList, ElementRef, OnInit, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { PagesService } from '../pages.service';
import { MF, PageModel } from '../models';
import { TimelineService } from '../timeline.service';

import * as Immutable from 'immutable';
import { List, Map, Record } from 'immutable';

@Component({
	selector: 'ide-page-list',
	templateUrl: './page-list.component.html',
	styleUrls: ['./page-list.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageListComponent implements OnInit {

	@Input()
	private model: List<PageModel>;

	@Input()
	private editingId: string;

	@ViewChildren('nameInput')
	nameInputList: QueryList<ElementRef>;

	@ViewChildren('page')
	pageList: QueryList<ElementRef>;

	private active: number = -1;

	constructor(
		private service: PagesService,
		private timelineService: TimelineService,
	) {
		
	}

	/**
	 * 在最后新增空白页
	 */
	public addEmptyPageAtLast() {
		this.service.addPage(MF.g(PageModel, { name: 'New Page' }), this.model.size);
	}

	/**
	 * 删除
	 */
	public removePage(index: number) {
		this.service.removePage(index);
	}
	/**
	 * @dest 上移
	 */
	public upPage(index: number) {
		this.service.upPage(index);
	}

	/**
	 * @dest 下移
	 */
	public downPage(index: number) {
		this.service.downPage(index);
	}

	private nameInputSubmit(index: number, value: string) {
		let page: PageModel = this.service.getPage(index);
		this.service.setPage(page.set('name', value), index);
	}

	private editPage(index: number) {
		this.service.activePageId = this.model.getIn([index, 'id']);
		this.timelineService.registerDataSource(this.getActivePage.bind(this));
	}

	private getActivePage(): PageModel {
		return this.service.getPageById(this.service.activePageId);
	}

	// private changePageActive(activePage: PageModel) {
	// 	if(this.pageList.length > this.active && this.active >= 0)
	// 		this.pageList.toArray()[this.active].nativeElement.className = 'unactive';
	// 	this.active = this.model.findIndex(page => Immutable.is(page, activePage));
		
	// 	if(this.pageList.length > this.active && this.active >= 0)
	// 		this.pageList.toArray()[this.active].nativeElement.className = 'active';

	// 	//通知timelineService 当前编辑状态的page改变
	// 	this.timelineService.registerDataSource(activePage);
	// }

	private getEditingStatus(id: string): boolean {
		return this.editingId === id;
	}

	ngAfterViewInit() {
		//如果没有页面，自动增加一个空白页
		if(this.model.size <= 0) {
			this.addEmptyPageAtLast();
		}
	}

	ngOnInit() {

	}

	ngOnChanges(changes) {

	}

}
