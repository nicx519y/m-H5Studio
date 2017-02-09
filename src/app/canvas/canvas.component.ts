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
import Developer from '@JDB/janvas-developer/app/main/developer';
// import { MainService } from '../main.service';

import * as Immutable from 'immutable';
import { List, Map, Record } from 'immutable';

@Component({
    selector: 'ide-canvas',
    templateUrl: './canvas.component.html',
    styleUrls: ['./canvas.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements OnInit {
    private _activeElements: string[] = [];
    private janvas: any;

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

    private isJanvasInited: boolean;

    constructor(
        private timelineService: TimelineService,
        private attrsService: AttrsService,
        private container: ViewContainerRef,
    ) {
    }

    /**
     * element某一帧的状态生成器
     */
    public elementStateCreator(eleId: string, frameIdx: number): ElementStateModel {
        if(!this.janvas) return null;
        let data = this.makeJanvasData().toJS();
        if(!data) return null;
        this.janvas.updateJanvasData(data, {
            page: this.activePageModel.get('id'),
            frameIndex: frameIdx,
        });
        let obj = this.janvas.getElementState(eleId);
        console.log('Create ElementState: ', obj);
        return MF.g(ElementStateModel, obj);
    }

    @HostListener('window:resize')
    private janvasResize(target=null) {
        if(target == null && !this.janvas) return;
        let w: number = this.container.element.nativeElement.offsetWidth;
        let h: number = this.container.element.nativeElement.offsetHeight;
        this.box.nativeElement.style.width = w + 'px';
        this.box.nativeElement.style.height = h + 'px';
        (target || this.janvas).resizeJanvasDev(w, h);
    }

    /**
     * janvas初始化
     */
    private janvasInit() {
        if(this.isJanvasInited) return;
        let data = this.makeJanvasData().toJS();
        console.log('Before janvasInit: ', data);
        this.janvas = new Developer(
            'dev',
            {
                canvasWidth: 10, //canvas width
                canvasHeight: 10, //canvas height
                data: data //janvas data
            },
            (target) => {
                target.changeMode(Developer.MODE.READ_MODE);
                target.addEventHandler(Developer.EVENTS.ELEMENT_SELECTED, this.janvasSelectedHandler.bind(this));
                target.addEventHandler(Developer.EVENTS.ELEMENT_CHANGED, this.janvasChangedHandler.bind(this));
                // target.addEventHandler(Developer.EVENTS.ELEMENT_ADDED, this.janvasAddedHandler.bind(this));
                this.janvasResize(target);
            }
        );
        this.modeChange();
        this.isJanvasInited = true;
    }

    /**
     * 更新janvas，timeline数据有改变的时候更新
     */
    private janvasUpdate() {
        if(!this.janvas) return;
        let activeFrame: number = this.getActiveFirstFrame();
        let data = this.makeJanvasData().toJS();
        console.log('Before janvasUpdate: ', data);
        let page: string = this.activePageModel.get('id');
        data && this.janvas.updateJanvasData(data, {
            page: page,
            frameIndex: Math.max(0, activeFrame),
            elementList: this.activeOptions.map(ao => ao.get('elementId')).toArray()
        });
    }

    /**
     * 面板操作模式改变
     */
    private modeChange() {
        let mode = this.mode;
        if(this.janvas) {
            switch(mode) {
                case EditorState.none:
                    this.janvas.changeMode(Developer.MODE.READ_MODE);
                    break;
                case EditorState.choose:
                    this.janvas.changeMode(Developer.MODE.EDIT_MODE);
                    break;
                case EditorState.text:
                    this.janvas.changeMode(Developer.MODE.TEXT_MODE);
                    break;
                case EditorState.zoom: 
                    //...todo
                    break;
                case EditorState.draw:
                    this.janvas.changeMode(Developer.MODE.DRAW_MODE);
                    break;
            }
        }
    }

    /**
     * 合成传入janvas内部的数据
     */
    private makeJanvasData(): MainModel {
        let data: MainModel = MF.g(MainModel, {
            pages: Immutable.List<PageModel>().push(this.activePageModel),
            library: this.itemsModel,
        });
        
        return data;
    }

    /**
     * janvas selected 事件触发
     */
    private janvasSelectedHandler(selection: any[]) {
        console.log('Janvas developer seleted event!', selection);
        //设置属性面板的展现
        this.propertiesPanelSetup(selection);

        if(selection && selection.length > 0) {
            let minFrame: number = Math.min.apply(null, selection.map(ele => ele.frameIndex));
            let eleList: string[] = selection.map(ele => ele.elementId);
            let thisEleList: string[] = this.getActiveElement();

            //事件返回的选中的element和现有的完全一致 最小帧和现在的最小帧一致
            if(eleList.length == thisEleList.length
                && Math.min.apply(null, eleList.map(ele => thisEleList.indexOf(ele))) >= 0
                && minFrame == this.getActiveFirstFrame()) {
                return;
            }

            let opt = selection.map(ele => { 
                return { elementId: ele.elementId, start: ele.frameIndex, duration: 1 };
            });
            
            if(opt.length >= 0)
                this.timelineService.setActiveOptions(opt, false);
        }
    }

    /**
     * janvas change event触发
     */
    private janvasChangedHandler(eleArr: any[]) {
        if(!eleArr || eleArr.length <= 0) return;
        let ao = eleArr.map(ele => {
            return {
                elementId: ele.id,
                start: ele.frameIndex,
                duration: 1,
            };
        });
        let fo = eleArr.map(ele => {
            return {
                elementId: ele.id,
                isEmptyFrame: false,
                elementState: ele.state,
            }
        });
        this.timelineService.setTimelineData(this.timelineService.setToKeyFrames(ao, fo));
    }

    // private janvasAddedHandler(obj: any) {

    // }

    /**
	 * 获取active状态的最小帧，最小值0，默认0
	 */
	private getActiveFirstFrame(ao: List<Map<string, any>> = null): number {
        if(!ao) ao = this.activeOptions;
		if(ao.size <= 0) return -1;
		return Math.max(Math.min.apply(null, ao.map(ao => ao.get('start')).toArray()));
	}

    /**
     * 获取当前active的 element
     */
    private getActiveElement(ao: List<Map<string, any>> = null): string[] {
        if(!ao) ao = this.activeOptions;
        return ao.map(a => a.get('elementId')).toArray();
    }

    /**
     * timeline active数据改变触发
     */
    private activeOptionsChangeHandler(changes: SimpleChange) {
        if(changes.isFirstChange()
        || this.getActiveFirstFrame(changes.currentValue) !== this.getActiveFirstFrame(changes.previousValue)) {
            this.janvasUpdate();
        } else {
            this.janvas && this.janvas.selectElement(this.getActiveElement());
        }
    }

    /**
     * 属性面板初始化
     */
    private propertiesPanelSetup(selection: any[]) {
        if(selection.length <= 0) {
            this.attrsService.mod = AttrsMod.none;
            this.attrsService.clearData();
        } else {
            switch(this.mode) {
                case EditorState.choose:
                    (selection.length === 1)? this.singleAttrsSetting(selection): this.multiAttrsSetting(selection);
                    break;
                case EditorState.text:
                    this.textAttrsSetting(selection);
                    break;
                default:
                    this.attrsService.mod = AttrsMod.none;
                    this.attrsService.clearData();
                    break;
            }
        }
    }

    /**
     * 单选元素面板设置
     */
    private singleAttrsSetting(selection: any[]) {
        this.attrsService.mod = AttrsMod.elementProperty;
        let state = selection[0].state;
        let data = {
            id: selection[0].elementId,
            frameIndex: selection[0].frameIndex,
            originX: Math.round(state.originX),
            originY: Math.round(state.originY),
            x: Math.round(state.x),
            y: Math.round(state.y),
            scaleX: Math.round(state.scaleX * 100) / 100,
            scaleY: Math.round(state.scaleY * 100) / 100,
            skewX: Math.round(state.skewX * 100) / 100,
            skewY: Math.round(state.skewY * 100) / 100,
            rotation: Math.round(state.rotation),
            alpha: Math.round(state.alpha),
            transformedBounds: selection[0].transformedBounds,
        };
        this.attrsService.setData(Immutable.fromJS(data));
    }

    /**
     * 多选元素面板设置
     */
    private multiAttrsSetting(selection: any[]) {
        this.attrsService.mod = AttrsMod.MultiProperties;
        let data = {
            frameIndex: selection[0].frameIndex,
            originX: Math.round(this.getMultiValue(selection, 'originX')),
            originY: Math.round(this.getMultiValue(selection, 'originY')),
            x: Math.round(this.getMultiValue(selection, 'x')),
            y: Math.round(this.getMultiValue(selection, 'y')),
            scaleX: Math.round(this.getMultiValue(selection, 'scaleX') * 100) / 100,
            scaleY: Math.round(this.getMultiValue(selection, 'scaleY') * 100) / 100,
            skewX: Math.round(this.getMultiValue(selection, 'skewX') * 100) / 100,
            skewY: Math.round(this.getMultiValue(selection, 'skewY') * 100) / 100,
            rotation: Math.round(this.getMultiValue(selection, 'rotation')),
            alpha: Math.round(this.getMultiValue(selection, 'alpha')),
            transformedBounds: selection.map(ele => ele.transformedBounds),
        };
        this.attrsService.setData(Immutable.fromJS(data));
    }

    private getMultiValue(selection: any[], key: string): number {
        let result;
        if(this.numbersIsEqual(selection.map(ele => ele.state[key]))) {
            result = selection[0]['state'][key];
        } else {
            result = NaN;
        }
        return result;
    }

    /**
     * 文本面板设置
     */
    private textAttrsSetting(selection: any[]) {

    }

    /***
     * 判断所有数字是否相等
     */
    private numbersIsEqual(values: number[]): boolean {
        let result: boolean = true;
        for(let i = 0; i < values.length - 1; i ++) {
            if(values[i] !== values[i + 1]) {
                result = false;
                break;
            }
        }
        return result;
    }
    
    ngOnInit() {
        
    }

    ngOnDestroy() {
        this.janvas.removeEventHandler(Developer.EVENTS.ELEMENT_SELECTED, this.janvasSelectedHandler.bind(this));
        this.janvas.removeEventHandler(Developer.EVENTS.ELEMENT_CHANGED, this.janvasChangedHandler.bind(this));
        // this.janvas.removeEventHandler(Developer.EVENTS.ELEMENT_ADDED, this.janvasAddedHandler.bind(this));
    }

    ngAfterViewInit() {
        this.timelineService.registerElementStateCreator(this.elementStateCreator.bind(this));
    }

    ngOnChanges(changes: SimpleChanges) {
        if(changes.hasOwnProperty('hasData') && this.hasData === true) {
            this.janvasInit();
        }
        if(changes.hasOwnProperty('activePageModel') && this.hasData) {
            this.janvasUpdate();
        }
        if(changes.hasOwnProperty('mode')) {
            this.modeChange();
        }
        if(changes.hasOwnProperty('activeOptions')) {
            this.activeOptionsChangeHandler(changes['activeOptions']);
        }
    }
    
    
}
