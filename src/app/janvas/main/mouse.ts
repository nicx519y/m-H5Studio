declare var createjs: any;

export default class Mouse {
    private mouseContainer: any;
    private mouseIcon: any;
    private nowIcon: string;

    private MOUSE_WIDTH:number = 20;
    private MOUSE_HEIGHT:number = 20;

    private ICON_PRE_PATH:string = '/app/image/';
    public static MOUSE_NAME:string = 'controlMouse';

    public static STATE = {
        MOUSE_AUTO: 'mouseAuto',
        HAND: 'hand',
        DRAGE: 'drage',
        MOUSE_MOVE: 'mouseMove',
        SKEW_TOP_BOTTOM: 'skewElementTopBottom',
        SKEW_LEFT_RIGHT: 'skewElementLeftRight',
        ROTATE_LEFT_TOP: 'rotateElementLeftTop',
        ROTATE_LEFT_BOTTOM: 'rotateElementLeftBottom',
        ROTATE_RIGHT_TOP: 'rotateElementRightTop',
        ROTATE_RIGHT_BOTTOM: 'rotateElementRightBottom',
        TEXT: 'textElement',
        MOUSE_MOVE_REG: 'mouseMoveReg',
        SCALE_TOP_BOTTOM: 'scaleTopBottom',
        SCALE_LEFT_RIGHT: 'scaleLeftRight',
        SCALE_TILT_LEFT: 'scaleTiltLeft',
        SCALE_TILT_RIGHT: 'scaleTiltRight',
    }

    private iconPath = {};

    constructor() {
        this.mouseContainer = new createjs.Container();
        this.mouseContainer.name = Mouse.MOUSE_NAME;

        this.mouseContainer.mouseEnabled = false;
        this.mouseContainer.mouseChildren = false;

        this.mouseIcon = new createjs.Bitmap();
        this.mouseIcon.name = Mouse.MOUSE_NAME + '_bm';

        this.mouseIcon.mouseEnabled = false;
        this.mouseIcon.mouseChildren = false;

        this.initIcon();

        this.mouseContainer.addChild(this.mouseIcon);
    }

    private initIcon() {
        Object.keys(Mouse.STATE).forEach(key => {
            let value = Mouse.STATE[key];
            this.iconPath[value] = this.ICON_PRE_PATH + value + '.png';
        });
    }

    public updateMouseState(icon) {
        if(this.nowIcon == icon) {
            return;
        }

        this.nowIcon = icon;
        let iconPath = this.iconPath[icon];

        let img = document.createElement('img');
        img.src = iconPath;

        img.onload = () => {
            //非mouse开头的state 把旋转中心定位到中间
            if(icon.indexOf('mouse') != 0) {
                this.mouseContainer.regX = img.width / 2;
                this.mouseContainer.regY = img.height / 2;
            } else {
                this.mouseContainer.regX = 0;
                this.mouseContainer.regY = 0;
            }

            this.mouseIcon.image = img;

            // let maxSize = img.width > img.height ? img.width : img.height;

            // this.resizeMouse(maxSize / this.MOUSE_WIDTH);
            // let s = this.MOUSE_WIDTH / maxSize;
            // this.mouseContainer.scaleX = s;
            // this.mouseContainer.scaleY = s;
        }
    }

    public updateMousePosition(stageX, stageY) {
        if(stageX + 1 != this.mouseContainer.x) {
            this.mouseContainer.x = stageX + 1;
        }

        if(stageY + 1 != this.mouseContainer.y) {
            this.mouseContainer.y = stageY + 1;
        }
    }

    public hide() {
        this.mouseContainer.visible = false;
    }

    public show() {
        this.mouseContainer.visible = true;
    }

    public getInstance() {
        return this.mouseContainer;
    }

    public scaleMouse(scale:number) {
        this.mouseContainer.scaleX = scale;
        this.mouseContainer.scaleY = scale;
    }
}