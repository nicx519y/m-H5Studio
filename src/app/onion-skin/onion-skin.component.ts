import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { MainService } from '../main.service';
import { TimelineService } from '../timeline.service';

@Component({
	selector: 'ide-onion-skin',
	templateUrl: './onion-skin.component.html',
	styleUrls: ['./onion-skin.component.css'],
})
export class OnionSkinComponent implements OnInit {

	@Input()
	private stageName: string;

	@Input()
	private zoom: number;

	private formData: { zoom: number } = { zoom: NaN };

	constructor(
		private timelineService: TimelineService,
	) {

	}

	private onZoomSubmit() {
		this.timelineService.setZoom(this.formData.zoom);
	}

	ngOnInit() {

	}

	ngOnChanges(changes: SimpleChanges) {
		if(changes.hasOwnProperty('zoom')) {
			if(this.formData.zoom !== this.zoom)
				this.formData.zoom = this.zoom;
		}
	}

}
