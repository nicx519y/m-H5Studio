import { 
    Component, 
    OnInit, 
    OnChanges, 
    ViewChild, 
    ElementRef, 
    ViewContainerRef, 
    HostListener, 
    Input, 
    Output,
    ChangeDetectionStrategy,
    EventEmitter,
    ChangeDetectorRef,
    OnDestroy,
    SimpleChanges,
    SimpleChange,
} from '@angular/core';
import { MainModel, EditorState, ElementModel, ElementStateModel, FrameModel, PageModel, ItemModel, MF } from '../models';
import { TimelineService } from '../timeline.service';
import { AttrsService, AttrsMod } from '../attrs.service';
import Developer from '../janvas/main/developer';

import * as Immutable from 'immutable';
import { List, Map as ImmutableMap, Record } from 'immutable';

@Component({
    selector: 'ide-canvas',
    templateUrl: './canvas.component.html',
    styleUrls: ['./canvas.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements OnInit {

    private janvas:any;
    private isJanvasInited:boolean = false;
    private modeMap: Map<EditorState, any> = new Map<EditorState, any>();

    @ViewChild('dev')
    private devCanvas: ElementRef;

    @ViewChild('box')
    private box: ElementRef;

    @Input()
    private mode: EditorState = EditorState.choose;

    @Input()
    private hasData: boolean;

    @Input()
    private activeOptions: List<Map<string, any>> = Immutable.List<Map<string, number>>();

    @Input()
    private activePageModel: PageModel;

    @Input()
    private itemsModel: List<ItemModel>;

    @Input()
    private selectedElements: List<ImmutableMap<string, any>>;

    @Input()
    private selectedObject: ImmutableMap<string, any>;

    constructor(
        private timelineService: TimelineService,
        private attrsService: AttrsService,
        private container: ViewContainerRef,
    ) {
        this.modeMap.set(EditorState.none, Developer.MODE.READ_MODE);
		this.modeMap.set(EditorState.choose, Developer.MODE.EDIT_MODE);
		this.modeMap.set(EditorState.text, Developer.MODE.TEXT_MODE);
		this.modeMap.set(EditorState.zoom, Developer.MODE.SCALE_MODE);
    }

    @HostListener('window:resize')
    private resizeHandler() {
        let w: number = this.container.element.nativeElement.offsetWidth;
        let h: number = this.container.element.nativeElement.offsetHeight;
        this.box.nativeElement.style.width = w + 'px';
        this.box.nativeElement.style.height = h + 'px';

        this.janvas.resizeJanvasDev(w, h);
    }
    
    ngOnInit() {
        this.janvasInit('div');
    }

    ngOnDestroy() {

    }

    ngAfterViewInit() {
        // this.timelineService.registerElementStateCreator(this.elementStateCreator.bind(this));
    }

    ngOnChanges(changes: SimpleChanges) {
        //页面数据变化
        if(changes.hasOwnProperty('activePageModel') && this.hasData) {
            this.janvasUpdate();
        }

        //lib数据变化
        if(changes.hasOwnProperty('itemsModel')) {
            this.janvasUpdate();
        }

        //编辑模式变化
        if(changes.hasOwnProperty('mode')) {
            this.modeChange(this.mode);
        }

        // if(changes.hasOwnProperty('activeOptions')) {
        //     // this.canvasRenderService.activeOptions = this.activeOptions;
        //     // this.canvasRenderService.activeOptionsChange(changes['activeOptions']);
        //     console.log('activeOptions: ', this.activeOptions);
        // }

        // if(changes.hasOwnProperty('selectedElements')) {
        //     console.log('selectedElements: ', this.selectedElements);
        //     this.timelineService.setActiveOptions(this.selectedElements.toJS(), false);
        // }
    }

    /**
     * janvas初始化
     */
    private janvasInit(containerId: string) {
        if(this.isJanvasInited) return;
        let data = this.makeJanvasData().toJS();
        this.janvas = new Developer(
            containerId,
            {
                canvasWidth: 10, //canvas width
                canvasHeight: 10, //canvas height
                data: data //janvas data
            },
            (target) => {
                target.addEventHandler(
                    Developer.EVENTS.ELEMENT_SELECTED, 
                    this.janvasSelectedHandler.bind(this)
                );

                target.addEventHandler(
                    Developer.EVENTS.ELEMENT_CHANGED, 
                    this.janvasChangedHandler.bind(this)
                );

				this.isJanvasInited = true;
            }
        );
    }

    /**
     * 更新janvas，timeline数据有改变的时候更新
     */
    public janvasUpdate() {
        if(!this.isJanvasInited) return;
        let activeFrame: number = this.getActiveFirstFrame();
        let data = this.makeJanvasData().toJS();
        let page: string = this.activePageModel.get('id');

        data && this.janvas.updateJanvasData(data, {
            page: page,
            frameIndex: Math.max(0, activeFrame),
            elementList: this.activeOptions.map(ao => ao.get('elementId')).toArray()
        });
    }

    private janvasSelectedHandler(result) {

    }

    private janvasChangedHandler(result) {

    }

    /**
	 * 获取active状态的最小帧，最小值0，默认0
	 */
	public getActiveFirstFrame(ao: List<Map<string, any>> = null): number {
        if(!ao) ao = this.activeOptions;
		if(ao.size <= 0) return -1;
		return Math.max(Math.min.apply(null, ao.map(ao => ao.get('start')).toArray()));
	}

    /**
	 * 合成传入janvas内部的数据
	 */
	public makeJanvasData(): MainModel {
		let data: MainModel = MF.g(MainModel, {
			pages: Immutable.List<PageModel>().push(this.activePageModel),
			library: this.itemsModel,
		});

		return data;
	}

    /**
     * 面板操作模式改变
     */
    public modeChange(mode: EditorState = EditorState.choose) {
		this.isJanvasInited && this.janvas.changeMode(this.modeMap[mode]);
    }
}
