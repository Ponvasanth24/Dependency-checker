import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VulnerabilityService } from '../../shared/VulnerabilityService';
import { environment } from '../../environments/environments';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { Renderer2 } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';
import { HighlightPipe } from '../../shared/HighlightSearch';
import { CVSSPaginationService } from '../../shared/CVSSPaginationService';
import { AppRoutes } from '../../shared/AppRoutes';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DependencyData } from '../../CVSS_Models/CvssModels';
import { catchError, finalize, firstValueFrom, throwError } from 'rxjs';
import { MatDialog, MatDialogRef,MatDialogModule} from '@angular/material/dialog';
@Component({
  selector: 'app-cpesearch',
  imports: [CommonModule, FormsModule, MatSelectModule, MatIcon, HighlightPipe, MatTooltipModule, MatDialogModule],
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
  searchVariant: boolean = false;
  saveDependencyHintEndpoint: string;
  baseUrl: string = '';
  dialogRef!: MatDialogRef<any>;
  dependencyData: DependencyData = {
    dependencyName: '',
    artifact: undefined,
    vendorEvidences: [],
    productEvidences: [],
    versionEvidences: [],
    cpeEnumeration: undefined,
    vulnerabilities: [],
    likelyCPEs: []
  };
  searchTerm: string = '';
  @ViewChild('noCpeData') noCpeData!: ElementRef;
  @ViewChildren('cpeRow') cpeRows!: QueryList<ElementRef>;
  @ViewChild('table') table!: ElementRef;
  @ViewChild('cpeList') cpeList!: ElementRef;
  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;
  constructor(private vulnService: VulnerabilityService, private http: HttpClient, private router: Router, private renderer: Renderer2,
    private snackBar: MatSnackBar, private location: Location, private paginationService: CVSSPaginationService,
    private dialog: MatDialog
  ) {
    this.vulnService.getDarkMode().subscribe((mode: boolean) => {
      this.darkMode = mode;
    });
    this.baseUrl = `${environment.baseLocaUrl}${this.portNumber}`;
    this.saveDependencyHintEndpoint = `${this.baseUrl}${environment.saveDependencyHint}`;
  }
  ngOnInit(): void {
     this.vulnService.getDarkMode().subscribe((mode:boolean) => {
      this.darkMode = mode;
    });
    this.vulnService.cpeData$.subscribe((data: any) => {
      this.cpeData = data;
      this.initialIndex = this.paginationService.getCpeInitialIndex();
      this.pageSize = this.paginationService.getCpePageSize();
      this.initialIndex * this.pageSize < this.cpeData.length ? this.pageIndex = this.initialIndex : this.pageIndex = 0;
      this.updatePagedData(this.pageIndex);
      this.isLoading = false;
    });
    this.vulnService.portNumber$.subscribe((portNumber:number)=>{
       this.portNumber = portNumber;
    });
    this.searchVariant = this.vulnService.getSearchVariant();
  }
  ngAfterViewInit(): void {
       this.vulnService.navBarHeight$.subscribe((height: number) => {
       this.renderer.setStyle(this.cpeList.nativeElement, 'min-height', `${window.innerHeight - height}px`);
      }) 
      // this.renderer.setStyle(this.cpeList.nativeElement, 'min-height', `${window.innerHeight}px`);
      this.renderer.setStyle(this.cpeList.nativeElement, 'max-height', "fit-content");
      if(this.cpeData.length === 0) {
          this.vulnService.navBarHeight$.subscribe((height: number) => {
          this.renderer.setStyle(this.noCpeData.nativeElement, 'height', `${window.innerHeight - height - 100}px`);
      }) 
      }
      const selectedDepIndex = sessionStorage.getItem('selectedCpeIndex');
      if (selectedDepIndex) {
      const element = this.cpeRows.find(row => row.nativeElement.dataset.id === selectedDepIndex);
      if (element) {
        setTimeout(() => {
      const rows = this.table.nativeElement.querySelectorAll('tr');
      if (rows[+selectedDepIndex]) {
        rows[+selectedDepIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      }, 100);
      const anchor = element.nativeElement.querySelector('a');
      if (anchor) {
      this.renderer.addClass(anchor, 'highlight-row');
      }
    }
      sessionStorage.removeItem('selectedCpeIndex');
  }
}
  ngAfterViewChecked(): void {
    if(this.cpeData.length === 0) {
        this.vulnService.navBarHeight$.subscribe((height: number) => {
        this.renderer.setStyle(this.noCpeData.nativeElement, 'margin-top', `${height}px`);  
      }) 
    }
  }
  searchCpeName(cpeName: string, index: number) {
    this.vulnService.setLoading(true);
    console.log(cpeName, this.isLoading);
    this.http.get<any>(`${environment.baseLocaUrl}${this.portNumber}${environment.searchByCpeName}${cpeName}`).subscribe({
       next:(response)=> {
        this.vulnService.setDarkMode(this.darkMode);
        this.vulnService.setVulnerabilityData(response);
        this.vulnService.setTempVulnerability(false);
        this.router.navigate([AppRoutes.VULNERABILITY_LIST]);
        this.vulnService.setLoading(false);
       },error: (error) => {
        this.snackBar.open('Unexpected Error Occured', 'Dismiss', { duration: 5000, 
        panelClass: ['snackbar-error'] });
        this.vulnService.setLoading(false);
        console.error("Error fetching data:", error);
       }    
    
  });
  sessionStorage.setItem('selectedCpeIndex', index.toString());
}
searchCPEs(event: Event) {
const inputValue = (event.target as HTMLInputElement).value.toLowerCase();
    console.log(inputValue);
    this.searchTerm = inputValue;
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
    this.paginationService.setCpeInitialIndex(this.pageIndex);
    this.start = this.pageIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pagedCpeData = this.cpeData.slice(this.start, this.end);
    }
   }
previousPage(): void {
    if(this.pageIndex > 0) {
      this.pageIndex--;
      this.paginationService.setCpeInitialIndex(this.pageIndex);
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
   this.pageIndex = 0;
   this.paginationService.setCpeInitialIndex(this.pageIndex);
   this.paginationService.setCpePageSize(this.pageSize);
   this.updatePagedData(this.pageIndex);
   }

   goBack() {
    this.location.back()
   }
}
