import { Injectable, QueryList, Output, EventEmitter } from '@angular/core';
import { 
	MF,
	ItemModel,
	ItemType,
	PageModel,
	LayerModel,
	FrameModel,
	ElementModel,
	SelectionElementModel,
	SelectionModel,
	ActiveRangeModel,
	ActiveOptionModel,
	ElementStateModel,
	TweenModel,
	TweenType,
	LayerType,
	ElementType,
	TextModel,
	BackgroundModel,
} from './models';
import { PagesService } from './pages.service';
import { ItemsService } from './items.service';
import * as Immutable from 'immutable';
import { List, Map, Record } from 'immutable';

export enum TimelineDataType {
	Page,
	Movieclip,
};

@Injectable()
export class TimelineService {

	private _selection: SelectionModel = new SelectionModel();									//用于跟janvas交互的选取元素
	private _texting: TextModel = null;														//当前编辑的文本
	private _zoom: number = NaN;																//当前视图缩放比例
	private _activeOptions: ActiveOptionModel = new ActiveOptionModel();		//时间轴的选中区域
	private _currentFrame: number = 0;
	private _dataType: TimelineDataType;														//数据类型，标识是page数据还是item数据，或者其他的可编辑元素
	private _dataGetter: Function;																	//数据来源
	private _dataId: string;	
	private _dataName: string = '';																//数据id

	constructor(
		private pagesService: PagesService,
		private itemsService: ItemsService,
	) {
		
	}

	/**
	 * 注册数据来源
	 */
	public registerDataSource(dataGetter: Function, dataId: string) {
		this._dataGetter = dataGetter;
		this._dataId = dataId;
		this._dataName = '';
		let data: any = dataGetter(dataId);
		if(data instanceof PageModel) {
			this._dataType = TimelineDataType.Page;
		} else if(data instanceof ItemModel) {
			this._dataType = TimelineDataType.Movieclip;
		}
	}

	public getDataId(): string {
		return this._dataId;
	}

	public getDataType(): TimelineDataType {
		return this._dataType;
	}

	public getDataName(): string {
		if(this._dataName === '' && this._dataGetter) {
			return this._dataGetter(this._dataId).get('name');
		} else {
			return this._dataName;
		}
	}

	/**
	 * 判断是否有数据
	 */
	public hasData(): boolean {
		return (this.getData() !== null);
	}

	/**
	 * 获取图层数据
	 */
	public getData(): List<LayerModel> {
		if(this._dataType === TimelineDataType.Page) {
			return this._dataGetter(this._dataId).get('layers');
		} else if(this._dataType === TimelineDataType.Movieclip) {
			return this._dataGetter(this._dataId).getIn(['source', 'layers']);
		} else {
			return null;
		}
	}

	/**
	 * 设置图层数据
	 * @param data 图层数据
	 */
	public setData(data: List<LayerModel>) {
		if(this._dataType === TimelineDataType.Page) {
			this.pagesService.setPageById(
				this.pagesService.getPageById(this._dataId).set('layers', data),
				this._dataId
			);
		} else {
			this.itemsService.setItemById(
				this.itemsService.getItemById(this._dataId).setIn(['source', 'layers'], data),
				this._dataId
			);
		}

		this.resetActiveFrameIndexByActiveOptions();
	}

	/**
	 * 获取当前zoom值
	 */
	public getZoom(): number {
		return this._zoom;
	}

	/**
	 * 设置场景缩放
	 * @param zoom 场景缩放值
	 */
	public setZoom(zoom: number) {
		this._zoom = zoom;
	}

	/**
	 * 获取正在选中的元素信息
	 */
	public getSelection(): SelectionModel {
		return this._selection;
	}

	/**
	 * 设置正在选中的元素信息
	 */
	public setSelection(selection: SelectionModel) {
		if(!Immutable.fromJS(selection.toJS()).equals(Immutable.fromJS(this._selection.toJS()))) {
			this._selection = selection;
			console.log('selection change: ', this._selection.toJS());
			if(this._selection.get('isUserSelect') === true) {
				this._activeOptions = this.selectionToActiveOptions();
			}
		}
	}

	/**
	 * 获取正在选中的文本信息
	 */
	public getTexting(): TextModel {
		return this._texting;
	}

	/**
	 * 设置正在选中的文本信息
	 */
	public setTexting(texting: TextModel) {
		this._texting = texting;
	}

	/**
	 * 清除
	 */
	public clearTexting() {
		this._texting = null;
	}

	/**
	 * 根据element id获取text source
	 */
	public getTextById(id: string): TextModel {
		let layer: LayerModel = this.getData().find(layer => layer.getIn(['element', 'id']) === id);
		if(layer) {
			return layer.getIn(['element', 'source']);
		} else {
			return undefined;
		}
	}

	/**
	 * 根据element id设置text source
	 */
	public setTextById(id: string, text: TextModel) {
		let tmpText: TextModel = this.getTextById(id);
		if(tmpText === undefined) return;
		let data: List<LayerModel> = this.getData();
		let layerIdx: number = data.findIndex(layer => layer.getIn(['element', 'id']) === id);
		this.setData(data.setIn([layerIdx, 'element', 'source'], text));
	}

	public setTextByTextId(id: string, text: TextModel) {
		let eleId: string = this.getData().find(layer => layer.getIn(['element', 'source', 'id']) === id).getIn(['element', 'id']);
		this.setTextById(eleId, text);
	}

	/**
	 * 获取选中帧状态
	 */
	public getActiveOptions(): ActiveOptionModel {
		return this._activeOptions;
	}

	/**
	 * 重置选中帧状态
	 */
	public resetActiveOptions(isUserActive: boolean = true) {
		this.setActiveOptions([], true, isUserActive);
	}

	/**
	 * 设置选中帧状态
	 * @param options 选中帧options
	 * @param isRange 是否成区域
	 */
	public setActiveOptions(
		options: any[],
		isRange: boolean = true,
		isUserActive = true,
	) {
		let ao: List<ActiveRangeModel> = Immutable.List<ActiveRangeModel>();
		if(isRange) {
			let range = options as number[];
			if(range.length < 4) {
				this.resetActiveOptions();
				return;
			}
			let frame1 = Math.min(range[0], range[2]);
			let layer1 = Math.min(range[1], range[3]);
			let frame2 = Math.max(range[0], range[2]);
			let layer2 = Math.max(range[1], range[3]);
			this.getData().forEach((layer, index) => {
				(index >= layer1 && index <= layer2) &&
				(ao = ao.push(new ActiveRangeModel({
					elementId: layer.getIn(['element', 'id']),
					start: frame1,
					duration: frame2 - frame1 + 1,
				})));
			});
			//设置当前播放的帧
			this.setActiveFrameIndex(range[2]);
		} else {
			options.forEach(opt => ao = ao.push(new ActiveRangeModel(opt)));
		}

		let activeOptions: ActiveOptionModel = new ActiveOptionModel({
			isUserActive: isUserActive,
			ranges: ao
		});

		if(!Immutable.is(activeOptions, this._activeOptions)) {
			this._activeOptions = activeOptions;
			console.log('active options change: ', this._activeOptions.toJS());
			//根据active options的改变，改变selection
			if(this._activeOptions.get('isUserActive') === true) {
				this._selection = this.activeOptionsToSelection();
			}
		}
	}

	/**
	 * 获取当前active的帧
	 */
	public getActiveFrameIndex(): number {
		return this._currentFrame;
	}

	/**
	 * 设置当前播放的帧
	 * @param idx 设置的帧数
	 */
	private setActiveFrameIndex(idx: number = 0) {
		this._currentFrame = Math.min(Math.max(idx, 0), this.getFrameCount() - 1);
	}

	/**
	 * 根据帧的选中状态重设当前播放帧
	 */
	private resetActiveFrameIndexByActiveOptions() {
		this.setActiveFrameIndex(Math.max.apply(null, this._activeOptions.get('ranges').toJS().map(opt => opt.start + opt.duration - 1)));
	}

	/***
	 * active options 到 selection 的换算关系
	 */
	private activeOptionsToSelection(): SelectionModel {
		let elementIds: string[] = this.getElementsOfActiveRangesInCurrentFrame();
		let elements: Immutable.List<SelectionElementModel> = Immutable.fromJS(elementIds.map(id => new SelectionElementModel({ elementId: id }))).toList();
		return new SelectionModel({
			elements: elements,
			isUserSelect: false,
		});
	}

	/**
	 * selection 到 active options 的换算关系
	 */
	private selectionToActiveOptions(): ActiveOptionModel {
		let result = Immutable.List<ActiveRangeModel>();
		// let frameIndex: number = this._selection.get('frameIndex');
		let framesObj = this.getNearKeyFrames(this._currentFrame);
		this._selection.get('elements').forEach(element => {
			let elementId: string = element.get('elementId');
			let frame = framesObj[elementId];
			let ele = {
				elementId: elementId,
				start: frame ? frame.get('index') : -1,
				duration: frame ? frame.get('duration') : 0,
			};
			result = result.push(new ActiveRangeModel(ele));
		});
		return new ActiveOptionModel({
			isUserActive: false,
			ranges: result
		});
	}

	/**
	 * 获取和当前帧最接近的帧
	 */
	private getNearKeyFrames(currentFrame: number) {
		let obj = {};
		let data = this.getData();
		if(!data) return null;
		this.getData().forEach(layer => {
			obj[layer.getIn(['element', 'id'])] = layer.get('frames').findLast(frame => frame.get('index') <= currentFrame);
		});
		return obj;
	}

	/**
	 * 获取总帧长
	 */
	public getFrameCount(): number {
		if(!this.getData() || this.getData().size <= 0) return 0;
		let count: number = 0;
		this.getData().forEach(layer => count = Math.max(count, layer.get('frameCount')));
		return count;
	}

	/**
	 * 增加一个element
	 */
	public addElement(element: ElementModel, layerName: string = 'New Element', firstFrameState: ElementStateModel = new ElementStateModel()) {
		if(!this.hasData()) return;
		console.log(firstFrameState.toJS());
		this.setData(
			this.getData().push(
				MF.g(LayerModel, {
					name: layerName,
					element: element,
					frames: Immutable.List().push(MF.g(FrameModel, {
						elementState: firstFrameState
					})),
					frameCount: 1,
				})
			)
		);
	}

	/**
	 * 增加一个text element
	 */
	public addTextElement(text: string, layerName: string = 'New Text', firstFrameState: ElementStateModel = new ElementStateModel()) {
		let newElement: ElementModel = ElementModel.fromText(MF.g(TextModel, { text: text }));
		this.addElement(newElement, layerName, firstFrameState);
	}

	/**
	 * 删除元素
	 * @param elementId 元素id
	 */
	public removeElement(elementId: string) {
		if(!this.hasData()) return;
		let model: List<LayerModel> = this.getData();
		this.setData(
			model.remove(model.findIndex(layer => layer.get('id') === elementId))
		);
	}

	/**
	 * 批量删除elements
	 */
	public removeElements(eleIds: string[]) {
		let data: List<LayerModel> = Immutable.List<LayerModel>();
		data = this.getData().filter(layer => eleIds.indexOf(layer.getIn(['element', 'id'])) < 0).toList();
		(!Immutable.is(Immutable.fromJS(this.getData().toJS()), Immutable.fromJS(data).toJS())) && (this.setData(data));
	}

	/**
	 * 交换两个元素图层位置
	 * @param eleId1 元素1的id
	 * @param eleId2 元素2的id
	 */
	public swapElements(eleId1: string, eleId2: string) {
		let idx1: number = this.getData().findIndex(layer => layer.getIn(['element', 'id']) === eleId1);
		let idx2: number = this.getData().findIndex(layer => layer.getIn(['element', 'id']) === eleId2);
		if(idx1 >= 0 && idx2 >= 0) {
			let layer1 = this.getData().get(idx1);
			let layer2 = this.getData().get(idx2);
			this.setData(this.getData().set(idx2, layer1).set(idx1, layer2));
		}
	}

	/**
	 * 向上移动元素的图层位置
	 * @param elementIds 元素id集合
	 */
	public upElements(elementIds: string[]) {
		let eleIdxs: number[] = elementIds.map(id => this.getData().findIndex(layer => layer.getIn(['element', 'id']) === id));
		eleIdxs = eleIdxs.sort((a, b) => {
			if(a < b)
				return -1;
			else if(a > b)
				return 1;
			else
				return 0;
		});
		if(eleIdxs[0] <= 0) return;

		let newIdxs: number[] = [];
		for(let i = 0; i < this.getData().size; i ++) {
			newIdxs[i] = i;
			if(eleIdxs.indexOf(i) >= 0) 
				this.swapArray(newIdxs, i, i - 1);
		}

		let tempData = Immutable.List<LayerModel>();
		newIdxs.forEach(idx => tempData = tempData.push(this.getData().get(idx)));
		this.setData(tempData);
	}

	/**
	 * 向下移动元素图层位置
	 * @param elementIds 元素id集合
	 */
	public downElements(elementIds: string[]) {
		let eleIdxs: number[] = elementIds.map(id => this.getData().findIndex(layer => layer.getIn(['element', 'id']) === id));
		eleIdxs = eleIdxs.sort((a, b) => {
			if(a < b)
				return -1;
			else if(a > b)
				return 1;
			else
				return 0;
		});
		if(eleIdxs[eleIdxs.length - 1] >= this.getData().size - 1) return;

		let newIdxs: number[] = [];
		for(let i = this.getData().size - 1; i >= 0; i --) {
			newIdxs[i] = i;
			if(eleIdxs.indexOf(i) >= 0) 
				this.swapArray(newIdxs, i, i + 1);
		}
		
		let tempData = Immutable.List<LayerModel>();
		newIdxs.forEach(idx => tempData = tempData.push(this.getData().get(idx)));
		this.setData(tempData);
	}

	/**
	 * 设置关键帧
	 * @param options 帧的开始和结束
	 * @param frameOptions 帧属性
	 */
	public setToKeyFrames(options: {
		elementId: string,
		start: number,
		duration: number,
	}[], frameOptions: {
		elementId: string,
		isEmptyFrame: boolean,
		elementState?: ElementStateModel,
	}[] | {
		isEmptyFrame: boolean,
		elementState?: null
	} = {
		isEmptyFrame: false,
		elementState: null
	}): List<LayerModel> {
		if(!frameOptions) return;
		let fos: any;
		console.log('setToKeyFrame: ', options, frameOptions);
		
		if(!frameOptions.hasOwnProperty('length')) {
			let fo = frameOptions;
			fos = options.map(opt => {
				return {
					elementId: opt.elementId,
					isEmptyFrame: fo['isEmptyFrame'],
					elementState: fo['elementState'] || null
				}
			});
		} else if(frameOptions['length'] != options.length) {
			return;
		} else {
			fos = frameOptions;
		}
		
		let data: List<LayerModel> = this.changeToFrames(options)
			.map(layer => {
				let obj = options.find(opt => opt.elementId === layer.getIn(['element', 'id']));
				if(!obj) return layer;
				let frames: List<FrameModel> = layer.get('frames');
				let eleId: string = layer.getIn(['element', 'id']);
				for(let i = obj.start; i <= obj.start + obj.duration - 1; i ++) {
					let fidx: number = frames.findIndex(frame => frame.get('index') === i);
					let frameOption = fos.find(opt => opt.elementId === eleId);
					if(fidx >= 0) {
						let frame: FrameModel = frames.get(fidx).set('isEmptyFrame', frameOption.isEmptyFrame);
						if(frameOption.isEmptyFrame) {
							frame = frame
								.set('tweenType', TweenType.none)
								.set('tween', MF.g(TweenModel))
								.set('elementState', frameOption['elementState']);
						} else {
							frame = frame
								.set('elementState', frameOption['elementState']);
						}
						// frame = this.createElementStateOfKeyFrame(frame, eleId, i, frameOption.elementState);
						frames = frames.set(fidx, frame);
					} else {
						let newFrame: FrameModel;
						//克隆上一个关键帧，作为新的关键帧
						if(!frameOption.isEmptyFrame) {
							let lastFrame: FrameModel = frames.findLast(frame => frame.get('index') < i);
							newFrame = MF.g(FrameModel, {
								index: i,
								isKeyFrame: true,
								isEmptyFrame: false,
								tween: lastFrame.get('tween'),
								tweenType: lastFrame.get('tweenType'),
								elementState: frameOption['elementState']
							})
						} else {
							newFrame = MF.g(FrameModel, {
								isEmptyFrame: frameOption.isEmptyFrame,
								index: i,
								tweenType: TweenType.none,
								tween: MF.g(TweenModel),
								elementState: frameOption['elementState'],
							});
						}
						// newFrame = this.createElementStateOfKeyFrame(newFrame, eleId, i, frameOption.elementState);
						frames = frames.insert(frames.findLastIndex(frame => frame.get('index') < i) + 1, newFrame);
					}
				}
				return layer.set('frames', frames);
			}).toList();


		return this.resetDuration(data);
	}

	/**
	 * 设置玮帧
	 * @param options 帧长度属性
	 */
	public changeToFrames(options: {
		elementId: string,
		start: number,
		duration: number,
	}[]): List<LayerModel> {
		let data: List<LayerModel> = this.getData().map(layer => {
			let obj = options.find(opt => opt.elementId === layer.getIn(['element', 'id']));
			if(obj)
				return layer.set('frameCount', Math.max(layer.get('frameCount'), obj.start + obj.duration));
			else
				return layer;
		}).toList();
		return this.resetDuration(data);
	}

	/**
	 * 删除关键帧
	 * @param options 
	 */
	public removeKeyFrames(options: {
		elementId: string,
		start: number,
		duration: number,
	}[]): List<LayerModel> {
		let data: List<LayerModel> = this.getData().map(layer => {
			let obj = options.find(opt => opt.elementId === layer.getIn(['element', 'id']));
			if(!obj) return layer;
			let idx: number = obj.start;
			let idx2: number = obj.start + obj.duration - 1;
			let frames: List<FrameModel> = layer.get('frames');
			for(let i = idx; i <= idx2; i ++) {
				let n: number = frames.findIndex(frame => frame.get('index') === i);
				if(n >= 0)
					frames = frames.delete(n);
			}
			return layer.set('frames', frames);
		}).toList();
		return this.resetDuration(data);
	}

	/**
	 * 删除帧
	 * @param options 
	 */
	public removeFrames(options: {
		elementId: string,
		start: number,
		duration: number,
	}[]): List<LayerModel> {
		let data: List<LayerModel> = this.removeKeyFrames(options)
			.map(layer => {
				let obj = options.find(opt => opt.elementId === layer.getIn(['element', 'id']));
				if(!obj) return layer;
				let count: number = layer.get('frameCount');
				if(obj.start > count - 1) return layer;
				let lastIndex: number = Math.min(count - 1, obj.start + obj.duration -1);
				let dur: number = lastIndex - obj.start + 1;
				layer = layer.set('frameCount', layer.get('frameCount') - dur);
				let frames: List<FrameModel> = layer.get('frames')
					.map(frame => {
						let idx: number = frame.get('index');
						if(idx > obj.start + obj.duration - 1) {
							frame = frame.set('index', idx - dur);
						}
						return frame;
					}).toList();
				
				return layer.set('frames', frames);
			}).toList();
		return this.resetDuration(data);
	}

	/**
	 * 设置帧动画
	 * @param options 
	 * @param tweenOptions 
	 */
	public setTweens(options: {
		elementId: string,
		start: number,
		duration: number,
	}[], tweenOptions: {
		type: TweenType,
		tween: TweenModel,
	} = {
		type: TweenType.normal,
		tween: MF.g(TweenModel)
	}): List<LayerModel> {
		let data: List<LayerModel> = this.getData().map(layer => {
			let obj = options.find(opt => opt.elementId === layer.getIn(['element', 'id']));
			if(!obj) return layer;
			let idx: number = obj.start;
			let idx2: number = obj.start + obj.duration - 1;
			let frames: List<FrameModel> = layer.get('frames');
			for(let i = idx; i <= idx2; i ++) {
				let fidx: number = frames.findIndex(
					frame => frame.get('index') <= i 
					&& frame.get('index') + frame.get('duration') - 1 >= i 
					&& (frame.get('tweenType') !== tweenOptions.type
					|| !Immutable.is(frame.get('tween'), tweenOptions.tween))
				);
				if(fidx >= 0) {
					frames = frames.setIn([fidx, 'tweenType'], tweenOptions.type);
					frames = frames.setIn([fidx, 'tween'], tweenOptions.tween);
				}
			}
			return layer.set('frames', frames);
		}).toList();
		return data;
	}

	/**
	 * 移动帧
	 * @param idxs 
	 * @param eleIds 
	 */
	public moveFrames(idxs: number[], eleIds: string[]) {
		//...todo
	}

	/**
	 * 在当前帧以及在当前选区范围内，获取存在的element
	 */
	private getElementsOfActiveRangesInCurrentFrame(): string[] {
		if(this._activeOptions.get('ranges').size <= 0) {
			return[];
		}

		let ranges: List<ActiveRangeModel> = this._activeOptions.get('ranges');
		let layers: List<LayerModel> = this.getData().filter(layer => {
			let range: ActiveRangeModel = ranges.find(range => range.get('elementId') === layer.getIn(['element', 'id']));
			if(!range || this._currentFrame < range.get('start') || this._currentFrame >= range.get('start') + range.get('duration')) {
				return false;
			}
			let isEmpty: boolean = this.isEmptyInFrames(layer.get('frames'), this._currentFrame);
			console.log('isEmpty: ', isEmpty);
			return (!isEmpty);
		}).toList();

		return layers.map(layer => layer.getIn(['element', 'id'])).toJS();
	}

	/**
	 * 判断在一个帧的集合中，某一帧是否是空帧
	 * @param frames 帧的集合 
	 * @param frameIndex 要判断的帧序号
	 */
	private isEmptyInFrames(frames: List<FrameModel>, frameIndex: number): boolean {
		let result: boolean = true;
		for(let i = 0; i < frames.size; i ++) {
			let frame = frames.get(i);
			if(frame.get('isEmptyFrame') === false 
				&& frameIndex >= frame.get('index') 
					&& frameIndex < frame.get('index') + frame.get('duration')) {
				result = false;
				break;
			}
		}
		return result;
	}

	/**
	 * 重新计算所有帧的duration
	 * @param options 
	 * @returns 返回所有重设后的图层数据
	 */
	private resetDuration(options: List<LayerModel>): List<LayerModel> {
		return options.map(layer => {
			let frames: List<FrameModel> = layer.get('frames');
			frames = frames.map((frame, idx) => {
				let dur: number;
				if(idx < frames.size - 1) {
					let next = frames.get(idx + 1);
					dur = next.get('index') - frame.get('index');
				} else {
					dur = layer.get('frameCount') - frame.get('index');
				}
				frame = frame.set('duration', dur);
				if(frame.has('tween') && frame.get('tween')) {
					frame = frame.setIn(['tween', 'duration'], dur);
				}
				return frame;
			}).toList();
			return layer.set('frames', frames);
		}).toList();
	}

	private swapArray(arr: any[], idx1: number, idx2: number) {
		let e1 = arr[idx1];
		let e2 = arr[idx2];
		arr[idx1] = e2;
		arr[idx2] = e1;
	}
	
}