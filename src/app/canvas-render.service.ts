import { Injectable, SimpleChange } from '@angular/core';
import { MF, MainModel, PageModel, ItemModel, ElementStateModel, ElementModel, EditorState } from './models';
import Developer from '@JDB/janvas-developer/app/main/developer';
import * as Immutable from 'immutable';
import { List, Record, Map as ImmutableMap } from 'immutable';

@Injectable()
export class CanvasRenderService {

	private isJanvasInited: boolean;
	private janvas: any;
	public itemsModel: List<ItemModel> = List<ItemModel>();
	public activePageModel: PageModel;
	public activeOptions: List<any> = Immutable.List<any>();
	//在janvas中被选取的element
	private janvasSelectedElements: List<ImmutableMap<string, any>> = Immutable.List<ImmutableMap<string, any>>();
	//在janvas中改变的element
	private janvasChangedElements: List<ImmutableMap<string, any>> = Immutable.List<ImmutableMap<string, any>>();
	private modeMap: Map<EditorState, any> = new Map<EditorState, any>();

	constructor() {
		this.modeMap.set(EditorState.none, Developer.MODE.READ_MODE);
		this.modeMap.set(EditorState.choose, Developer.MODE.EDIT_MODE);
		this.modeMap.set(EditorState.text, Developer.MODE.TEXT_MODE);
		this.modeMap.set(EditorState.draw, Developer.MODE.DRAW_MODE);
	}

	public getJanvasInstance(): any {
		return this.janvas;
	}

	public getJanvasIsInited(): boolean {
		return this.isJanvasInited;
	}

	/**
     * janvas初始化
     */
    public janvasInit(containerId: string) {
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
                // target.changeMode(Developer.MODE.READ_MODE);
				this.modeChange();
                target.addEventHandler(Developer.EVENTS.ELEMENT_SELECTED, this.janvasSelectedHandler.bind(this));
                target.addEventHandler(Developer.EVENTS.ELEMENT_CHANGED, this.janvasChangedHandler.bind(this));
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
		console.log('janvas update: ', data, Math.max(0, activeFrame));
        data && this.janvas.updateJanvasData(data, {
            page: page,
            frameIndex: Math.max(0, activeFrame),
            elementList: this.activeOptions.map(ao => ao.get('elementId')).toArray()
        });
    }

	public janvasResize(width: number, height: number) {
        if(!this.isJanvasInited) return;
        this.janvas.resizeJanvasDev(width, height);
    }

	/**
	 * element某一帧的状态生成器
	 */
	public elementStateCreator(eleId: string, frameIdx: number): ElementStateModel {
		if(!this.isJanvasInited) return;
		let data = this.makeJanvasData().toJS();
		if (!data) return null;
		this.janvas.updateJanvasData(data, {
			page: this.activePageModel.get('id'),
			frameIndex: frameIdx,
		});
		let obj = this.janvas.getElementState(eleId);
		return MF.g(ElementStateModel, obj);
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
	 * 获取active状态的最小帧，最小值0，默认0
	 */
	public getActiveFirstFrame(ao: List<Map<string, any>> = null): number {
        if(!ao) ao = this.activeOptions;
		if(ao.size <= 0) return -1;
		return Math.max(Math.min.apply(null, ao.map(ao => ao.get('start')).toArray()));
	}

	/**
     * 获取当前active的 element
     */
    public getActiveElements(ao: List<Map<string, any>> = null): string[] {
        if(!ao) ao = this.activeOptions;
        return ao.map(a => a.get('elementId')).toArray();
    }

	/**
     * 面板操作模式改变
     */
    public modeChange(mode: EditorState = EditorState.choose) {
		this.isJanvasInited && this.janvas.changeMode(this.modeMap[mode]);
    }

	/**
	 * 获取选中状态的元素 
	 */
	public getSelectedElements() {
		return this.janvasSelectedElements;
	}

	/**
     * janvas selected 事件触发
     */
    private janvasSelectedHandler(selection: any[]) {
		console.log('selected handler: ', selection);
        //设置属性面板的展现
        // this.propertiesPanelSetup(selection);
        // if(selection && selection.length > 0) {
            let minFrame: number = Math.min.apply(null, selection.map(ele => ele.frameIndex));
            let eleList: string[] = selection.map(ele => ele.elementId);
            let thisEleList: string[] = this.getActiveElements();

			// console.log(eleList.length == thisEleList.length, Math.min.apply(null, eleList.map(function (ele) { return thisEleList.indexOf(ele); })) >= 0, minFrame == this.getActiveFirstFrame());

            // 事件返回的选中的element和现有的完全一致 最小帧和现在的最小帧一致
            if(eleList.length == thisEleList.length
                && Math.min.apply(null, eleList.map(ele => thisEleList.indexOf(ele))) >= 0
                && minFrame == this.getActiveFirstFrame()) {
                return;
            }

			let newSelectedElements: List<any> = Immutable.fromJS(selection.map(ele => {
				return { elementId: ele.elementId, frameIndex: ele.frameIndex, duration: 1 };
			}));

			this.janvasSelectedElements = newSelectedElements;

			// this.janvasSelectedElements = Immutable.fromJS(selection.map(ele => {
			// 	return { elementId: ele.elementId, frameIndex: ele.frameIndex, duration: 1 };
			// }));

            // let opt = selection.map(ele => { 
            //     return { elementId: ele.elementId, start: ele.frameIndex, duration: 1 };
            // });
            
            // if(opt.length >= 0)
            //     this.timelineService.setActiveOptions(opt, false);

        // } else {

		// }
    }

    /**
     * janvas change event触发
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
        // this.timelineService.setTimelineData(this.timelineService.setToKeyFrames(ao, fo));
    }

	/**
     * timeline active数据改变触发
     */
    public activeOptionsChange(changes: SimpleChange) {
        if(changes.isFirstChange()
        || this.getActiveFirstFrame(changes.currentValue) !== this.getActiveFirstFrame(changes.previousValue)) {
            this.janvasUpdate();
        } else {
            this.janvas && this.janvas.selectElement(this.getActiveElements());
        }
    }

}
