/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { CanvasRenderService } from './canvas-render.service';

describe('CanvasRenderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CanvasRenderService]
    });
  });

  it('should ...', inject([CanvasRenderService], (service: CanvasRenderService) => {
    expect(service).toBeTruthy();
  }));
});
