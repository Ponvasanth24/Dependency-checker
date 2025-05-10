import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VulnerabilityComponent } from './vulnerability/vulnerability.component';
import { DashboardComponent } from './dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, VulnerabilityComponent, DashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Dependency_checker';
}
