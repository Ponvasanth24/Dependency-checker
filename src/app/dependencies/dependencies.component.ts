import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { VulnerabilityService } from '../../shared/VulnerabilityService';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectChange } from '@angular/material/select';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-dependencies',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, FormsModule, MatIconModule, MatButtonModule
  ],
  templateUrl: './dependencies.component.html',
  styleUrl: './dependencies.component.css'
})
export class DependenciesComponent implements OnInit{
    @Input() dependencies:any = [];
    @Input() lightMode:boolean = false;
    pagedDependencies: any[] = [];
    pageIndex:number = 0;
    pageSize:number = 10;
    initialIndex:number = 0;
    currentPageSize:number = this.pageSize;
    totalPages:number = 0;
    pageSizes:Array<number> = [];
    start:number = 0;
    end:number = 0;
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    displayedColumns: string[] = ['dependencyName', 'vendor', 'product', 'version'];
    constructor(private vulnService:VulnerabilityService, private router: Router, private location:Location, private cd: ChangeDetectorRef){}
  ngOnInit(): void {
      // let state = this.location.getState() as { dependencies: any[] };
      // this.dependencies = state.dependencies;
      // console.log(this.dependencies);
      this.vulnService.getLightMode().subscribe((mode: boolean) => {
        this.lightMode = mode;
      });
       this.vulnService.dependencies$.subscribe((data:any[]) => {
          this.dependencies = data;
          this.updatePagedData(this. initialIndex);
      });   
    }
   viewDependency(vulnerabilityData:any) {
          console.log(vulnerabilityData);
          this.vulnService.setLightMode(this.lightMode);
          this.router.navigate(['/vulnerabilityList']);
          this.vulnService.setVulnerabilityData(vulnerabilityData);
   }
   nextPage(): void {
    console.log("called")
    if(this.pageIndex >= 0 && this.pageIndex <= this.totalPages && this.pageIndex !== this.totalPages - 1) {
      console.log("called inside")
    this.pageIndex++;
    this.start = this.pageIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pagedDependencies = this.dependencies.slice(this.start, this.end);
    console.log(this.pagedDependencies, this.start, this.end);
    this.cd.detectChanges();
    }
   }
   previousPage(): void {
    if(this.pageIndex > 0) {
      this.pageIndex--;
      this.start = this.pageIndex * this.pageSize;
      this.end = this.start + this.pageSize;
      this.pagedDependencies = this.dependencies.slice(this.start, this.end);
      this.cd.detectChanges();
    }
   }
  
   updatePagedData(initialIndex: number): void {
    let pages = Math.ceil(this.dependencies.length / this.pageSize);
    this.totalPages = pages;
    this.start = initialIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pageSizes = this.dependencies.length >= 100 ? [10, 25, 50, 100] : this.dependencies.length <= 100 && this.dependencies.length >= 50 ? [10, 25, 50] : 
    this.dependencies.length <= 50 && this.dependencies.length >= 25 ? [10, 25] : this.dependencies.length <= 25 && this.dependencies.length >= 10 ? [10] : [5];
    this.pagedDependencies = this.dependencies.slice(this.start, this.end);
   }
   onPageSizeChange(event: MatSelectChange): void {
   this.pageSize = event.value;
   this.updatePagedData(this.initialIndex);
   }
}
