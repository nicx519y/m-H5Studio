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
import {
    MainModel, EditorState, ElementModel, ElementStateModel,
    FrameModel, PageModel, ItemModel, SelectionModel, SelectionElementModel, Rectangle, MF, TextModel
} from '../models';
import { TimelineService } from '../timeline.service';
import Developer from '../janvas/main/developer';
import { CreateTextDialogComponent } from '../create-text-dialog/create-text-dialog.component';
import { MdDialog, MdDialogRef } from '@angular/material';

import * as Immutable from 'immutable';
import { List, Map as ImmutableMap, Record } from 'immutable';

@Component({
    selector: 'ide-canvas',
    templateUrl: './canvas.component.html',
    styleUrls: ['./canvas.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements OnInit {
    private CANVAS_ELEMENT_ID = 'dev';
    private janvas: any;
    private isJanvasInited = false;
    private modeMap: Map<EditorState, any> = new Map<EditorState, any>();

    @ViewChild('dev')
    private devCanvas: ElementRef;

    @ViewChild('box')
    private box: ElementRef;

    @Input()
    private mode: EditorState = EditorState.choose;	// 渲染区域操作模式

    @Input()
    private hasData: boolean;				// 标识时间轴是否有数据

    @Input()
    private activeOptions: List<Map<string, any>> = Immutable.List<Map<string, number>>();		// 时间轴选中区域

	// tslint:disable-next-line:indent
	@Input()
	private selection: SelectionModel;		// janvas选中元素

    @Input()
    private activePageModel: PageModel;		// 当前编辑的page数据

    @Input()
    private activeFrameIndex: number;       // 当前渲染的帧

    @Input()
    private itemsModel: List<ItemModel>;	// 素材库数据

    @Input()
    private selectedObject: ImmutableMap<string, any>;

    @Input()
    private scaleNum: number;

    constructor(
        private timelineService: TimelineService,
        private container: ViewContainerRef,
        private dialog: MdDialog,
    ) {
        this.modeMap.set(EditorState.move, Developer.MODE.READ_MODE);
		this.modeMap.set(EditorState.choose, Developer.MODE.EDIT_MODE);
		this.modeMap.set(EditorState.text, Developer.MODE.TEXT_MODE);
		this.modeMap.set(EditorState.zoom, Developer.MODE.SCALE_MODE);
    }

    @HostListener('window:resize')
    private resizeHandler() {
        const w: number = this.container.element.nativeElement.offsetWidth;
        const h: number = this.container.element.nativeElement.offsetHeight;
        this.box.nativeElement.style.width = w + 'px';
        this.box.nativeElement.style.height = h + 'px';

        this.janvas && this.janvas.resizeJanvasDev(w, h);
    }

    ngOnInit() {

    }

    ngOnChanges(changes: SimpleChanges) {
        // 编辑模式变化
        if (changes.hasOwnProperty('mode')) {
            this.modeChange(this.mode);
        }

        // 页面数据变化
        if (this.timelineService.hasData() &&
        (changes.hasOwnProperty('activePageModel') || changes.hasOwnProperty('activeFrameIndex'))) {
            if (this.isJanvasInited) {
                this.janvasUpdate();
            } else {
                this.janvasInit(this.CANVAS_ELEMENT_ID);
                this.resizeHandler();
            }
        }

        // lib数据变化
        if (changes.hasOwnProperty('itemsModel')) {
            if (this.isJanvasInited) {
                this.janvasUpdate();
            }
        }

        if (changes.hasOwnProperty('selection')) {
            if (this.janvas) {
                this.janvas.selectElement(this.getSelectionElements());
            }
        }

        if (changes.hasOwnProperty('scaleNum')) {
            if (this.janvas) {
                this.janvas.setScale(this.scaleNum);
            }
        }
    }

    /**
     * janvas初始化
     */
    private janvasInit(containerId: string) {
        if (this.isJanvasInited) {
            return;
        }
        const data = this.makeJanvasData().toJS();
        this.janvas = new Developer(
            containerId,
            {
                canvasWidth: 10, // canvas width
                canvasHeight: 10, // canvas height
                data: data // janvas data
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

                target.addEventHandler(
                    Developer.EVENTS.SCALE_CHANGED,
                    this.janvasScaleHandler.bind(this)
                );

                target.addEventHandler(
                    Developer.EVENTS.TEXT_CHANGED,
                    this.janvasTextHandler.bind(this)
                );

                target.addEventHandler(
                    Developer.EVENTS.MOUSE_CHANGED,
                    this.janvasMouseHandler.bind(this)
                );

				this.isJanvasInited = true;
            }
        );
    }

    /**
     * 更新janvas，timeline数据有改变的时候更新
     */
    public janvasUpdate() {
        if (!this.isJanvasInited) {
            return;
        }
        const data = this.makeJanvasData().toJS();
        const page: string = this.activePageModel.get('id');
        console.log('janvas update: ', data);
        data && this.janvas.updateJanvasData(data, {
            page: page,
            frameIndex: this.activeFrameIndex,
            elementList: this.getSelectionElements()
        });
    }

    /**
	 * janvas选中元素后操作
     * selection : {
     *  isUserSelect: boolean,
     *  selectionElement: any[]
     * }
	 */
    private janvasSelectedHandler(selection: any[]) {
        let elements = Immutable.List<SelectionElementModel>();
        const section = this.timelineService.getSelection();
        let frameIndex;

        selection.forEach((ele) => {
            elements = elements.push(MF.g(SelectionElementModel, {
                elementId: ele.elementId,
                elementState: MF.g(ElementStateModel, ele.state),
                transformBounds: MF.g(Rectangle, ele.transformedBounds)
            }));
        });

        if (section) {
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
        if (!eleArr || eleArr.length <= 0) return;
        const ao = eleArr.map(ele => {
            return {
                elementId: ele.elementId,
                start: ele.frameIndex,
                duration: 1,
            };
        });
        const fo = eleArr.map(ele => {
            return {
                elementId: ele.elementId,
                isEmptyFrame: false,
                elementState: ele.state,
            };
        });

        this.timelineService.setData(this.timelineService.setToKeyFrames(ao, fo));
    }

    private janvasScaleHandler(scaleNum) {
        this.timelineService.setZoom(scaleNum);
    }

    private janvasTextHandler(returnObj: any) {
        if (returnObj.isDestroy) {
            this.timelineService.clearTexting();
        } else {
            // this.timelineService.setTexting(returnObj);
            console.log('text click: ', returnObj);
            // 打开新建文字文本框
            if (!returnObj.hasOwnProperty('id') || returnObj.id === '') {
                this.openCreateTextDialog(returnObj.x, returnObj.y);
            } else {
                this.timelineService.setTexting(
                    this.timelineService.getTextById(returnObj.id)
                );
            }
        }
    }

    private janvasMouseHandler(returnObj: any) {
        
    }

    /**
	 * 合成传入janvas内部的数据
	 */
	public makeJanvasData(): MainModel {
		const data: MainModel = MF.g(MainModel, {
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
		this.isJanvasInited && this.janvas.changeMode(this.modeMap.get(mode));
    }

    private getSelectionElements(): string[] {
        return this.selection.get('elements').map(ele => ele.get('elementId')).toArray();
    }

    /**
     * 打开新建文本浮层
     */
    private openCreateTextDialog(posx: number, posy: number) {
        const def: MdDialogRef<CreateTextDialogComponent> = this.dialog.open(CreateTextDialogComponent, {
            width: '400px',
            height: '200px',
            disableClose: true,
        });
        def.afterClosed().subscribe(result => {
            if (typeof result === 'string' && result !== '') {
                this.timelineService.addTextElement(result, result, new ElementStateModel({
                    x: posx,
                    y: posy,
                }));
            }
        });
    }

}
