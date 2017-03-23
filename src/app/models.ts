import * as Immutable from 'immutable';
import { List, Map, Record } from 'immutable';

Immutable.List;

export enum Direction {
	vertial,		//垂直
	horizontal		//水平
}

export enum PageType {
	none,
	swiper 
}

export enum SwiperEffect {
	slide
}

export enum ItemType { 
	movieclip, 	//影片剪辑
	bitmap, 	//位图
	video,		//视频
}

export enum SourceType {
	bitmap,
	video
}

export enum ElementType {
	symbol,		//元件库元件的实例
	shape,		//图形
	text,		//文本
}

export enum TweenType {
	none,				//没有动画
	normal,				//补间动画
	shape				//图形动画
}

export enum EditorState {
	none,
	choose,				//选择
	text,				//文字
	zoom,				//放大缩小
	draw,				//绘制
	move,				//移动视图
}

export enum Ease {		//具体请参照createjs Ease类
	backIn,
	backInOut,
	backOut,
	bounceIn,
	bounceInOut,
	bounceOut,
	circIn,
	circInOut,
	circOut,
	cubicIn,
	cubicInOut,
	cubicOut,
	elasticIn,
	elasticInOut,
	elasticOut,
	get,
	getBackIn,
	getBackInOut,
	getBackOut,
	getElasticIn,
	getElasticInOut,
	getElasticOut,
	getPowIn,
	getPowInOut,
	getPowOut,
	linear,
	none,
	quadIn,
	quadInOut,
	quadOut,
	quartIn,
	quartInOut,
	quartOut,
	quintIn,
	quintInOut,
	quintOut,
	sineIn,
	sineInOut,
	sineOut 
}

export enum LayerType {
	normal,				//普通图层
	mask,				//遮罩层
	path				//引导层
}

function createNewId() {
	function S4() {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	}
	function guid() {
		return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
	}
	return 'm' + guid();
}

export class MF {
	static g(model, options: any = {}) {
		let obj = new model(options);
		if(obj.has('id') && obj.get('id') == '') {
			obj = obj.set('id', createNewId());
		}

		return obj;
	}
}

export class Rectangle extends Record({
	x: 0,
	y: 0,
	width: 0,
	height: 0,
}) {}

export class BackgroundModel extends Record({
	color: '#ffffff',
	image: '',
	repeat: false,
	alpha: 0,
}) {}

export class TextModel extends Record({
	id: '',
	width: undefined,							//宽度
	height: undefined,							//高度
	text: '',							//文字内容
	font: 'arial',						//字体
	color: '#000000',					//颜色
	background: new BackgroundModel(),	//背景
	fontSize: 12,						//字号
	bold: false,						//粗体
	italic: false,						//斜体
	underline: false,					//下划线
	lineheight: 20,						//行高
}) {
	
}

export class ShapeModel extends Record({
	id: '',
}) {}

export class BitmapModel extends Record({
	id: '',
	url: '',			
	width: 0,
	height: 0,
	name: '',
	fileName: '',
	fileSize: 0,				
}) {}


export class VideoModel extends Record({
	id: '',
	url: '',
	width: 0,
	height: 0,
	fileName: '',
	fileSize: 0,
}) {}

export class Matrix2D extends Record({
	a: 1,
	b: 0,
	c: 0,
	d: 1,
	e: 0,
	f: 0,
}) {}

export class ElementStateModel extends Record({
	x: 0,
	y: 0,
	originX: undefined,
	originY: undefined,
	rotation: 0,
	scaleX: 1,
	scaleY: 1,
	skewX: 0,
	skewY: 0,
	alpha: 1,
	matrix: new Matrix2D(),
}) {}

export class TweenModel extends Record({
	type: TweenType.normal,
	loop: false,
	ease: Ease.linear,
	duration: 0,
}) {}

export class ElementModel extends Record({
	id: '',
	visible: true,
	type: ElementType.symbol,
	item: '',
	source: null,
}) {
	public static fromItem( item: ItemModel ) {
		let ele: ElementModel = MF.g(ElementModel, {
			type: ElementType.symbol,
			item: item.get('id')
		});
		return ele;
	}
	public static fromText( text: TextModel ) {
		let ele: ElementModel = MF.g(ElementModel, {
			type: ElementType.text,
			source: text
		});
		return ele;
	}
}

export class SelectionElementModel extends Record({
	elementId: '',
	elementState: new ElementStateModel(),
	transformBounds: new Rectangle(),
}) {

}

export class SelectionModel extends Record({
	frameIndex: 0,
	elements: Immutable.List<SelectionElementModel>()
}) {

}

export class FilterModel extends Record({
}) {}

export class FrameModel extends Record({
	id: '',
	name: '',
	index: 0,
	isKeyFrame: true,
	isEmptyFrame: false,
	tweenType: TweenType.none,
	tween: new TweenModel(),
	elementState: new ElementStateModel(),
	duration: 1,
}) {
	static clone(frame: FrameModel): FrameModel {
		let newFrame: FrameModel = MF.g(FrameModel, {
			name: frame.get('name'),
			index: frame.get('index'),
			isKeyFrame: frame.get('isKeyFrame'),
			isEmptyFrame: frame.get('isEmptyFrame'),
			tweenType: frame.get('tweenType'),
			tween: frame.get('tween'),
			elementState: frame.get('elementState'),
			duration: frame.get('duration'),
		});
		return newFrame;
	}
}


export class LayerModel extends Record({
	id: '',
	name: '',
	type: LayerType.normal,
	parentLayer: '',
	children: Immutable.List<string>(),
	startFrame: 0,
	element: new ElementModel(),
	frames: Immutable.List<FrameModel>(),
	frameCount: 0,
}) {}

export class PageModel extends Record({
	id: '',
	name: '',
	background: new BackgroundModel(),
	thumbnail: '',
	layers: Immutable.List<LayerModel>(),
}) {}

export class SwiperModel extends Record({
	initialSlide: 1,
	direction: Direction.vertial,
	speed: 100,
	autoPlay: false,
	effect: SwiperEffect.slide,
	loop: false,
}) {}

export class ItemModel extends Record({
	id: '',
	name: '',
	thumbnail: '',
	type: ItemType.movieclip,
	source: null,
}) {}


export class HotKeyModel extends Record({
	api: '',
	key: '',
	shift: false,
	ctrl: false,
	alt: false,
	desc: '',
}) {}

export class StageModel extends Record({
	id: '',
	background: new BackgroundModel(),
	title: '',
	pageType: PageType.swiper,
}) {}

export class MainModel extends Record({
	stage: new StageModel(),
	swiper: new SwiperModel(),
	pages: Immutable.List<PageModel>(),
	library: Immutable.List<ItemModel>(),
}) {}

export class ProductModel extends Record({
	id: '',
	title: '',
	user: '',
	lastModify: 0,
	prodId: '',
}) {}

// export var ProductModel = new BasicModel({
	
// 	title: '',
// 	user: '',
// 	lastModify: 0,
// 	prodId: '',
// });

