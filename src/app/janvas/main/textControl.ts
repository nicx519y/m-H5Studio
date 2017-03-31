declare var createjs: any;

import Mouse from './mouse';
import Event from './event';

export default class textControl {
    private textLock;
    private canvasElement;
    private element;
    private stage;
    private textCase;

    constructor(canvasElement:any, stage:any) {
        this.textLock = false;
        this.canvasElement = canvasElement;
        this.stage = stage;

        this.initEvent();
    }

    private initEvent() {
        document.addEventListener('keydown', (event) => {
            if(!this.isLock()) {
                return;
            }

            let keyCode = event.keyCode;

            if (keyCode == 13 && event.metaKey) {//command + 回车 结束编辑
                this.destroy();
            } else if(keyCode == 27) {
                this.destroy();
            }
        });
    }

    public chooseText(element: any, point: any) {
        if(this.isLock()) {
            return;
        }

        let elementId = element.text ? element.janvasInstance.id : '';

        Event.triggerHandler('textChanged', {
        	id: elementId,
            isDestroy: false,
        	x: point.x,
        	y: point.y
        });

        //对文字进行描边
        if(element.text) {
            this.element = element.parent;
            this.signText();
        }

        this.textLock = true;
    }

    public isLock() {
        return this.textLock;
    }

    private signText() {
        let bounds = this.element.getBounds();

        this.textCase = new createjs.Shape(
            new createjs.Graphics()
                .beginStroke('#000000')
                .moveTo(bounds.x, bounds.y)
                .lineTo(bounds.x + bounds.width, bounds.y)
                .lineTo(bounds.x + bounds.width, bounds.y + bounds.height)
                .lineTo(bounds.x, bounds.y + bounds.height)
        );
        this.stage.addChild(this.textCase);
    }

    public destroy() {
        this.stage.removeChild(this.textCase);
        this.textLock = false;

        Event.triggerHandler('textChanged', {
        	id: '',
            isDestroy: true
        });
    }
}