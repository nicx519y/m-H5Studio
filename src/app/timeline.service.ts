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
	private _activeOptions: List<Immutable.Map<string, number>> = Immutable.List<Immutable.Map<string, any>>();		//时间轴的选中区域
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

	public hasData(): boolean {
		return (this.getData() !== null);
	}

	public getData(): List<LayerModel> {
		if(this._dataType === TimelineDataType.Page) {
			return this._dataGetter(this._dataId).get('layers');
		} else if(this._dataType === TimelineDataType.Movieclip) {
			return this._dataGetter(this._dataId).getIn(['source', 'layers']);
		} else {
			return null;
		}
	}

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
	}

	public getZoom(): number {
		return this._zoom;
	}

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
	 * 根据id获取text source
	 */
	public getTextById(id: string): TextModel {
		let layer: LayerModel = this.getData().find(layer => layer.getIn(['element', 'source', 'id']) === id);
		if(layer) {
			return layer.getIn(['element', 'source']);
		} else {
			return undefined;
		}
	}

	/**
	 * 根据id设置text source
	 */
	public setTextById(id: string, text: TextModel) {
		let tmpText: TextModel = this.getTextById(id);
		if(tmpText === undefined) return;
		let data: List<LayerModel> = this.getData();
		let layerIdx: number = data.findIndex(layer => layer.getIn(['element', 'source', 'id']) === id);
		this.setData(data.setIn([layerIdx, 'element', 'source'], text));
	}

	public getActiveOptions(): List<Map<string, any>> {
		return this._activeOptions;
	}

	public resetActiveOptions() {
		this._activeOptions = Immutable.List<Map<string, any>>();
	}

	public setActiveOptions(
		options: number[] | { elementId: string, start: number, duration: number, }[], 
		isRange: boolean = true
	) {
		let ao: List<Map<string, any>>;
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
			ao = Immutable.List<Map<string, any>>();
			this.getData().forEach((layer, index) => {
				(index >= layer1 && index <= layer2) &&
				(ao = ao.push(Immutable.Map<string, any>({
					elementId: layer.getIn(['element', 'id']),
					start: frame1,
					duration: frame2 - frame1 + 1,
				})));
			});
		} else {
			ao = Immutable.fromJS(options as {elementId: string, start: number, duration: number }[]).toList();
		}

		if(!Immutable.is(ao, this._activeOptions)) {
			this._activeOptions = ao;
		}
	}

	/**
	 * 获取当前active的帧
	 */
	public getActiveFrameIndex(): number {
		return Math.max(0, Math.min.apply(null, this._activeOptions.map(opt => opt.get('start')).toArray()));
	}

	/***
	 * active options 到 selection 的换算关系
	 */
	private activeOptionsToSelection(): SelectionModel {
		let frameIndex: number = 0;
		if(this._activeOptions.size > 0) {
			frameIndex = Math.min.apply(null, 
				this._activeOptions.filter(ao => ao.get('duration') > 0)
					.map(ao => ao.get('start')).toArray()
			);
		}
		let elements: Immutable.List<SelectionElementModel> = Immutable.List<SelectionElementModel>();
		this._activeOptions.forEach(ao => {
			elements = elements.push(MF.g(SelectionElementModel, {
				elementId: ao.get('elementId'),
				elementState: null,
			}));
		});
		
		return MF.g(SelectionModel, {
			frameIndex: frameIndex,
			elements: elements
		});
	}

	/**
	 * selection 到 active options 的换算关系
	 */
	private selectionToActiveOptions(): Immutable.List<Map<string, any>> {
		let result = [];
		let frameIndex: number = this._selection.get('frameIndex');
		this._selection.get('elements').forEach(element => {
			let ele = {
				elementId: element.get('elementId'),
				start: frameIndex,
				duration: 1,
			};
			result.push(ele);
		});
		return Immutable.fromJS(result);
	}

	public updateActiveOptionsFromSelection() {
		let newAO = this.selectionToActiveOptions();
		if(newAO.size === 0) return;		//如果selection为空，则不更新activeOption
		if(newAO.size != this._activeOptions.size
			|| !Immutable.is(newAO.map(ao => ao.get('elementId')), this._activeOptions.map(ao => ao.get('elementId')))
			|| !Immutable.is(newAO.map(ao => ao.get('start')), this._activeOptions.map(ao => ao.get('start')))
		) {
			console.log('not same: ', newAO.toJS(), this._activeOptions.toJS());
			this._activeOptions = newAO;	
		}
	}

	public updateSelectionFromActiveOptions() {
		let newSelection = this.activeOptionsToSelection();
		if(!Immutable.is(Immutable.fromJS(newSelection.toJS()), Immutable.fromJS(this._selection.toJS()))) {
			console.log('update selection: ', newSelection.toJS());
			this._selection = newSelection;
		}
	}

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

	public swapElements(eleId1: string, eleId2: string) {
		let idx1: number = this.getData().findIndex(layer => layer.getIn(['element', 'id']) === eleId1);
		let idx2: number = this.getData().findIndex(layer => layer.getIn(['element', 'id']) === eleId2);
		if(idx1 >= 0 && idx2 >= 0) {
			let layer1 = this.getData().get(idx1);
			let layer2 = this.getData().get(idx2);
			this.setData(this.getData().set(idx2, layer1).set(idx1, layer2));
		}
	}

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

	public moveFrames(idxs: number[], eleIds: string[]) {
		//...todo
	}

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