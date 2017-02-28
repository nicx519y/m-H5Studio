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
import { MainModel, EditorState, ElementModel, ElementStateModel, FrameModel, PageModel, ItemModel, SelectionModel, SelectionElementModel, MF } from '../models';
import { TimelineService } from '../timeline.service';
import { AttrsService, AttrsMod } from '../attrs.service';
import { CanvasRenderService } from '../canvas-render.service';
import Developer from '@JDB/janvas-developer/app/main/developer';
// import { MainService } from '../main.service';

import * as Immutable from 'immutable';
import { List, Map as ImmutableMap, Record } from 'immutable';

@Component({
    selector: 'ide-canvas',
    templateUrl: './canvas.component.html',
    styleUrls: ['./canvas.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements OnInit {

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
    private itemsModel: List<ItemModel>;	//素材库数据


    constructor(
        private timelineService: TimelineService,
        private attrsService: AttrsService,
        private canvasRenderService: CanvasRenderService,
        private container: ViewContainerRef,
    ) {
    }


    @HostListener('window:resize')
    private resizeHandler() {
        let w: number = this.container.element.nativeElement.offsetWidth;
        let h: number = this.container.element.nativeElement.offsetHeight;
        this.box.nativeElement.style.width = w + 'px';
        this.box.nativeElement.style.height = h + 'px';
        this.canvasRenderService.janvasResize(w, h);
    }

    // private janvasAddedHandler(obj: any) {

    // }


    /**
     * 属性面板初始化
     */
    // private propertiesPanelSetup(selection: any[]) {
    //     if(selection.length <= 0) {
    //         this.attrsService.mod = AttrsMod.none;
    //         this.attrsService.clearData();
    //     } else {
    //         switch(this.mode) {
    //             case EditorState.choose:
    //                 (selection.length === 1)? this.singleAttrsSetting(selection): this.multiAttrsSetting(selection);
    //                 break;
    //             case EditorState.text:
    //                 this.textAttrsSetting(selection);
    //                 break;
    //             default:
    //                 this.attrsService.mod = AttrsMod.none;
    //                 this.attrsService.clearData();
    //                 break;
    //         }
    //     }
    // }

    /**
     * 单选元素面板设置
     */
    // private singleAttrsSetting(selection: any[]) {
    //     this.attrsService.mod = AttrsMod.elementProperty;
    //     let state = selection[0].state;
    //     let data = {
    //         id: selection[0].elementId,
    //         frameIndex: selection[0].frameIndex,
    //         formData: {
    //             originX: Math.round(state.originX),
    //             originY: Math.round(state.originY),
    //             x: Math.round(state.x),
    //             y: Math.round(state.y),
    //             scaleX: Math.round(state.scaleX * 100) / 100,
    //             scaleY: Math.round(state.scaleY * 100) / 100,
    //             skewX: Math.round(state.skewX * 100) / 100,
    //             skewY: Math.round(state.skewY * 100) / 100,
    //             rotation: Math.round(state.rotation),
    //             alpha: Math.round(state.alpha),
    //             transformedBounds: selection[0].transformedBounds,
    //         }
    //     };
    //     this.attrsService.setData(Immutable.fromJS(data));
    // }

    /**
     * 多选元素面板设置
     */
    // private multiAttrsSetting(selection: any[]) {
    //     this.attrsService.mod = AttrsMod.MultiProperties;
    //     let data = {
    //         ids: selection.map(ele => ele.elementId),
    //         transformedBounds: selection.map(ele => ele.transformedBounds),
    //         states: selection.map(ele => ele.state),
    //         frameIndex: selection[0].frameIndex,
    //         formData: {
    //             originX: Math.round(this.getMultiValue(selection, 'originX')),
    //             originY: Math.round(this.getMultiValue(selection, 'originY')),
    //             x: Math.round(this.getMultiValue(selection, 'x')),
    //             y: Math.round(this.getMultiValue(selection, 'y')),
    //             scaleX: Math.round(this.getMultiValue(selection, 'scaleX') * 100) / 100,
    //             scaleY: Math.round(this.getMultiValue(selection, 'scaleY') * 100) / 100,
    //             skewX: Math.round(this.getMultiValue(selection, 'skewX') * 100) / 100,
    //             skewY: Math.round(this.getMultiValue(selection, 'skewY') * 100) / 100,
    //             rotation: Math.round(this.getMultiValue(selection, 'rotation')),
    //             alpha: Math.round(this.getMultiValue(selection, 'alpha')),
    //         }
    //     };
    //     this.attrsService.setData(Immutable.fromJS(data));
    // }

    // private getMultiValue(selection: any[], key: string): number {
    //     let result;
    //     if(this.numbersIsEqual(selection.map(ele => ele.state[key]))) {
    //         result = selection[0]['state'][key];
    //     } else {
    //         result = NaN;
    //     }
    //     return result;
    // }

    /**
     * 文本面板设置
     */
    // private textAttrsSetting(selection: any[]) {

    // }

    /***
     * 判断所有数字是否相等
     */
    // private numbersIsEqual(values: number[]): boolean {
    //     let result: boolean = true;
    //     for(let i = 0; i < values.length - 1; i ++) {
    //         if(values[i] !== values[i + 1]) {
    //             result = false;
    //             break;
    //         }
    //     }
    //     return result;
    // }
    
    ngOnInit() {
        
    }

    ngOnDestroy() {

    }

    ngAfterViewInit() {
        // this.timelineService.registerElementStateCreator(this.elementStateCreator.bind(this));
    }

    ngOnChanges(changes: SimpleChanges) {
        // console.log('canvavs changes: ', changes);
        if(changes.hasOwnProperty('activePageModel') && this.hasData) {
            console.log('activePageModel: ', this.activePageModel);
        }
        if(changes.hasOwnProperty('mode')) {
            // this.canvasRenderService.modeChange(this.mode);
            console.log('canvas mode: ', this.mode);
        }
        if(changes.hasOwnProperty('activeOptions')) {
            console.log('activeOptions: ', this.activeOptions);
        }
        if(changes.hasOwnProperty('selection')) {
            console.log('selection: ', this.selection);
			//如果选取元素数据变化，同步到时间轴选取区域
			this.timelineService.setActiveOptionsFromSelection();
        }
        if(changes.hasOwnProperty('itemsModel')) {
            console.log('itemsModel: ', this.itemsModel);
			//如果时间轴选取区域变化，同步到janvas选取元素
			this.timelineService.setSelectionFromActiveOptions();
        }
    }
    
    
}
