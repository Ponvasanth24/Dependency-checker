import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { VulnerabilityService } from '../../shared/VulnerabilityService';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-dependencies',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule],
  templateUrl: './dependencies.component.html',
  styleUrl: './dependencies.component.css'
})
export class DependenciesComponent implements OnInit{
    @Input() dependencies:any = [];
    @Input() lightMode:boolean = false;
    displayedColumns: string[] = ['dependencyName', 'vendor', 'product', 'version'];
    constructor(private vulnService:VulnerabilityService, private router: Router, private location:Location){}
    ngOnInit(): void {
      // let state = this.location.getState() as { dependencies: any[] };
      // this.dependencies = state.dependencies;
      // console.log(this.dependencies);
      this.vulnService.getLightMode().subscribe((mode: boolean) => {
        this.lightMode = mode;
      });
       this.vulnService.dependencies$.subscribe((data:any[]) => {
          this.dependencies = data;
         })
    }
    viewDependency(vulnerabilityData:any) {
          console.log(vulnerabilityData);
          this.vulnService.setLightMode(this.lightMode);
          this.router.navigate(['/vulnerabilityList']);
          this.vulnService.setVulnerabilityData(vulnerabilityData);
    }
}
