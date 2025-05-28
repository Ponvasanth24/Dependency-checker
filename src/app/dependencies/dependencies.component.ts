import { AfterViewChecked, AfterViewInit, Component, ElementRef, input, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { VulnerabilityService } from '../../shared/VulnerabilityService';
import { NavigationEnd, Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectChange } from '@angular/material/select';
import { ChangeDetectorRef } from '@angular/core';
import { Renderer2 } from '@angular/core';
import { HighlightPipe } from '../../shared/HighlightSearch';
import { CVSSPaginationService } from '../../shared/CVSSPaginationService';
import { filter } from 'rxjs';
@Component({
  selector: 'app-dependencies',
  imports: [CommonModule, MatTableModule, MatCardModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, FormsModule, MatIconModule, MatButtonModule, HighlightPipe
  ],
  templateUrl: './dependencies.component.html',
  styleUrl: './dependencies.component.css'
})
export class DependenciesComponent implements OnInit, AfterViewInit, AfterViewChecked{
    @Input() dependencies:any = [];
    @Input() darkMode:boolean = false;
    pagedDependencies: any[] = [];
    pageIndex:number = 0;
    pageSize:number = 10;
    initialIndex:number = 0;
    currentPageSize:number = this.pageSize;
    totalPages:number = 0;
    pageSizes:Array<number> = [];
    start:number = 0;
    end:number = 0;
    searchTerm: string = '';
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild('noDependency') noDependency!: ElementRef;
    displayedColumns: string[] = ['dependencyName', 'vendor', 'product', 'version'];
    constructor(private vulnService:VulnerabilityService, private router: Router, private location:Location, private cd: ChangeDetectorRef,
      private renderer: Renderer2, private paginationService: CVSSPaginationService
    ){}
    ngOnInit(): void {
      this.vulnService.getDarkMode().subscribe((mode: boolean) => {
        this.darkMode = mode;
      });
      const deps = sessionStorage.getItem('dependencies');
      const depsFromSession = deps ? JSON.parse(deps) : [];
      let dependenciesFromService:any[] = [];
      this.vulnService.dependencies$.subscribe((dependencies:any[]) => {
         dependenciesFromService = dependencies;
         this.dependencies = depsFromSession.length > 0 ? depsFromSession : dependenciesFromService.length > 0 ? dependenciesFromService : [];
         this.initialIndex = this.paginationService.getDepInitialIndex();
         this.pageSize = this.paginationService.getDepPageSize();
         this.initialIndex * this.pageSize < this.dependencies.length ? this.pageIndex = this.initialIndex : this.pageIndex = 0;
         this.updatePagedData(this.pageIndex);
      });
     
      console.log(this.dependencies);
    }
    ngAfterViewInit(): void {
      if(this.dependencies.length === 0) {
          this.vulnService.navBarHeight$.subscribe((height: number) => {
              this.renderer.setStyle(this.noDependency.nativeElement, 'height', `${window.innerHeight - height}px`);
          }) 
        }
    }
  ngAfterViewChecked(): void {
    if(this.dependencies.length === 0) {
          this.vulnService.navBarHeight$.subscribe((height: number) => {
              this.renderer.setStyle(this.noDependency.nativeElement, 'height', `${window.innerHeight - height}px`);
          }) 
        }  
  }
  handleDependency(dependency: any) {
    if(dependency.vulnerabilities?.length > 0){
      this.viewDependency(dependency.vulnerabilities);
    } else{
      this.viewCPEs(dependency.likelyCPEs)
    }
  }
  viewDependency(vulnerabilityData:any) {
          console.log(vulnerabilityData);
          this.vulnService.setDarkMode(this.darkMode);
          this.vulnService.setTempVulnerability(false);
          this.router.navigate(['/vulnerabilityList']);
          this.vulnService.setVulnerabilityData(vulnerabilityData);
   }
   viewCPEs(CPEs: any) {
        this.vulnService.setCpeData(CPEs);
          this.router.navigate(['/cpeSearchResults']);
   }
   nextPage(): void {
    if(this.pageIndex >= 0 && this.pageIndex <= this.totalPages && this.pageIndex !== this.totalPages - 1) {
    this.pageIndex++;
    this.paginationService.setDepInitialIndex(this.pageIndex);
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
   this.paginationService.setDepPageSize(this.pageSize);
   this.initialIndex * this.pageSize < this.dependencies.length ? this.pageIndex = this.initialIndex : this.pageIndex = 0;
   this.updatePagedData(this.pageIndex);
   }
   searchDependencies(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value.toLowerCase();
    console.log(inputValue);
    this.searchTerm = inputValue;
      if(inputValue === '') {
        this.pageIndex = 0;
        this.updatePagedData(this.initialIndex);
      } else {
      this.pagedDependencies = this.dependencies.filter((dep:any) => {
          return dep?.dependencyName.toLowerCase().includes(inputValue.toLowerCase()) || dep?.cpeEnumeration?.vendor.toLowerCase().includes(inputValue.toLowerCase()) ||
           dep?.cpeEnumeration?.product.toLowerCase().includes(inputValue.toLowerCase()) || dep?.cpeEnumeration?.version.toLowerCase().includes(inputValue.toLowerCase());
      });
    }
     this.cd.detectChanges();
   }
   goBack(): void {
   this.location.back();
  }
}
