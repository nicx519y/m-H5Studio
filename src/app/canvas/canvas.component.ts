import { 
    Component, 
    OnInit, 
    OnChanges, 
    ViewChild, 
    ElementRef, 
    ViewContainerRef, 
    HostListener, 
    Input, 
    Output,
    ChangeDetectionStrategy,
    EventEmitter,
    ChangeDetectorRef,
    OnDestroy,
    SimpleChanges,
    SimpleChange,
} from '@angular/core';
import { MainModel, EditorState, ElementModel, ElementStateModel, FrameModel, PageModel, ItemModel, MF } from '../models';
import { TimelineService } from '../timeline.service';
import { AttrsService, AttrsMod } from '../attrs.service';
import { CanvasRenderService } from '../canvas-render.service';
import Developer from '@JDB/janvas-developer/app/main/developer';
// import { MainService } from '../main.service';

import * as Immutable from 'immutable';
import { List, Map as ImmutableMap, Record } from 'immutable';

@Component({
    selector: 'ide-canvas',
    templateUrl: './canvas.component.html',
    styleUrls: ['./canvas.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements OnInit {

    @ViewChild('dev')
    private devCanvas: ElementRef;

    @ViewChild('box')
    private box: ElementRef;

    @Input()
    private mode: EditorState = EditorState.choose;

    @Input()
    private hasData: boolean;

    @Input()
    private activeOptions: List<Map<string, any>> = Immutable.List<Map<string, number>>();

    @Input()
    private activePageModel: PageModel;

    @Input()
    private itemsModel: List<ItemModel>;

    @Input()
    private selectedElements: List<ImmutableMap<string, any>>;

    constructor(
        private timelineService: TimelineService,
        private attrsService: AttrsService,
        private canvasRenderService: CanvasRenderService,
        private container: ViewContainerRef,
    ) {
    }


    @HostListener('window:resize')
    private resizeHandler() {
        let w: number = this.container.element.nativeElement.offsetWidth;
        let h: number = this.container.element.nativeElement.offsetHeight;
        this.box.nativeElement.style.width = w + 'px';
        this.box.nativeElement.style.height = h + 'px';
        this.canvasRenderService.janvasResize(w, h);
    }
    
    ngOnInit() {
        
    }

    ngOnDestroy() {

    }

    ngAfterViewInit() {
        // this.timelineService.registerElementStateCreator(this.elementStateCreator.bind(this));
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log('canvavs changes: ', changes);
        if(changes.hasOwnProperty('activePageModel') && this.hasData) {
            this.canvasRenderService.activePageModel = this.activePageModel;
            if(!this.canvasRenderService.getJanvasIsInited()){
                this.canvasRenderService.janvasInit('dev');
                this.resizeHandler();
            } else {
                this.canvasRenderService.janvasUpdate();
            }
        }
        if(changes.hasOwnProperty('mode')) {
            this.canvasRenderService.modeChange(this.mode);
        }
        if(changes.hasOwnProperty('activeOptions')) {
            this.canvasRenderService.activeOptions = this.activeOptions;
            this.canvasRenderService.activeOptionsChange(changes['activeOptions']);
        }
        if(changes.hasOwnProperty('itemsModel')) {
            this.canvasRenderService.itemsModel = this.itemsModel;
        }
        if(changes.hasOwnProperty('selectedElements')) {
            this.timelineService.setActiveOptions(this.selectedElements.toJS(), false);
        }
    }
    
    
}
