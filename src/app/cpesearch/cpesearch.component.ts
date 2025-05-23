import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VulnerabilityService } from '../../shared/VulnerabilityService';
import { environment } from '../../environments/environments';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { Renderer2 } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-cpesearch',
  imports: [CommonModule, FormsModule, MatSelectModule, MatIcon],
  templateUrl: './cpesearch.component.html',
  styleUrls: ['./cpesearch.component.css','./cpesearch.component.scss'],
})
export class CpesearchComponent implements OnInit, AfterViewInit, AfterViewChecked {
  cpeData: any[] = [];
  darkMode: boolean = false;
  isLoading: boolean = false;
  pageIndex: number = 0;
  initialIndex: number = 0;
  totalPages: number = 0;
  start: number = 0;
  end: number = 0;
  pageSize: number = 10;
  pageSizes:Array<number> = [];
  pagedCpeData: any = [];
  portNumber:number = 8080;
  cd: any;
  @ViewChild('noCpeData') noCpeData!: ElementRef;
  constructor(private vulnService: VulnerabilityService, private http: HttpClient, private router: Router, private renderer: Renderer2,
    private snackBar: MatSnackBar
  ) {
    this.vulnService.getDarkMode().subscribe((mode: boolean) => {
      this.darkMode = mode;
    });
  }
  ngOnInit(): void {
     this.vulnService.getDarkMode().subscribe((mode:boolean) => {
      this.darkMode = mode;
    });
    this.vulnService.cpeData$.subscribe((data: any) => {
      this.cpeData = data;
      this.updatePagedData(this.initialIndex);
      this.isLoading = false;
    });
    this.vulnService.portNumber$.subscribe((portNumber:number)=>{
       this.portNumber = portNumber;
    });
  }
  ngAfterViewInit(): void {
      if(this.cpeData.length === 0) {
          this.vulnService.navBarHeight$.subscribe((height: number) => {
          this.renderer.setStyle(this.noCpeData.nativeElement, 'height', `${window.innerHeight - height}px`);
      }) 
      }
  }
  ngAfterViewChecked(): void {
    if(this.cpeData.length === 0) {
        this.vulnService.navBarHeight$.subscribe((height: number) => {
        this.renderer.setStyle(this.noCpeData.nativeElement, 'height', `${window.innerHeight - height}px`);
      }) 
      }
  }
  searchCpeName(cpeName: string) {
    this.vulnService.setLoading(true);
    console.log(cpeName, this.isLoading);
    this.http.get<any>(`${environment.baseLocaUrl}${this.portNumber}${environment.searchByCpeName}${cpeName}`).subscribe({
       next:(response)=> {
        this.vulnService.setDarkMode(this.darkMode);
        this.vulnService.setVulnerabilityData(response);
        this.vulnService.setTempVulnerability(false);
        this.router.navigate(['/vulnerabilityList']);
        this.vulnService.setLoading(false);
       },error: (error) => {
        this.snackBar.open('Unexpected Error Occured', 'Dismiss', { duration: 5000, 
        panelClass: ['snackbar-error'] });
        this.vulnService.setLoading(false);
        console.error("Error fetching data:", error);
       }    
    
  })
}
searchCPEs(event: Event) {
const inputValue = (event.target as HTMLInputElement).value.toLowerCase();
    console.log(inputValue);
      if(inputValue === '') {
        this.pageIndex = 0;
        this.updatePagedData(this.initialIndex);
      } else {
      this.pagedCpeData = this.cpeData.filter((cpe:any) => {
          return cpe?.cpe23Uri.toLowerCase().includes(inputValue.toLowerCase());
      });
    }
}

nextPage(): void {
    if(this.pageIndex >= 0 && this.pageIndex <= this.totalPages && this.pageIndex !== this.totalPages - 1) {
    this.pageIndex++;
    this.start = this.pageIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pagedCpeData = this.cpeData.slice(this.start, this.end);
    }
   }
   previousPage(): void {
    if(this.pageIndex > 0) {
      this.pageIndex--;
      this.start = this.pageIndex * this.pageSize;
      this.end = this.start + this.pageSize;
      this.pagedCpeData = this.cpeData.slice(this.start, this.end);
    }
   }
  
   updatePagedData(initialIndex:number): void {
    let pages = Math.ceil(this.cpeData.length / this.pageSize);
    this.totalPages = pages;
    this.start = initialIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    console.log(this.pageSizes);
    const len = this.cpeData.length;
    this.pageSizes = len >= 100 ? [10, 25, 50, 100] : len <= 100 && len >= 50 ? [10, 25, 50] : 
    len <= 50 && len >= 25 ? [5, 10, 25] : len <= 25 && len >= 10 ? [5,10] : len <=10 && len >= 0 ? [5] : [0];
    this.pagedCpeData = this.cpeData.slice(this.start, this.end);
    console.log(this.cpeData);
   }
   onPageSizeChange(event: MatSelectChange): void {
   this.pageSize = event.value;
   this.pageIndex = 0
   this.updatePagedData(this.initialIndex);
   }
}
