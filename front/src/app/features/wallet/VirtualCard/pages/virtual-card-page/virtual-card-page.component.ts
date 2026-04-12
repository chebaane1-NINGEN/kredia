import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: true,
  templateUrl: './virtual-card-page.component.html',
  styleUrl: './virtual-card-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VirtualCardPageComponent {}
