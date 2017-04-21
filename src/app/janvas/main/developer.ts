declare var createjs: any;
import ControlMask from './controlMask';
import Mouse from './mouse';
import TextInput from './textInput';
import TextControl from './textControl';
import Event from './event';

export default class Developer {
	//project static name
	public CANVAS_NAME = 'janvas-dev';
	private BACKGROUND_NAME = 'dev-background';
	private JANVAS_WIDTH = 375;
	private JANVAS_HEIGHT = 667;
	private JANVAS_SCALE = 1.04;
	private SCALE_RATE = 1.2;				//点击缩放比例 每次20%

	//project properties
	private id:string;					//canvas对象的id，也是stage的id
	private stage:any;					//janvasDev Stage对象
	private stageBg:any;				//janvasDev Stage background对象 shape
	private canvasScale:number			//canvas缩放比
	private janvas:any;					//janvas对象
	private janvasContainer: any;		//janvas stage容器
	private janvasStage: any;			//janvas stage对象
	private canvasElement:any;			//初始化Developer的canvas对象
	private janvasSetting:any;			//对janvas的设置
	private eventList:Object;			//注册的事件对象
	private devMode:number;				//当前模式
	private nowChooseElement:any = [];	//当前选中的element对象
	private controlMask:any;			//控制框
	private janvasCanvas:any;			
	private mouse:any					//鼠标
	private textInput:any;
	private textControl:any;
	private startDrag;

	private isShift:boolean = false;	//是否按住shift

	//event list
	public static EVENTS = {
		ELEMENT_SELECTED: 'elementSelected',
		DRAG_ELEMENT: 'dragElement',
		ELEMENT_CHANGED: 'elementChanged',
		TEXT_CHANGED: 'textChanged',
		SCALE_CHANGED: 'scaleChanged',
		MOUSE_CHANGED: 'mouseChanged'
	}

	//mode list
	public static MODE = {
		EDIT_MODE: 0,
		READ_MODE: 1,
		TEXT_MODE: 2,
		SCALE_MODE: 3
	}

	constructor(id:string, janvasSetting:any, callback?:Function) {
        this.id = id || this.CANVAS_NAME;

		if(typeof id == 'string') {
			this.canvasElement = document.getElementById(this.id);
		} else {
			this.canvasElement = id;
		}
		
		if(!janvasSetting) {
			console.error('没有传入janvas设置');
			return;
		}
		this.janvasSetting = janvasSetting || {};
		this.eventList = new Object();

		//计算canvas缩放比
		let scaleX = this.JANVAS_WIDTH * this.JANVAS_SCALE / this.janvasSetting.canvasWidth;
		let scaleY = this.JANVAS_HEIGHT * this.JANVAS_SCALE / this.janvasSetting.canvasHeight;
		this.init(scaleX > scaleY ? scaleX : scaleY, callback);

		this.initEvent();
	}

	private init(scale:number, callback?:Function) {
		console.info('Janvas－developer初始化');

		//调整canvas缩放 容下janvas画布
		this.scaleCanvas();
		this.canvasScale = scale;
		window['jScale'] = 2 * scale / 100;

		//创建主画布
		this.stage = new createjs.Stage(this.id);
		this.stage.enableMouseOver(10);

		createjs.Touch.enable(this.stage);
        createjs.Ticker.setFPS(60);
        createjs.Ticker.addEventListener('tick', (event) => {
			this.stage.update();
			if(this.stage.mouseInBounds) {
				this.mouse.show();
				this.mouse.updateMousePosition(this.stage.mouseX, this.stage.mouseY);
			} else {
				this.mouse.hide();
			}
		});

		//设置背景
		this.stageBg = new createjs.Shape(
			new createjs.Graphics().
				beginFill('#f5f5f5').
				drawRect(0, 0, this.canvasElement.width, this.canvasElement.height)
		);
		this.stageBg.name = this.BACKGROUND_NAME;
		this.stage.addChild(this.stageBg);

		this.controlMask = new ControlMask({
			color: '#000000',
			width: 1,
			dotRadius: 4
		});

		//设置鼠标
		this.mouse = new Mouse();

		//控制初始化janvas
		this.initJanvas(() => {
			//后加入controlMask zindex最大
			this.stage.addChild(this.controlMask.getInsrance());

			// this.stage.cursor = 'none';
			this.mouse.scaleMouse(this.canvasScale);
			this.stage.addChild(this.mouse.getInstance());

			// this.controlMask.scaleCase(this.canvasScale);

			if(!this.devMode && typeof this.devMode != 'number') {
				this.devMode = Developer.MODE.EDIT_MODE;
			}

			if(callback) {
				callback(this);
			}
		});

		this.textControl = new TextControl(this.janvasStage, this.stage);
	}

	/*
	 * 初始化janvas
	*/
	private initJanvas(callback:Function) {
		if(!this.janvasCanvas) {
			let janvasCanvas = document.createElement('canvas');
			document.body.appendChild(janvasCanvas);
			janvasCanvas.id = 'janvas';
			janvasCanvas.style.display = 'none';

			this.janvasCanvas = janvasCanvas;
		}

		new window['Janvas']('janvas', this.janvasSetting.data, (janvas)=> {
            window['app'] = this.janvas = janvas;

			if(this.janvasContainer) {
				this.stage.removeChild(this.janvasContainer);
			}

			this.janvasStage = janvas.stage.instance;

			let janvasBounds = this.janvasStage.getBounds();

			//添加janvas外层容器
			this.janvasContainer = new createjs.Container();

			this.janvasContainer.set({
				x: (this.canvasElement.width - this.JANVAS_WIDTH) / 2, 
				y: (this.canvasElement.height - this.JANVAS_HEIGHT) / 2, 
				width: janvasBounds.width,
				height: janvasBounds.height
			});

			this.janvasContainer.addChild(this.janvasStage);

			this.stage.addChild(this.janvasContainer);

			this.controlMask.setPosition({
				x: this.janvasContainer.x,
				y: this.janvasContainer.y
			});

			callback();
        }, {
            autoPlay: false,
			changeTitle: false,
			showLoading: false,
			isDev: true
        });
	}

	/*
	 * 注册事件
	*/
	private initEvent() {
		let mousePoint;

		this.stage.on('mouseenter', (event) => {
			switch(this.devMode) {
				case Developer.MODE.EDIT_MODE: {
					// this.mouse.updateMouseState(Mouse.STATE.MOUSE_AUTO);
					this.changeMouseState(Mouse.STATE.MOUSE_AUTO);
					break;
				}

				case Developer.MODE.READ_MODE: {
					// this.mouse.updateMouseState(Mouse.STATE.HAND);
					this.changeMouseState(Mouse.STATE.HAND);
					break;
				}

				case Developer.MODE.TEXT_MODE: {
					// this.mouse.updateMouseState(Mouse.STATE.TEXT);
					this.changeMouseState(Mouse.STATE.TEXT);
					break;
				}
			}
		});

		//注册点击事件
		this.stage.on('stagemousedown', (event) => {
			this.isShift = event.nativeEvent.shiftKey; //判断是否是shift

			switch(this.devMode) {
				case Developer.MODE.SCALE_MODE: {
					let beforeScale = parseFloat(this.getScale());
					let beforePoint = this.janvasContainer.globalToLocal(event.stageX, event.stageY);
					let afterScale = event.nativeEvent.altKey ? beforeScale / this.SCALE_RATE : beforeScale * this.SCALE_RATE;
					let janvasX = this.janvasContainer.x;
					let janvasY = this.janvasContainer.y;

					this.setScale(afterScale, () => {
						let ratio = beforeScale / afterScale;
						//根据点击的坐标计算缩放带来的偏移量，然后在缩放后平移达到定点缩放的效果
						this.janvasContainer.x = (janvasX - beforePoint.x * (afterScale - beforeScale) / beforeScale) * ratio;
						this.janvasContainer.y = (janvasY - beforePoint.y * (afterScale - beforeScale) / beforeScale) * ratio;
					});
					
					break;
				}

				case Developer.MODE.EDIT_MODE: {
					this.chooseElement(event.stageX, event.stageY);
					break;
				}

				case Developer.MODE.READ_MODE: {
					this.startDrag = true;
					mousePoint = {
						x: event.stageX,
						y: event.stageY
					};

					// this.mouse.updateMouseState(Mouse.STATE.DRAGE);
					this.changeMouseState(Mouse.STATE.DRAGE);
					break;
				}

				case Developer.MODE.TEXT_MODE: {
					let element = this.stage.getObjectUnderPoint(
						event.stageX, 
						event.stageY, 
						this.stage
					);

					let textPoint = this.janvasContainer.globalToLocal(event.stageX, event.stageY);

					this.textControl.chooseText(element, textPoint);

					// if(this.textInput && this.textInput.isLock()) {
					// 	return;
					// }

					// let textPoint = this.janvasContainer.globalToLocal(event.stageX, event.stageY);

					// //建立一个textInput元素
					// this.textInput = new TextInput(element.text ? element.parent : null, {
					// 	x: event.nativeEvent.clientX,
					// 	y: event.nativeEvent.clientY,
					// 	canvasScale: this.canvasScale,
					// 	point: textPoint
					// });

					// this.stage.addChild(this.textInput.getInstance());
					break;
				}
			}
		});

		this.stage.on('stagemousemove', (event) => {
			switch(this.devMode) {
				case Developer.MODE.EDIT_MODE: {
					break;
				}
				case Developer.MODE.READ_MODE: {
					console.log();
					if(!this.startDrag) {
						return;
					}

					let point = {
						x: event.stageX,
						y: event.stageY
					};

					this.janvasContainer.x += point.x - mousePoint.x;
					this.janvasContainer.y += point.y - mousePoint.y;

					mousePoint = point;
					break;
				}
			}
		});

		this.stage.on('stagemouseup', (event) => {
			switch(this.devMode) {
				case Developer.MODE.EDIT_MODE: {
					break;
				}
				case Developer.MODE.READ_MODE: {
					this.startDrag = false;
					// this.mouse.updateMouseState(Mouse.STATE.HAND);
					this.changeMouseState(Mouse.STATE.HAND);
					break;
				}
			}
		});

		//注册内部事件
		Event.addEventHandler('elementChanged', (changedData) => {
			//直接触发数据回调
			this.controlMask.hide();

			let returnData = [];
			changedData.map((data, index) => {
				returnData.push(this.fmtReturnObj(Object.assign({}, data.element), data));
			});

			this.triggerHandler(Developer.EVENTS.ELEMENT_CHANGED, returnData);
		});

		Event.addEventHandler('elementMarked', (elementData) => {
			let elementList = [];

			this.nowChooseElement.map((ele, index) => {
				if(elementData) {
					elementData.transformedBounds = ele.getTransformedBounds();
				}
				
				elementList.push(this.fmtReturnObj(ele.janvasInstance, Object.assign({}, elementData)));
			});

			this.triggerHandler(Developer.EVENTS.ELEMENT_SELECTED, {
				elementList: elementList,
				isUserSelect: elementData == null ? true : elementData.isUserSelect
			});
		});

		Event.addEventHandler('textChanged', (addedData) => {
			this.triggerHandler(Developer.EVENTS.TEXT_CHANGED, addedData);
		});

		Event.addEventHandler('mouseStateChange', (state) => {
			// this.mouse.updateMouseState(state);
			this.changeMouseState(state);
		});
	}

	private chooseElement(stageX, stageY) {
		let element = this.stage.getObjectUnderPoint(
			stageX, 
			stageY, 
			this.stage
		);

		// element = element.text ? element.parent : element;

		if(element.isText) {
			element = element.janvasInstance.instance;
		}

		//如果点击到元素控制框或者被选中的元素，则返回
		let elementName = element.name;

		if(!element.isVisible()) {
			return;
		}

		//点击背景 取消元素选中状态  如果没有name 则直接返回
		if(elementName == this.BACKGROUND_NAME || !elementName) {
			this.controlMask.hide();
			this.nowChooseElement = [];
			Event.triggerHandler('elementMarked', null);
			return;
		}

		if(elementName.indexOf(ControlMask.CONTROL_MASK_NAME) >= 0) {
			return;
		}

		if(elementName.indexOf(Mouse.MOUSE_NAME) >= 0) {
			return;
		}

		//处理MC嵌套选取item的MC
		var elementMC = element.janvasInstance.getItemMovieClip()
		if (elementMC) {
			element = elementMC.instance;
		}

		if(this.isShift) {//多选 只处理选中 删除在框里面拦截
			this.nowChooseElement.push(element);
		} else {
			this.nowChooseElement = [];
			this.nowChooseElement.push(element);
		}

		if(this.nowChooseElement && this.devMode == Developer.MODE.EDIT_MODE) {
			this.controlMask.selectedElement(this.nowChooseElement, true); 
		}
	}

	/*
	 * 重新load janvas
	*/
	public setJanvas(janvasSetting:any, callback:Function) {
		this.janvasStage.clear();
		this.janvasSetting = janvasSetting;

        this.initJanvas(() => {
			if(callback) {
				callback();
			}
		});

		return this;
	}

	/*
	 * 重新load janvas
	*/
	public updateJanvasData(janvasData:any, option:any, callback?:Function) {
		this.janvasSetting.data = janvasData;
		this.janvas.update(this.janvasSetting.data, option, (janvas) => {
			this.janvas = janvas;

			this.janvasContainer.removeChild(this.janvasStage);
			this.janvasStage = this.janvas.stage.instance;
			this.janvasContainer.addChild(this.janvasStage);

			if(option.elementList) {
				this.nowChooseElement = option.elementList;
				this.selectElement(option.elementList);
			} else if(this.nowChooseElement.length > 0) {
				let idList = [];
				this.nowChooseElement.map((ele, index) => {
					idList.push(ele.name);
				});
				this.selectElement(idList);
			}

			if(callback) {
				callback();
			}
		});
	}

	/*
	 * 调整janvas
	*/
	public resizeJanvas(width:any, height:any) {
		this.setJanvas({
			width: width,
			height: height,
			data: this.janvasSetting.data
		}, () => {
			
		});
	}

	/*
	 * 调整janvas-dev大小
	*/
	public resizeJanvasDev(width:any, height:any, callback?:Function) {
		this.janvasSetting.canvasWidth = width;
		this.janvasSetting.canvasHeight = height;

		let scaleX = this.JANVAS_WIDTH * this.JANVAS_SCALE / this.janvasSetting.canvasWidth;
		let scaleY = this.JANVAS_HEIGHT * this.JANVAS_SCALE / this.janvasSetting.canvasHeight;

		this.setScale(100 / (scaleX > scaleY ? scaleX : scaleY), callback);

		this.controlMask.setPosition({
			x: this.janvasContainer.x,
			y: this.janvasContainer.y
		});
	}

	/*
	 * 调整janvas-dev的canvas大小
	*/
	private scaleCanvas() {
		let ratio = 2;

		this.canvasElement.width = this.janvasSetting.canvasWidth * ratio;
		this.canvasElement.height = this.janvasSetting.canvasHeight * ratio;

		this.canvasElement.setAttribute('style', 
			'transform-origin: 0 0 0; transform: scale(' + 1 / ratio + ');'
		);
	}

	/*
	 * 获取janvasDev缩放比
	*/
	public getScale() {
		return (100  / this.canvasScale).toFixed(2);
	}

	/*
	 * 缩放janvasDev
	*/
	public setScale(scale:number, callback?:Function) {
		if(!scale || scale <= 0) {
			console.log('输入缩放比有误');
			return;
		}

		if(scale.toString() == (100 / this.canvasScale).toFixed(2)) {
			return;
		}

		let ratio = 100 / scale;

		//缩放canvas
		this.scaleCanvas();
		this.canvasScale = ratio;
		window['jScale'] = 2 * scale / 100;

		//重新绘制背景
		this.stageBg.graphics.clear().beginFill('#f5f5f5').
			drawRect(0, 0, this.canvasElement.width, this.canvasElement.height);
		
		//重新定位janvasContainer
		this.janvasContainer.set({
			x: (this.canvasElement.width * 50 / scale - this.janvasContainer.width) / 2, 
			y: (this.canvasElement.height * 50 / scale - this.janvasContainer.height) / 2, 
			width: this.janvasContainer.width,
			height: this.janvasContainer.height
		});

		//缩放相关部件
		this.mouse.scaleMouse(ratio);
		// this.controlMask.scaleCase(ratio);

		//重新选取选择的element
		if(this.nowChooseElement && this.devMode == Developer.MODE.EDIT_MODE) {
			this.controlMask.selectedElement(this.nowChooseElement);
		}

		if(callback) {
			callback(this.getScale());
		}

		this.triggerHandler(Developer.EVENTS.SCALE_CHANGED, this.getScale());
	}

	/*
	 * 获取canvas元素对象
	*/
	public getCanvas() {
		return this.canvasElement;
	}

	/*
	 * 获取某一帧的元素
	*/
	public selectElement(elementIdList:Array<String>, frameIndex?:Number, pageIndex?:Number) {
		let elementList = [];

		// if(frameIndex) {
		// 	this.gotoPage(frameIndex);
		// }

		// if(pageIndex) {
		// 	this.gotoFrame(pageIndex);
		// }

		elementIdList.map((id, index) => {
			if(!id) {
				return;
			}
			let element = this.getChildByName(id, this.janvasStage);

			if(element && element.isVisible()) {
				elementList.push(element);
			}
		});

		this.nowChooseElement = elementList;
		
		if(this.nowChooseElement && this.devMode == Developer.MODE.EDIT_MODE) {
			this.controlMask.selectedElement(this.nowChooseElement, false);
		}
	}

	/*
	 * 展示某一页，默认展示第一帧
	*/
	public gotoPage(pageId:Number) {
		this.janvas.API.gotoPage(pageId);
	}

	/*
	 * 展示当前页面某一帧
	*/
	public gotoFrame(frameIndex?:Number) {
		this.janvas.API.gotoFrame(frameIndex);
		
		if(this.nowChooseElement && this.devMode == Developer.MODE.EDIT_MODE) {
			this.controlMask.selectedElement(this.nowChooseElement);
		}
	}

	/*
	 * 获取元素属性
	 * 
	 * 传入elementId 获取指定元素的state
	*/
	public getElementState(elementId: string) {
		return this.janvas.getChildById(elementId).getState();
	}

	/*
	 * 获取新增元素的state
	 * 
	 * 则按照传入参数获取新增元素的state
	*/
	public initElementState(data: string, callback: Function) {
		this.janvas.API.getItemState(data, (returnObj) => {
			let bounds = returnObj.element.getBounds();
			let tmpState = returnObj.state;

			if(typeof tmpState.originX != 'number' || typeof tmpState.originY != 'number') {
				tmpState.originX = tmpState.x = bounds.x + bounds.width / 2;
				tmpState.originY = tmpState.y = bounds.y + bounds.height / 2;
			}

			callback(tmpState);
		});
	}

	/*
	 * 跳转到某一frame 并且选中一个element
	*/
	public viewLayer(layerId:string, frameIndex?:number) {

	}

	/*
	 * 获取指定页面截图
	*/
	public getPageImage(pageId: string, callback?: Function) {
		this.janvas.API.getPageImage(pageId, (image) => {
			if(callback) {
				callback(image);
			}
		});
	}

	/*
	 * 切换模式
	*/
	public changeMode(modeType:number) {
		this.devMode = modeType;
		this.startDrag = false;
		
		if(modeType == Developer.MODE.EDIT_MODE) {
			this.controlMask.selectedElement(this.nowChooseElement);
		} else {
			this.controlMask.hide();
		}

		//处理text
		this.textControl.destroy();
	}

	/*
	 * 添加事件监听
	*/
	public addEventHandler(eventName:string, callback:Function) {
		this.eventList[eventName] = callback;
	}

	/*
	 * 移除事件监听
	*/
	public removeEventHandler(eventName:string) {
		delete this.eventList[eventName];
	}

	private changeMouseState(stateName:string) {
		this.triggerHandler(Developer.EVENTS.MOUSE_CHANGED, {state: stateName});
	}

	/*
	 * 事件触发器
	*/
	public triggerHandler(eventName:string, returnData:Object) {
		let eventCallback = this.eventList[eventName];
		if(eventCallback) {
			eventCallback(returnData);
		}
	}

	private fmtReturnObj(instance:any, returnData?:any) {
		if(!returnData) {
			returnData = {};
			returnData.transformedBounds = instance.instance.getTransformedBounds();
			returnData.state = instance.state;
		}

		returnData.instance = instance;
		returnData.elementId = instance.id;
		returnData.layerId = instance.parent.id;
		returnData.frameIndex = instance.parent.currentFrame;

		if(instance.item) {
			returnData.itemId = instance.item.id;
		}

		if(!returnData.state) {
			returnData.state = instance.getState();
		}
		
		return returnData;
	}

	private getChildByName(name, root?:any) {
        root = root || this;

        let result;
		if(!root.children) {
			return null;
		}
        for (var i=0; i<root.children.length; i++) {
            let child = root.children[i];
            if (child.name == name) {
                result = child;
                break;
            } else {
                result = this.getChildByName(name, child);
                if (result) break;
            }
        }
        return result;
    }

	public transformElement(option:any) {
		let matrix = new createjs.Matrix2D();

		matrix.appendTransform(
			option.x || 0,
			option.y || 0,
			option.scaleX || 1,
			option.scaleY || 1,
			option.rotation || 0,
			option.skewX || 0,
			option.skewY || 0,
			option.originX || 0,
			option.originY || 0
		);

		return matrix;
	}

	public textEditOver() {
		this.textControl.destroy();
	}
}