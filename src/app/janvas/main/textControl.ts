declare var createjs: any;

import Mouse from './mouse';
import Event from './event';

export default class textControl {
    private textLock;
    private element;
    private stage;
    private textCase;
    private janvasStage;
    private graphics;

    constructor(janvasStage:any, stage:any) {
        this.textLock = false;
        this.janvasStage = janvasStage;
        this.stage = stage;

        this.textCase = new createjs.Shape(
            new createjs.Graphics()
        );
        this.stage.addChild(this.textCase);

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

        let elementId = '';

        //对文字进行描边
        if(element.isText) {
            this.element = element.janvasInstance.instance;
            this.signText();

            elementId = element.janvasInstance.id;
        }

        Event.triggerHandler('textChanged', {
        	id: elementId,
            isDestroy: false,
        	x: point.x,
        	y: point.y
        });

        // this.textLock = true;
    }

    public isLock() {
        return this.textLock;
    }

    private signText() {
        let bounds = this.element.parent.getBounds();
        let point = this.janvasStage.localToGlobal(bounds.x, bounds.y);

        this.textCase.graphics.clear()
            .beginStroke('#000000')
            .moveTo(point.x, point.y)
            .lineTo(point.x + bounds.width, point.y)
            .lineTo(point.x + bounds.width, point.y + bounds.height)
            .lineTo(point.x, point.y + bounds.height)
            .lineTo(point.x, point.y)
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