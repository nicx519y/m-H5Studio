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
import { MainModel, EditorState, ElementModel, ElementStateModel, FrameModel, PageModel, ItemModel, SelectionModel, SelectionElementModel, Rectangle, MF } from '../models';
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
    private CANVAS_ELEMENT_ID:string = 'dev';
    private janvas:any;
    private isJanvasInited:boolean = false;
    private modeMap: Map<EditorState, any> = new Map<EditorState, any>();

    @ViewChild('dev')
    private devCanvas: ElementRef;

    @ViewChild('box')
    private box: ElementRef;

    @Input()
    private mode: EditorState = EditorState.choose;	//渲染区域操作模式

    @Input()
    private hasData: boolean;				//标识时间轴是否有数据

    @Input()
    private activeOptions: List<Map<string, any>> = Immutable.List<Map<string, number>>();		//时间轴选中区域

	@Input()
	private selection: SelectionModel;		//janvas选中元素

    @Input()
    private activePageModel: PageModel;		//当前编辑的page数据

    @Input()
    private activeFrameIndex: number;       //当前渲染的帧

    @Input()
    private itemsModel: List<ItemModel>;	//素材库数据


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
        
    }

    ngOnDestroy() {

    }

    ngAfterViewInit() {
    }

    ngOnChanges(changes: SimpleChanges) {
        //编辑模式变化
        if(changes.hasOwnProperty('mode')) {
            this.modeChange(this.mode);
        }

        //页面数据变化
        if(this.timelineService.hasData() && 
        (changes.hasOwnProperty('activePageModel') || changes.hasOwnProperty('activeFrameIndex'))) {
            if(this.isJanvasInited) {
                this.janvasUpdate();
            } else {
                this.janvasInit(this.CANVAS_ELEMENT_ID);
                this.resizeHandler();
            }
        }

        //lib数据变化
        if(changes.hasOwnProperty('itemsModel')) {
            this.janvasUpdate();
        }

        if(changes.hasOwnProperty('selection')) {
            console.log('selection: ', this.selection.toJS());
            if(this.janvas) {
                this.janvas.selectElement(this.getSelectionElements())
            }
        }
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
        let data = this.makeJanvasData().toJS();
        let page: string = this.activePageModel.get('id');

        console.log('janvasUpdate: ', data, this.activeFrameIndex);

        data && this.janvas.updateJanvasData(data, {
            page: page,
            frameIndex: this.activeFrameIndex,
            elementList: this.getSelectionElements()
        });
    }

    /**
	 * janvas选中元素后操作
	 */
    private janvasSelectedHandler(selection: any[]) {
        let elements = Immutable.List<SelectionElementModel>();
        let section = this.timelineService.getSelection();
        let frameIndex;

        selection.forEach((ele) => {
            elements = elements.push(MF.g(SelectionElementModel, {
                elementId: ele.elementId,
                elementState: MF.g(ElementStateModel, ele.state),
                transformBounds: MF.g(Rectangle, ele.transformedBounds)
            }));
        });

        if(section) {
            frameIndex = section.get('frameIndex');
        } else {
            frameIndex = Math.min.apply(null, selection.map(ele => ele.frameIndex));
        }

        this.timelineService.setSelection(MF.g(SelectionModel, {
            frameIndex: frameIndex,
            elements: elements
        }));
    }

    /**
	 * janvas修改元素后操作
	 */
    private janvasChangedHandler(eleArr: any[]) {
        if(!eleArr || eleArr.length <= 0) return;
        let ao = eleArr.map(ele => {
            return {
                elementId: ele.elementId,
                start: ele.frameIndex,
                duration: 1,
            };
        });
        let fo = eleArr.map(ele => {
            return {
                elementId: ele.elementId,
                isEmptyFrame: false,
                elementState: ele.state,
            }
        });

        this.timelineService.setData(this.timelineService.setToKeyFrames(ao, fo));
    }

    /**
	 * 合成传入janvas内部的数据
	 */
	public makeJanvasData(): MainModel {
		let data: MainModel = MF.g(MainModel, {
			pages: Immutable.List<PageModel>().push(MF.g(PageModel, {
                layers: this.activePageModel
            })),
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

    private getSelectionElements(): string[] {
        return this.selection.get('elements').map(ele => ele.get('elementId')).toArray();
    }

}
