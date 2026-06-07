import {
  Directive,
  inject,
  OnDestroy,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { PageControlsService } from './page-controls.service';

@Directive({ selector: 'ng-template[ngxPageControls]' })
export class NgxPageControlsDirective implements OnInit, OnDestroy {
  private readonly service = inject(PageControlsService);
  private readonly templateRef = inject(TemplateRef);

  ngOnInit(): void {
    this.service.register(this.templateRef);
  }

  ngOnDestroy(): void {
    this.service.clearIfOwner(this.templateRef);
  }
}
