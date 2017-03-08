import { Component, ElementRef, Renderer, Input, OnInit } from '@angular/core';
import { HotKeyModel } from '../models';

@Component({
    selector: 'ide-hot-keys',
    templateUrl: './hot-keys.component.html',
    styleUrls: ['./hot-keys.component.css'],
})
export class HotKeysComponent implements OnInit {

    @Input()
    private apis: {};

    private hotKeysConfig: HotKeyModel[] = [
        new HotKeyModel({
            api: 'changeToKeyFrames',
            key: 'f6',
            desc: '转换为关键帧'
        }),
        new HotKeyModel({
            api: 'removeKeyFrames',
            key: 'f6',
            shift: true,
            desc: '删除关键帧'
        }),
        new HotKeyModel({
            api: 'changeToFrames',
            key: 'f5',
            desc: '转换为普通帧'
        }),
        new HotKeyModel({
            api: 'removeFrames',
            key: 'f5',
            shift: true,
            desc: '删除帧'
        }),
        new HotKeyModel({
            api: 'changeToEmptyKeyFrames',
            key: 'f7',
            desc: '转换为空白关键帧'
        }),
        new HotKeyModel({
            api: 'addTweens',
            key: 'f8',
            desc: '添加补间动画'
        }),
        new HotKeyModel({
            api: 'removeTweens',
            key: 'f8',
            shift: true,
            desc: '移除动画'
        }),
        new HotKeyModel({
            api: 'selectElementMode',
            key: 'v',
            desc: '元素变换模式'
        }),
        new HotKeyModel({
            api: 'moveMode',
            key: 'h',
            desc: '移动视图模式',
        }),
        new HotKeyModel({
            api: 'zoomMode',
            key: 'z',
            desc: '缩放舞台模式'
        }),
        new HotKeyModel({
            api: 'drawMode',
            key: 'b',
            desc: '绘制模式'
        }),
        new HotKeyModel({
            api: 'textEditMode',
            key: 't',
            desc: '文本编辑模式'
        }),
        new HotKeyModel({
            api: 'saveData',
            ctrl: true,
            key: 's',
            desc: '保存数据'
        }),
        new HotKeyModel({
            api: 'preview',
            ctrl: true,
            key: 'v',
            desc: '预览'
        }),
        new HotKeyModel({
            api: 'fullscreen',
            key: 'f',
            desc: '全屏'
        }),
        new HotKeyModel({
            api: 'showPageConfiger',
            ctrl: true,
            key: ',',
            desc: '页面配置'
        }),
        new HotKeyModel({
            api: 'importBitmaps',
            ctrl: true,
            key: 'b',
            desc: '导入图片'
        }),
        new HotKeyModel({
            api: 'createItem',
            ctrl: true,
            key: 'i',
            desc: '新建元件'
        }),
        new HotKeyModel({
            api: 'addPage',
            ctrl: true,
            key: 'p',
            desc: '新增页面'
        })
    ];

    constructor() {

    }

    private keyupHandler(evt: KeyboardEvent) {
        //如果焦点不在body（有可能在input或者是select上），则热键不生效
        if (document.activeElement.tagName.toLocaleLowerCase() != 'body')
            return;

        let model: HotKeyModel = this.hotKeysConfig.find(config => {
            return (config.get('ctrl') === evt.ctrlKey) &&
                (config.get('alt') === evt.altKey) &&
                (config.get('shift') === evt.shiftKey) &&
                (config.get('key') === evt.key.toLowerCase());
        });

        if (!model || typeof this.apis[model.get('api')] != 'function') return;

        this.apis[model.get('api')]();

        evt.stopPropagation();
        evt.preventDefault();
    }

    ngAfterViewInit() {
        document.addEventListener('keyup', event => {
            this.keyupHandler(event);
        });
    }

    ngOnInit() {
    }

}
