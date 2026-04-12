import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavbarComponent } from '../../core/layout/navbar/navbar.component';
import { FooterComponent } from '../../core/layout/footer/footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {}
