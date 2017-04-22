declare var createjs: any;

import Mouse from './mouse';
import Event from './event';

export default class ControlMask {
    //defined name
    public static CONTROL_MASK_NAME = 'controlMask';

    private elementList:Array<any>;         //数据源
    private element:any;
    private copyElement:any;
    private oldElement:any;
    private controlConf:any;
    private maskContainer:any;              //单选时候的定位框
    private maskMultiContainer:any;          //多选时候的定位框
    private copyContainer:any;              //放置copyElement的容器
    private maskContainerWrap:any;
    private oriDot:any;                     //坐标原点
    private maskCase:any;
    private dotList:Array<any>;
    private transList:Array<any>;
    private dotHoverClass:Array<string>;
    private moveState:number;
    private pressLock:boolean;
    private rotateCenter:any;               //旋转中心实例
    private scaleNum:number = 1;
    private transformData:any = {};
    private oriTransformData:any;
    private imgCanvas:any;

    private isShift:boolean = false;

    constructor(controlConf) {
        this.maskContainerWrap = new createjs.Container();

        this.maskContainerWrap.set({x: 0, y: 0});

        this.maskContainer = new createjs.Container();
        this.maskContainer.name = ControlMask.CONTROL_MASK_NAME + '_single';
        this.maskContainerWrap.addChild(this.maskContainer);

        this.maskMultiContainer = new createjs.Container();
        this.maskMultiContainer.name = ControlMask.CONTROL_MASK_NAME + '_multi';
        this.maskContainerWrap.addChild(this.maskMultiContainer);

        this.hide();

        //组装maskContainer

        //添加元素复制层
        this.copyContainer = new createjs.Container();
        this.copyContainer.name = ControlMask.CONTROL_MASK_NAME + '_copy';

        this.copyContainer.set({x: 0, y: 0});

        this.maskContainer.addChild(this.copyContainer);

        //添加控制框
        this.maskCase = new createjs.Shape();
        this.maskCase.name = ControlMask.CONTROL_MASK_NAME + '_case';

        this.maskContainer.addChild(this.maskCase);

        this.controlConf = controlConf;

        this.dotHoverClass = [Mouse.STATE.SCALE_TOP_LEFT, Mouse.STATE.SCALE_TOP_BOTTOM, Mouse.STATE.SCALE_TOP_RIGHT, 
                            Mouse.STATE.SCALE_LEFT_RIGHT, Mouse.STATE.MOUSE_MOVE_REG, Mouse.STATE.SCALE_LEFT_RIGHT, 
                            Mouse.STATE.SCALE_TOP_RIGHT, Mouse.STATE.SCALE_TOP_BOTTOM, Mouse.STATE.SCALE_TOP_LEFT];

        this.initMaskDots();

        this.initEvent();
    }

    /*
     * 初始化操作框的描点和旋转中心
    */
    private initMaskDots() {
        this.dotList = new Array();
        this.transList = new Array();

        let dotRadius = this.controlConf.dotRadius;
        let dotContainerWidth = 2 * dotRadius;

        //添加四边操作手柄
        for(let i = 0; i < 4; i++) {
            let transContainer = new createjs.Container();//形变的外层container
            let transShape = new createjs.Shape();//形变的shape

            transShape.name = ControlMask.CONTROL_MASK_NAME + 'Trans_shape';

            transContainer.set({x: 0, y: 0});
            
            transShape.on('mouseover', (event) => {
                event.stopPropagation();
                
                if(this.pressLock){
                    return;
                }

                this.changeMouseState(i % 2 == 0 ? Mouse.STATE.SKEW_LEFT_RIGHT : Mouse.STATE.SKEW_TOP_BOTTOM);

                this.moveState = parseInt('1' + i); //10 - 13 skew形变
            });

            transContainer.addChild(transShape);

            this.maskContainer.addChild(transContainer);

            this.transList.push(transContainer);
        }

        //添加坐标原点
        let oriWidth = dotContainerWidth * this.scaleNum * 2;
        let oriDot = new createjs.Shape(
            new createjs.Graphics()
                .beginStroke('#ffffff')
                .setStrokeStyle(this.controlConf.width * this.scaleNum * 5)
                .moveTo(dotContainerWidth * this.scaleNum * 2, 0)
                .lineTo(-dotContainerWidth * this.scaleNum * 2, 0)
                .moveTo(0, -dotContainerWidth * this.scaleNum * 2)
                .lineTo(0, dotContainerWidth * this.scaleNum * 2)
                .setStrokeStyle(this.controlConf.width * this.scaleNum)
                .beginStroke('#000000')
                .moveTo(-dotContainerWidth * this.scaleNum * 2, 0)
                .lineTo(dotContainerWidth * this.scaleNum * 2, 0)
                .moveTo(0, -dotContainerWidth * this.scaleNum * 2)
                .lineTo(0, dotContainerWidth * this.scaleNum * 2)
        );

        oriDot.name = ControlMask.CONTROL_MASK_NAME + 'Origin_shape';

        oriDot.mouseEnabled = false;
        oriDot.mouseChildren = false;

        this.maskContainer.addChild(oriDot);
        this.oriDot = oriDot;
        
        //添加点操作手柄
        for(let i = 0; i < 9; i++) {
            let tmpDot = new createjs.Container();//点的外层container
            let tmpDotShape = new createjs.Shape();//shape绘制具体形状

            tmpDot.name = ControlMask.CONTROL_MASK_NAME + 'Dot_' + Math.floor(i / 3) + '-' + (i % 3);
            tmpDotShape.name = ControlMask.CONTROL_MASK_NAME + 'Dot_shape';
            tmpDot.hoverClass = this.dotHoverClass[i];
            tmpDot.set({
                x: 0, 
                y: 0, 
                width: dotContainerWidth * 2,
                height: dotContainerWidth * 2
            });

            if(i % 2 == 0 && i != 4) {
                let rotateShap = new createjs.Shape();
                rotateShap.name = ControlMask.CONTROL_MASK_NAME + 'Rotate_shape';

                rotateShap.graphics
                    .beginFill('rgba(0, 0, 0, .01)')
                    .drawCircle(dotRadius, dotRadius, 20);
                
                rotateShap.on('mouseover', (event) => {
                    event.stopPropagation();

                    let index = i / 2;

                    let state;

                    switch(index) {
                        case 0: {
                            // state = Mouse.STATE.ROTATE_LEFT_TOP;
                            state = Mouse.STATE.ROTATE;
                            break;
                        }
                        case 1: {
                            // state = Mouse.STATE.ROTATE_RIGHT_TOP;
                            state = Mouse.STATE.ROTATE;
                            break;
                        }
                        case 3: {
                            // state = Mouse.STATE.ROTATE_LEFT_BOTTOM;
                            state = Mouse.STATE.ROTATE;
                            break;
                        }
                        case 4: {
                            // state = Mouse.STATE.ROTATE_RIGHT_BOTTOM;
                            state = Mouse.STATE.ROTATE;
                            break;
                        }
                    }

                    this.changeMouseState(state);
                });

                rotateShap.on('mousedown', (event) => {
                    if(this.pressLock){
                        return;
                    }
                    
                    this.moveState = 9;
                });

                tmpDot.addChild(rotateShap);
            }

            if(i == 4) {
                let rotateWidth = dotRadius * 4 / 3;
                this.rotateCenter = tmpDot;
                tmpDotShape.graphics
                    .setStrokeStyle(1)
                    .beginStroke('#000000')
                    .drawCircle(dotRadius, dotRadius, rotateWidth)
                    .beginFill('rgba(255, 255, 255, .01)')
                    .beginStroke('#ffffff')
                    .drawCircle(dotRadius, dotRadius, rotateWidth-1);
            } else {
                tmpDotShape.graphics
                    .setStrokeStyle(1)
                    .beginStroke('#ffffff')
                    .beginFill(this.controlConf.color)
                    .drawRect(0, 0, dotContainerWidth, dotContainerWidth);
            }

            tmpDot.addChild(tmpDotShape);

            tmpDot.on('mouseover', (event) => {
                event.stopPropagation();
                
                if(this.pressLock){
                    return;
                }

                this.changeMouseState(tmpDot.hoverClass);

                this.moveState = i;
            });

            if(i == 4) {//旋转中心 添加在外层容器中
                this.maskContainerWrap.addChild(tmpDot);
            } else {//描点添加在内层容器中
                this.maskContainer.addChild(tmpDot);
            }
            this.dotList.push(tmpDot);
        }
    }

    /*
     * 注册事件
    */
    private initEvent() {
        let pressPoint;
        let pressDownPoint;

        let container = this.maskContainer;

        //选中元素 hover效果
        container.on('mouseover', (event) => {
            if(this.pressLock){
                return;
            }

            this.changeMouseState(Mouse.STATE.MOUSE_MOVE);

            this.moveState = -1;
        });

        //选中元素 移除hover效果
        container.on('mouseout', (event) => {
            this.changeMouseState(Mouse.STATE.MOUSE_AUTO);
        });

        //选中元素 拖拽开始
        this.maskContainerWrap.on('mousedown', (event) => {
            // pressPoint = {
            //     x: event.stageX,
            //     y: event.stageY
            // }

            // pressDownPoint = pressPoint;

            pressDownPoint  = undefined;
            pressPoint = undefined;
        });

        //选中元素 拖拽移动
        this.maskContainerWrap.on('pressmove', (event) => {
            this.isShift = event.nativeEvent.shiftKey; //判断是否是shift
            
            if(typeof this.moveState != 'number') {
                return;
            }

            if(!pressDownPoint) {
                pressDownPoint = pressPoint = {
                    x: event.stageX,
                    y: event.stageY
                }
            }

            let deltaX = event.stageX - pressPoint.x;
            let deltaY = event.stageY - pressPoint.y;

            pressPoint = {x: event.stageX, y: event.stageY};

            if(this.moveState < 0) {//整体拖拽移动 －1
                this.translateElement(pressDownPoint, pressPoint);
            } else if(this.moveState === 4){//4是旋转中心
                this.moveRotateCenter(deltaX, deltaY);
            } else if(this.moveState >= 0 && this.moveState < 9) {//0 - 8 是不同9个点的拖拽
                this.scaleElement(pressPoint);
            } else if(this.moveState === 9) {//旋转
                this.rotateElement(pressDownPoint, pressPoint);
            } else if(this.moveState > 9 && this.moveState < 14) {//形变 10、11、12、13
                deltaX = pressPoint.x - pressDownPoint.x;
                deltaY = pressPoint.y - pressDownPoint.y;
                this.skewElement(deltaX, deltaY, pressDownPoint);
            } else {//14 复选拖拽
                this.translateElements(deltaX, deltaY);
            }

            this.pressLock = true;
        });

        //选中元素 拖拽结束
        this.maskContainerWrap.on('pressup', (event) => {
            this.pressLock = false;

            if(!pressDownPoint) {
                return;
            }

            if(event.stageX == pressDownPoint.x && event.stageY == pressDownPoint.y) {
                return;
            }

            if(this.moveState == 14) {//复选操作
                let returnData = [];
                let matrix;
                let eleCase;

                this.elementList.map((ele, index) => {
                    eleCase = this.maskMultiContainer.children[index];

                    matrix = ele.getMatrix();
                    matrix.e = ele.x + eleCase.deltaX;
                    matrix.f = ele.y + eleCase.deltaY;

                    returnData.push({
                        id: ele.name,
                        visible: ele.visible,
                        element: ele.janvasInstance,
                        transformedBounds: ele.getTransformedBounds,
                        state: {
                            matrix: matrix,
                            originX: ele.regX,
                            originY: ele.regY,
                            x: matrix.e,
                            y: matrix.f,
                            totation: ele.rotation,
                            scaleX: ele.scaleX,
                            scaleY: ele.scaleY,
                            skewX: ele.skewX,
                            skewY: ele.skewY
                        }
                    });
                });

                Event.triggerHandler('elementChanged', returnData);
            } else {//单元素修改
                let m1 = this.element.getMatrix();
                let m2 = this.copyElement.getMatrix();

                m2.tx = this.transformData.x + (this.copyElement.r_deltaX || 0);
                m2.ty = this.transformData.y + (this.copyElement.r_deltaY || 0);

                let transformedBounds = this.copyElement.getTransformedBounds();
                transformedBounds.x += m2.tx;
                transformedBounds.y += m2.ty;

                //通知父元素 拖拽结束 元素修改
                Event.triggerHandler('elementChanged', [{
                    id: this.element.name,
                    visible: this.copyElement.visible,
                    element: this.element.janvasInstance,
                    transformedBounds: transformedBounds,
                    state: {
                        matrix: this.fmtMatrx(m2),
                        originX: this.copyElement.regX + (this.copyElement.r_invertDeltaX || 0),
                        originY: this.copyElement.regY + (this.copyElement.r_invertDeltaY || 0),
                        x: m2.e,
                        y: m2.f,
                        rotation: this.transformData.rotation == undefined ? this.oriTransformData.rotation || 0 : this.transformData.rotation,
                        scaleX: this.transformData.scaleX == undefined ? this.oriTransformData.scaleX || 1 : this.transformData.scaleX,
                        scaleY: this.transformData.scaleY == undefined ? this.oriTransformData.scaleY || 1 : this.transformData.scaleY,
                        skewX: this.transformData.skewX == undefined ? this.oriTransformData.skewX || 0 : this.transformData.skewX,
                        skewY: this.transformData.skewY == undefined ? this.oriTransformData.skewY || 0 : this.transformData.skewY
                    }
                }]);
            }
        });
    }

    /*
     * 拖拽元素
    */
    private translateElement(pressDownPoint:any, pressPoint:any) {
        let deltaX = pressPoint.x - pressDownPoint.x;
        let deltaY = pressPoint.y - pressDownPoint.y;
        
        if(this.isShift) {
            let angle = Math.abs(Math.atan(deltaX / deltaY) * 180 / Math.PI);

            if(angle > 60) {
                deltaY = 0;
            } else if(angle > 30 && angle <= 60) {
                let absMove = Math.abs(deltaX) > Math.abs(deltaY) ? Math.abs(deltaX) : Math.abs(deltaY);
                deltaX = deltaX > 0 ? absMove : -absMove;
                deltaY = deltaY > 0 ? absMove : -absMove;
            } else {
                deltaX = 0;
            }
        }

        //控制框架移动
        this.maskContainer.x = this.maskContainer.oriPositionX + deltaX;
        this.maskContainer.y = this.maskContainer.oriPositionY + deltaY;

        //移动旋转中心
        this.rotateCenter.x = this.rotateCenter.oriPositionX + deltaX;
        this.rotateCenter.y = this.rotateCenter.oriPositionY + deltaY;

        //修改transformData
        this.transformData.x = this.oriTransformData.x + deltaX;
        this.transformData.y = this.oriTransformData.y + deltaY;
    }

    /*
     * 拖拽多个元素
    */
    private translateElements(deltaX:number, deltaY:number) {
        this.maskMultiContainer.children.map((ele, index) => {
            ele.x += deltaX;
            ele.y += deltaY;

            if(!ele.deltaX) {
                ele.deltaX = 0;
            }

            if(!ele.deltaY) {
                ele.deltaY = 0;
            }

            ele.deltaX += deltaX;
            ele.deltaY += deltaY;
        });
    }

    /*
     * 拖拽旋转中心
    */
    private moveRotateCenter(deltaX:number, deltaY:number) {
        let rotateCenter = this.rotateCenter;

        let matrix = this.copyElement.getMatrix();
        matrix.tx = 0;
        matrix.ty = 0;
        let invertMatrix = matrix.invert();
        let invertPoint = invertMatrix.transformPoint(deltaX, deltaY);

        //位移标记
        rotateCenter.x += deltaX;
        rotateCenter.y += deltaY;

        this.copyElement.r_deltaX = (this.copyElement.r_deltaX || 0) + deltaX;
        this.copyElement.r_deltaY = (this.copyElement.r_deltaY || 0) + deltaY;

        this.copyElement.r_invertDeltaX = (this.copyElement.r_invertDeltaX || 0) + invertPoint.x;
        this.copyElement.r_invertDeltaY = (this.copyElement.r_invertDeltaY || 0) + invertPoint.y;
    }

    /*
     * 元素缩放
    */
    private scaleElement(pressPoint:any) {
        let row = Math.floor(this.moveState / 3);
        let col = Math.floor(this.moveState % 3);
        let isItaly = Math.floor(this.moveState % 2) == 0;//是否是四个角的操作手柄

        let locationPoint = this.element.globalToLocal(pressPoint.x, pressPoint.y);

        let elementBounds = this.element.getBounds();

        let relaWidth;
        let relaHeight;

        let ratioX = 1;
        let ratioY = 1;
        
        if(row == 0) {//第一行
            relaHeight = this.copyElement.regY - elementBounds.y;
            ratioY = -1;
        } else if(row == 2) {//第三行
            relaHeight = elementBounds.y + elementBounds.height - this.copyElement.regY;
        }

        if(col == 0) {//第一列
            relaWidth = this.copyElement.regX - elementBounds.x;
            ratioX = -1;
        } else if(col == 2) {//第三列
            relaWidth = elementBounds.x + elementBounds.width - this.copyElement.regX;
        }

        let scaleX = relaWidth ? ratioX * this.oriTransformData.scaleX * 
                (locationPoint.x - this.copyElement.regX) / relaWidth : undefined;
        
        let scaleY = relaHeight ? ratioY * this.oriTransformData.scaleY * 
                (locationPoint.y - this.copyElement.regY) / relaHeight : undefined;

        if(this.isShift && isItaly) {
            let totScale = scaleX < scaleY ? scaleX : scaleY;
            scaleX = totScale;
            scaleY = totScale;
        }

        this.setTransform(this.copyElement, {
            scaleX: scaleX,
            scaleY: scaleY
        });

        this.rePaintView();
    }

    /*
     * 旋转元素
     */
    private rotateElement(pressDownPoint:any, movePoint:any) {
        let rotateCenter = this.rotateCenter;

        //求夹角 cosA = (AB*AC)/(|AB|*|AC|)
        let ma_x = pressDownPoint.x - rotateCenter.x;
        let ma_y = pressDownPoint.y - rotateCenter.y;
        let mb_x = movePoint.x - rotateCenter.x;
        let mb_y = movePoint.y - rotateCenter.y;

        let ma_val = Math.sqrt(Math.pow(ma_x, 2) + Math.pow(ma_y, 2));
        let mb_val = Math.sqrt(Math.pow(mb_x, 2) + Math.pow(mb_y, 2));

        let cosM = (ma_x * mb_x + ma_y * mb_y) / (ma_val * mb_val);  

        let angleAMB = Math.acos(cosM) * 180 / Math.PI;

        let dur = ma_x * mb_y - mb_x * ma_y;//BC的向量 <0 逆时针 >0 顺时针

        if(this.isShift) {
            let rate = Math.floor(angleAMB / 45);
            let lot = angleAMB % 45;

            angleAMB = 45 * (lot <= 45 ? rate : rate + 1);
        }

        this.setTransform(this.copyElement, {
            rotation: dur < 0 ? -angleAMB : angleAMB
        });

        this.rePaintView();
    }

    /*
     * 拖拽形变
    */
    private skewElement(deltaX:any, deltaY:any, mouseDownPoint:any) {
        let element = this.element;
        let elementBounds = element.getTransformedBounds();
        let moveState = this.moveState;
        let angle;

        if(moveState % 2 == 0) {//偶数是横向
            let relativeHeight; //相对高度
            let lastMoveWidth; //上一次移动的高度

            if(moveState == 10) {//上部
                relativeHeight = element.regY;
                if(relativeHeight == 0) {
                    relativeHeight = elementBounds.height - element.regY;
                }
            } else {//下部
                deltaX = -deltaX;
                relativeHeight = elementBounds.height - element.regY;
                if(relativeHeight == 0) {
                    relativeHeight = element.regY;
                }
            }

            lastMoveWidth = relativeHeight * Math.tan((this.oriTransformData.skewX || 0) * Math.PI / 180);

            angle = Math.atan((lastMoveWidth + deltaX) / relativeHeight) * 180 / Math.PI;

            this.setTransform(this.copyElement, {
                skewX: angle
            });
        } else {
            let relativeWidth; //相对宽度
            let lastMoveHeight; //上一次移动的宽度

            if(moveState == 13) {//左部
                deltaY = -deltaY;
                relativeWidth = element.regX;
                if(relativeWidth == 0) {
                    relativeWidth = elementBounds.width - element.regX;
                }
            } else {//右部
                relativeWidth = elementBounds.width - element.regX;
                if(relativeWidth == 0) {
                    relativeWidth = element.regX;
                }
            }

            lastMoveHeight = relativeWidth * Math.tan((this.oriTransformData.skewY || 0) * Math.PI / 180);

            angle = Math.atan((lastMoveHeight + deltaY) / relativeWidth) * 180 / Math.PI;

            this.setTransform(this.copyElement, {
                skewY: angle
            });
        }

        this.rePaintView();
    }

    /*
     * 拖拽和形变时 添加透明遮罩
    */
    private addAlphaMask() {
        if(this.copyElement.visible) {
            return;
        }

        this.copyElement.visible = true;

        let elementBounds = this.copyElement.getBounds();

        let box = new createjs.Shape();
        box.graphics.beginFill('rgba(0, 0, 0, .5)')
        box.graphics.drawRect(0, 0, elementBounds.width, elementBounds.height);
        box.cache(0, 0, elementBounds.width, elementBounds.height);

        this.copyElement.filters = [
            new createjs.AlphaMaskFilter(box.cacheCanvas)
        ];

        // this.copyElement.cache(0, 0, elementBounds.width, elementBounds.height);
    }

    public setPosition(position:any) {
        this.maskMultiContainer.set({
            x: position.x,
            y: position.y
        });
    }

    public selectedElement(elementList:Array<any>, isUserSelect?:Boolean) {
        let returnData = null;

        this.elementList = elementList;

        if(elementList.length == 0) {
            this.hide();
            return;
        } else if(elementList.length == 1) {
            this.markElement(elementList[0]);

            Event.triggerHandler('elementMarked', {
                state: Object.assign({}, this.oriTransformData),
                isUserSelect: !!isUserSelect
            });
        } else {
            this.markElements();

            Event.triggerHandler('elementMarked', {isUserSelect: !!isUserSelect});
        }
    }

    /*
     * 选中元素
    */
    private markElements() {
        this.maskMultiContainer.removeAllChildren();

        let bounds;
        let transformedBounds;

        let originState;

        //绘制每个元素的边框
        this.elementList.map((ele, index) => {
            bounds = ele.getBounds();

            originState = ele.janvasInstance.getState();

            if(typeof originState.originX != 'number' || typeof originState.originY != 'number') {
                ele.regX = bounds.x + bounds.width / 2;
                ele.regY = bounds.y + bounds.height / 2;

                ele.x = bounds.x + bounds.width / 2;
                ele.y = bounds.y + bounds.height / 2;
            }

            transformedBounds = ele.getTransformedBounds();

            let point1 = {x: transformedBounds.x, y: transformedBounds.y};
            let point2 = {x: transformedBounds.x + transformedBounds.width, y: transformedBounds.y + transformedBounds.height};

            let shape = new createjs.Shape(
                new createjs.Graphics().beginStroke('#000000')
                    .setStrokeStyle(this.controlConf.width)
                    .beginFill('rgba(255, 255, 255, .01)')
                    .moveTo(point1.x, point1.y)
                    .lineTo(point2.x, point1.y)
                    .lineTo(point2.x, point2.y)
                    .lineTo(point1.x, point2.y)
                    .lineTo(point1.x, point1.y)
            );

            shape.name = ControlMask.CONTROL_MASK_NAME + '_multi_shape'

            this.maskMultiContainer.addChild(shape);

            shape.on('mousedown', (event) => {
                this.isShift = event.nativeEvent.shiftKey;

                if(this.isShift) {//开启shift模式时 点击删除元素多选
                    this.elementList.splice(index, 1);
                    this.selectedElement(this.elementList);
                    return;
                } else {
                    this.moveState = 14;
                }
            });
        });

        this.show();
    }

    /*
     * 选中元素
    */
    private markElement(element:any) {
        this.hide();

        this.element = element;

        if(!this.element.janvasInstance) {
            return;
        }

        this.transformData = {};

        this.oriTransformData = Object.assign({}, this.element.janvasInstance.getState());

        let elementBounds = this.getElementBounds(element);

        //let elementImg = this.getElementImg(this.element);

        //添加图片时，旋转中心值undefined，设置默认在中间
        // if(typeof this.oriTransformData.originX != 'number' || typeof this.oriTransformData.originY != 'number') {

        //     let relativeWidth = elementBounds.x + elementBounds.width / 2;
        //     let relativeHeight = elementBounds.y + elementBounds.height / 2;

        //     this.element.regX = this.element.x = relativeWidth;
        //     this.element.regY = this.element.y = relativeHeight;

        //     this.oriTransformData.originX = this.oriTransformData.x = relativeWidth;
        //     this.oriTransformData.originY = this.oriTransformData.y = relativeHeight;
        // }

        this.copyElement = element.clone();

        this.copyElement.name = ControlMask.CONTROL_MASK_NAME + '_' + this.copyElement.name;

        if(!this.copyElement.getBounds()) {
            this.copyElement.setBounds(
                elementBounds.x,
                elementBounds.y,
                elementBounds.width,
                elementBounds.height
            );
        }

        //暂时不处理子元素的情况
        // if(element.children) {
        //     for(let i = 0; i < element.children.length; i++) {
        //         let child = element.children[i].clone();
        //         child.name = ControlMask.CONTROL_MASK_NAME + '_' + child.name;
        //         this.copyElement.addChild(child);
        //     }
        // }

        if(typeof this.oriTransformData.originX == 'number' && typeof this.oriTransformData.originY == 'number') {
            this.copyElement.x = 0;
            this.copyElement.y = 0;
        }

        this.pressLock = false;//打开拖拽锁

        this.copyElement.visible = false;
        
        this.copyContainer.addChild(this.copyElement);
        
        let elementCenterPoint = element.localToGlobal(element.regX, element.regY);

        //画边界框
        this.maskContainer.set({
            x: elementCenterPoint.x,
            y: elementCenterPoint.y,
            width: elementBounds.width,
            height: elementBounds.height
        });

        this.maskContainer.oriPositionX = elementCenterPoint.x;
        this.maskContainer.oriPositionY = elementCenterPoint.y;
        
        this.transformData.x = this.oriTransformData.x;
        this.transformData.y = this.oriTransformData.y;

        //添加选中element的透明模版
        this.addAlphaMask();

        this.rePaintView();

        this.show();
    }

    /*
     * 重绘控制框、描点等
    */
    private rePaintView() {
        let element = this.element;
        let copyElement = this.copyElement;
        let elementBounds = copyElement.getBounds();
        let matrix = copyElement.getMatrix();
        let dotRadius = this.controlConf.dotRadius;

        let rt_point = matrix.transformPoint(elementBounds.x + elementBounds.width, elementBounds.y);
        let rb_point = matrix.transformPoint(elementBounds.x + elementBounds.width, elementBounds.y + elementBounds.height);
        let lb_point = matrix.transformPoint(elementBounds.x, elementBounds.y + elementBounds.height);
        let lt_point = matrix.transformPoint(elementBounds.x, elementBounds.y);

        //绘制坐标原点
        let ori_point = matrix.transformPoint(0, 0);
        this.oriDot.scaleX = this.scaleNum;
        this.oriDot.scaleY = this.scaleNum;
        this.oriDot.set({x: ori_point.x, y: ori_point.y});

        //绘制边线
        this.maskCase.graphics.clear()
            .beginStroke(this.controlConf.color)
            .setStrokeStyle(this.controlConf.width * this.scaleNum)
            .beginFill('rgba(255, 255, 255, .01)')
            .moveTo(lt_point.x, lt_point.y)
            .lineTo(rt_point.x, rt_point.y)
            .lineTo(rb_point.x, rb_point.y)
            .lineTo(lb_point.x, lb_point.y)
            .lineTo(lt_point.x, lt_point.y);

        this.transList.map((trans, index) => {
            let g = trans.children[0].graphics.clear();

            g.setStrokeStyle(10).beginStroke('rgba(255, 255, 255, .01)');

            switch(index) {
                case 0: {
                    g.moveTo(lt_point.x, lt_point.y).lineTo(rt_point.x, rt_point.y);
                    break;
                }
                case 1: {
                    g.moveTo(rt_point.x, rt_point.y).lineTo(rb_point.x, rb_point.y);
                    break;
                }
                case 2: {
                    g.moveTo(rb_point.x, rb_point.y).lineTo(lb_point.x, lb_point.y);
                    break;
                }
                case 3: {
                    g.moveTo(lb_point.x, lb_point.y).lineTo(lt_point.x, lt_point.y);
                    break;
                }
            }
        });

        //处理点操作手柄
        this.dotList.map((dot, index) => {
            let realPoint;

            dot.scaleX = this.scaleNum;
            dot.scaleY = this.scaleNum;

            dot.regX = this.controlConf.dotRadius;
            dot.regY = this.controlConf.dotRadius;

            //处理旋转中心
            if(index === 4) {
                let regPoint = element.localToGlobal(element.regX, element.regY);

                dot.x = regPoint.x;
                dot.y = regPoint.y;
                dot.oriPositionX = regPoint.x;
                dot.oriPositionY = regPoint.y;
                return;
            }

            let tmpName = dot.name.split('_')[1];
            let row = parseInt(tmpName.split('-')[0]);
            let col = parseInt(tmpName.split('-')[1]);

            dot.set({x: elementBounds.x, y: elementBounds.y});

            if(col > 0) {
                dot.x += col == 1 ? elementBounds.width / 2 : elementBounds.width;
            }

            if(row > 0) {
                dot.y += row == 1 ? elementBounds.height / 2 : elementBounds.height;
            }

            realPoint = matrix.transformPoint(dot.x, dot.y);

            dot.x = realPoint.x;
            dot.y = realPoint.y;
        });
    }

    /*
     * 缩放控制框
    */
    public scaleCase(scale:number) {
        this.scaleNum = scale;

        if(this.maskContainerWrap.visible) {
            this.rePaintView();
        }
    }

    /*
     * 获取实例
    */
    public getInsrance() {
        return this.maskContainerWrap;
    }

    /*
     * 隐藏操作框
    */
    public hide() {
        this.maskContainerWrap.visible = false;

        if(this.copyElement) {
            this.copyContainer.removeChild(this.copyElement);
        }

        this.element = null;
        this.copyElement = null;
    }

    /*
     * 显示操作框
    */
    public show() {
        this.maskContainer.visible = false;
        this.maskMultiContainer.visible = false;
        this.maskContainerWrap.visible = true;

        if(this.elementList.length == 0) {
            this.maskContainerWrap.visible = false;
        } else if(this.elementList.length == 1) {
            this.maskContainer.visible = true;
            this.rotateCenter.visible = true;
        } else {
            this.maskMultiContainer.visible = true;
            this.rotateCenter.visible = false;
        }
    }

    /*
     * 取消选择
    */
    public cancelSelect() {
        // this.hide();
        Event.triggerHandler('elementChanged', []);
    }

    /*
     * 更换鼠标状态
    */
    private changeMouseState(state) {
        Event.triggerHandler('mouseStateChange', state);
    }

    /*
     * 格式化矩阵 主要是转化tx ty为e f
    */
    private fmtMatrx(m: any) {
        m.e = m.tx;
        m.f = m.ty;

        delete m.tx;
        delete m.ty;
        return m;
    }

    private getElementBounds(element: any) {
        let bounds = element.getBounds();

        if(!bounds) {
            let pointLT;
            let pointRB;
            let tmpPointLT:any;
            let tmpPointRB:any;
            element.children.map((child, index) => {
                let tmpBounds = this.getElementBounds(child);
                
                if(tmpBounds.width > 0) {
                    tmpPointLT.x = tmpBounds.x;
                    tmpPointRB.x = tmpBounds.x + tmpBounds.width;
                } else {
                    tmpPointLT.x = tmpBounds.x + tmpBounds.width;
                    tmpPointRB.x = tmpBounds.x;
                }

                if(tmpBounds.height > 0) {
                    tmpPointLT.y = tmpBounds.y;
                    tmpPointRB.y = tmpBounds.y + tmpBounds.height;
                } else {
                    tmpPointLT.y = tmpBounds.y + tmpBounds.height;
                    tmpPointRB.y = tmpBounds.y;
                }

                if(!pointLT || pointLT.x > tmpPointLT.x || pointLT.y > tmpPointLT.y) {
                    pointLT.x = tmpPointLT.x;
                    pointLT.y = tmpPointLT.y;
                }

                if(!pointRB || pointRB.x < tmpPointRB.x || pointRB.y < tmpPointRB.y) {
                    pointRB.x = tmpPointRB.x;
                    pointRB.y = tmpPointRB.y;
                }
            });

            bounds = {
                x: pointLT.x,
                y: pointLT.y,
                width: pointRB.x - pointLT.x,
                height: pointRB.y - pointLT.y
            };
        }

        return bounds;
    }

    private getElementImg(element: any) {
        if(!this.imgCanvas) {
            let imgCanvas = document.createElement('canvas');
            document.body.appendChild(imgCanvas);
			imgCanvas.id = 'janvas';
			imgCanvas.style.display = 'none';
            this.imgCanvas = imgCanvas;
        } else {
            this.imgCanvas.getContext('2d').clearRect(0, 0, this.imgCanvas.width, this.imgCanvas.height);
        }

        let elementBounds = element.getBounds();

        this.imgCanvas.width = elementBounds.x + elementBounds.width;
        this.imgCanvas.height = elementBounds.y + elementBounds.height;

        element.draw(this.imgCanvas.getContext('2d'));

        let imgElement = new createjs.Bitmap(this.imgCanvas);

        imgElement.sourceRect = new createjs.Rectangle(
            elementBounds.x, 
            elementBounds.y, 
            elementBounds.width, 
            elementBounds.height
        );

        imgElement.regX = element.regX;
        imgElement.regY = element.regY;

        let matrix = element.getMatrix();

        matrix.decompose(imgElement);

        return imgElement;
    }

    /*
     * 自定义transform
     * 
     * 传入option参数都是相对值
    */
    public setTransform(element:any, option:any) {
        let data = Object.assign({}, this.oriTransformData);

        let matrix = new createjs.Matrix2D();

        let m2 = new createjs.Matrix2D();
        let m3 = new createjs.Matrix2D();
        let m4 = new createjs.Matrix2D();
        let m5 = new createjs.Matrix2D();

        m2.translate(
            option.translateX || -data.originX,
            option.translateY || -data.originY
        );

        // m3.c = Math.tan((option.skewX || data.skewX) * Math.PI / 180); //skewX
        // m3.b = Math.tan((option.skewY || data.skewY) * Math.PI / 180); //skewY

        m3.skew(
            option.skewX || data.skewX,
            option.skewY || data.skewY
        );

        m4.rotate(data.rotation + (option.rotation || 0));

        m5.scale(
            option.scaleX || data.scaleX, 
            option.scaleY || data.scaleY
        );

        matrix.appendMatrix(m4);
        matrix.appendMatrix(m3);
        matrix.appendMatrix(m5);
        matrix.appendMatrix(m2);

        element.transformMatrix = matrix;

        if(option.rotation != undefined) {
            this.transformData.rotation = data.rotation + option.rotation;
        }

        if(option.scaleX != undefined) {
            this.transformData.scaleX = option.scaleX;
        }

        if(option.scaleY != undefined) {
            this.transformData.scaleY = option.scaleY;
        }

        if(option.skewX != undefined) {
            this.transformData.skewX = option.skewX;
        }

        if(option.skewY != undefined) {
            this.transformData.skewY = option.skewY;
        }
    }
}