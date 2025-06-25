import { Component, OnInit } from '@angular/core';
import { VulnerabilityService } from '../../shared/VulnerabilityService';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboardcontent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboardcontent.component.html',
  styleUrl: './dashboardcontent.component.css'
})
export class DashboardcontentComponent implements OnInit{
     darkMode = false;
     constructor (private vulnService: VulnerabilityService, ) {}
     ngOnInit(): void {
      this.vulnService.getDarkMode().subscribe((mode: boolean) => {
        console.log('Dark mode status:', mode);
        this.darkMode = mode;
      }); 
      this.vulnService.setIsStickyNavbar(false);
     }
}
