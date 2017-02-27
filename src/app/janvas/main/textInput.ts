declare var createjs: any;

import Event from './event';

export default class TextInput {
    private textContainer:any;
    private domInput:any;
    private eventList:any;
    private textValue:any;
    private textLock:boolean;
    private textData:any;
    private tmpCanvas:any;

    private DEFAULT_WIDTH:number = 14;
    private DEFAULT_HEIGHT:number = 20;
    private DEFAULT_SIZE:number = 10;

    public static EVENTS = {
		CHANGE: 'valueChange'
    }

    constructor(element:any, public setting:any) {

        this.textContainer = new createjs.Container();

        this.textContainer.set({
            x: setting.x,
            y: setting.y,
            width: this.DEFAULT_WIDTH, 
            height: this.DEFAULT_HEIGHT
        });

        if(element != null) {
            let instance = element.janvasInstance;
            this.textData = instance.item.source;
            this.textData.elementId = instance.id;
            this.textValue = this.textData.text;
        } else {
            this.textValue = '';
            this.textData = {
                type: 0,
                font: 'Arial',
                color: '#000000',
                background: {
                    repeat: false
                },
                size: 16,
                bold: false,
                italic: false,
                underline: false,
                strikethrough: false,
                lineheight: 20,
                x: setting.x,
                y: setting.y
            }
        }

        //init DomElement
        this.initInputDom();

        this.initEvent();
    }

    public getInstance() {
        return this.textContainer;
    }

    /*
	 * 初始化textInput事件
	*/
    private initEvent() {
        this.textContainer.on('click', (event) => {
            let position = this.getElementPosition();
            this.showInputDom(position.x, position.y);
        });
    }

    public parseSetting (setting) {
        return {
            x: setting.x,
            y: setting.y - this.DEFAULT_HEIGHT / 2,
            width: setting.width || this.DEFAULT_WIDTH,
            height: (setting.height || this.DEFAULT_HEIGHT) + 'px',
            size: Math.max(setting.size || 0, this.DEFAULT_SIZE, this.textValue.length || 0)
        };
    }

    public set(setting:any) {
        setting = this.parseSetting(setting);
        this.textContainer.set({
            x: setting.x,
            y: setting.y
        });

        this.domInput.htmlElement.style.width = setting.width + 'px';
        this.domInput.htmlElement.style.height = setting.height;

        this.textLock = true;

        setTimeout(()=>{
            this.domInput.htmlElement.focus();
        },100);
    }

    /*
	 * 初始化dom的input 用作输入
	*/
    private initInputDom() {
        let input = new createjs.DOMElement(document.createElement('textarea'));
        let htmlEle = input.htmlElement;
        let eleStyle = htmlEle.style;

        this.domInput = input;

        htmlEle.id = 'text-input';

        eleStyle.height = (this.setting.height || this.DEFAULT_HEIGHT) + 'px';
        eleStyle.lineHeight = '20px';
        eleStyle.top = '0';
        eleStyle.left = '0';
        eleStyle.visibility = 'hidden';
        eleStyle.background = '#fff';
        eleStyle.border = 'none';
        eleStyle.borderBottom = '1px solid #000';
        eleStyle.padding = '0';
        eleStyle.margin = '0';
        eleStyle.fontSize = '16px';
        eleStyle.fontFamily = 'arial';
        eleStyle.outline = 'none';
        eleStyle.resize = 'none';
        eleStyle.overflow = 'hidden';

        htmlEle.value = this.textValue;

        this.set(this.setting);
        this.textContainer.addChild(this.domInput);
        document.body.appendChild(htmlEle);
        
        htmlEle.addEventListener('input', (event) => {
            let domInput = event.target;
            let reg = /[\r\n]+/g;
            let rowNum = 1;

            //循环获取换行，用textBounds获取高度不准确
            for(let index in domInput.value){
                if(reg.test(domInput.value[index])) {//如果是换行符
                    rowNum++;
                }
            }

            let textBounds = this.getTextBounds(domInput.value);
            domInput.style.width = (textBounds.width || this.DEFAULT_WIDTH) + 'px';
            domInput.style.height = rowNum * this.DEFAULT_HEIGHT + 'px';
        });

        htmlEle.addEventListener('keydown', (event) => {
            let keyCode = event.keyCode;

            if (keyCode == '13' && event.metaKey) {//command + 回车 结束编辑
                this.updateJanvasText();
                this.destroy();
            } else if(keyCode == '27') {
                this.destroy();
            }
        });
    }

    private showInputDom(offsetX:number, offsetY:number) {
        let input = this.domInput;

        input.style.display = 'block';
        input.style.left = offsetX;
        input.style.top = offsetY;
        input.focus();

        this.textLock = true;
    }

    private getElementPosition() {
        let element = this.textContainer;
        let stage;

        while(element.parent) {
            stage = element.parent;
        }

        let elementX = element.localToGlobal(element.x);
        let elementY = element.localToGlobal(element.y);

        return {
            x: stage.canvas.offsetLeft + elementX,
            y: stage.canvas.offsetTop + elementY
        }
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

	/*
	 * 事件触发器
	*/
	public triggerHandler(eventName:string, returnData:Object) {
		let eventCallback = this.eventList[eventName];
		if(eventCallback) {
			eventCallback(returnData);
		}
	}

    /**
     * 更新janvas text
     */
    public updateJanvasText() {
        let returnData = this.textData;
        let htmlEle = this.domInput.htmlElement;

        returnData.text = htmlEle.value;
        returnData.width = parseFloat(htmlEle.style.width.split('px')[0]) || 0;
        returnData.height = parseFloat(htmlEle.style.height.split('px')[0]) || 0;

        Event.triggerHandler('textChanged', returnData);
    }

    /**
     * 销毁
     */
    public destroy() {
        this.textContainer.removeAllChildren();
        this.textContainer.removeAllEventListeners();
        this.domInput.htmlElement.remove();

        this.textLock = false;
    }

    public isLock() {
        return this.textLock;
    }

    private isChinese(temp) {
        var re = /[^\u4E00-\u9FFF]/;

        return !re.test(temp);
    }

    private getTextBounds(text, fontStyle?) {
        let textEle = new createjs.Text(text, '16px Arial', '#000000');

        return textEle.getBounds();
    }
}