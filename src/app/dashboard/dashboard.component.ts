import {
  Component,
  OnInit,
  OnDestroy,
  NgZone,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewInit,
  AfterViewChecked,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VulnerabilityService } from '../../shared/VulnerabilityService';
import { VulnerabilitylistComponent } from '../vulnerabilitylist/vulnerabilitylist.component';
import { DependenciesComponent } from '../dependencies/dependencies.component';
import { RouterOutlet } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, takeUntil, switchMap, tap, catchError, debounceTime } from 'rxjs/operators';
import { Renderer2 } from '@angular/core';
import { CVSSPaginationService } from '../../shared/CVSSPaginationService';
import { Subject, Subscription } from 'rxjs';
import { AppRoutes } from '../../shared/AppRoutes';
import { Observable, of } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FlexLayoutModule } from '@angular/flex-layout';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatIconModule,
    CommonModule,
    FormsModule,
    VulnerabilitylistComponent,
    DependenciesComponent,
    RouterOutlet,
    MatFormFieldModule,
    MatSelectModule,
    MatRadioModule, RouterModule ,MatInputModule, MatToolbarModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatSidenavModule,
    FlexLayoutModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css', './dashboard.component.scss'],
})
export class DashboardComponent implements OnDestroy, OnInit, AfterViewInit {
  isLoading = true;
  isAnimate = false;
  searchVariant: boolean = false;
  darkMode: boolean = false;
  portNumberSetStatus:boolean = false;

  vulnerabilityData: any = [];
  searchType: number = 1;
  searchField: number = 0;
  searchValue: string = '';
  searchUrl: string = '';
  
  progress: number = 0;
  animationStyle: string = 'none';
  fetchedDependencies: number = 0;
  totalDependencies: number = 0;
  portNumber: number = 8080;
  navigationUrl: string = '';
  private progressInterval: any = null;
  private cancelRequest$ = new Subject<void>();
  private destroy$ = new Subject<void>();
  searchQuery: string = '';
  searchResults: any[] = [];
private searchTerms = new Subject<string>();
  regex = /^cpe:\d+\.\d+:[aho\*]:[^:]+:[^:]+:[^:]+(:\*){7}$/;
  likelyCpeRegex = /^cpe:\d+\.\d+:[aho\*]:[^:]+:[^:]+:[^:]+(?::[^:]*){0,7}$/;
  cveRegex = /^CVE-\d{4}-\d{4,}$/;
  searchTypes = [
    { id: 1, value: 'CVE Search' },
    { id: 2, value: 'CPE Search' },
  ];
  @ViewChild(RouterOutlet) outlet: RouterOutlet | undefined;
  @ViewChild('getPortNumber', { static: false }) portNumberModal!: ElementRef;
  @ViewChild('getPortNumberSearch', { static: false }) getPortNumberSearch!: ElementRef;
  @ViewChild('alertModal', { static: false }) alertModal!: ElementRef;
  @ViewChild('navBar') navBar!: ElementRef;
  @ViewChild('dashBoard') dashBoard!: ElementRef;
  @ViewChild('navBarParent') navBarParent: ElementRef | undefined;
  constructor(
    private http: HttpClient,
    private router: Router,
    private vulnService: VulnerabilityService,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private renderer: Renderer2, private paginationService: CVSSPaginationService
  ) {}

  ngOnInit(): void {
    this.vulnService.darkMode$.subscribe((mode: boolean) => {
      this.darkMode = mode;
    });
    this.vulnService.isLoading$.subscribe((loading: boolean) => {
      this.isLoading = loading;
    });
    this.vulnService.isAnimate$.subscribe((animate: boolean) => {
      this.isAnimate = animate;
    });
    this.vulnService.portNumberSet$.subscribe((status:boolean)=>{
      this.portNumberSetStatus = status;
    });
    this.vulnService.portNumber$.subscribe((port:number)=>{
      this.portNumber = port;
    });
    sessionStorage.removeItem('selectedCpeIndex');
    sessionStorage.removeItem('selectedDependencyIndex');
  }

  ngAfterViewInit(): void {
    this.renderer.setStyle(this.dashBoard.nativeElement, 'min-height', `${window.innerHeight}px`);
    this.renderer.setStyle(this.dashBoard.nativeElement, 'max-height', "fit-content");
    const navBarHeight = this.navBar.nativeElement.offsetHeight;
    this.vulnService.setNavBarHeight(navBarHeight);
    const bootstrap = (window as any).bootstrap;
    if (bootstrap && bootstrap.Modal && !this.portNumberSetStatus) {
      this.ngZone.run(()=>{
      setTimeout(()=> {
      const scanModal = new bootstrap.Modal(
      this.getPortNumberSearch.nativeElement
      );
      scanModal.show();
      }, 50);
      });}
  }

  ngOnDestroy(): void {
    clearInterval(this.progressInterval);
    this.eventSource?.close();
    this.cancelRequest$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }
  setPortNumber(){
    this.vulnService.setPortNumber(this.portNumber);
    this.vulnService.setPortNumberStatus(true);
  }
fetchData(term: string): Observable<any[]> { 
    const url = `${this.searchUrl}${term}`;
    console.log('Fetching data for term:', term);
    return this.http.get<any[]>(url);
  }
  onSearchChange(term: string): void {
  this.searchTerms.next(term);
}
  setSearchUrl() {
    this.dependencies = [];

    if (this.searchValue.trim() !== '' && this.searchField !== 0) {
      switch (this.searchField) {
        case 1:
          if (this.searchValue.length > 0) {
            this.searchUrl = `${environment.baseLocaUrl}${this.portNumber}${environment.searchByKeyWordUrl}`;
            this.navigationUrl = AppRoutes.VULNERABILITY_LIST;
            this.paginationService.setVulInitialIndex(0);
            this.paginationService.setVulPageSize(5);
            this.searchVulnerabilities();
          } else {
            this.showError('Please enter a valid keyword');
          }
          break;
        case 2:
          if (this.searchValue.startsWith('CVE-') && this.cveRegex.test(this.searchValue)) {
            this.searchUrl = `${environment.baseLocaUrl}${this.portNumber}${environment.searchByCveid}`;
            this.navigationUrl = AppRoutes.VULNERABILITY_LIST;
            this.paginationService.setVulInitialIndex(0);
            this.paginationService.setVulPageSize(5);
            this.searchVulnerabilities();
          } else {

            this.showError('Please enter a valid CVE ID');
          }
          break;
        case 3:
          if (this.regex.test(this.searchValue)) {
            this.searchUrl = `${environment.baseLocaUrl}${this.portNumber}${environment.searchByCpeName}`;
            this.navigationUrl = AppRoutes.VULNERABILITY_LIST;
            this.paginationService.setVulInitialIndex(0);
            this.paginationService.setVulPageSize(5);
            this.searchVulnerabilities();
          } else {
            this.showError('Please enter a valid CPE Name');
          }
          break;
        case 4:
          if (this.searchValue.length > 0) {
            this.searchUrl = `${environment.baseLocaUrl}${this.portNumber}${environment.searchLikelyKeyword}`;
            this.navigationUrl = AppRoutes.CPE_SEARCH;
            this.paginationService.setCpeInitialIndex(0);
            this.paginationService.setCpePageSize(10);
            this.searchVulnerabilities();
          } else {
            this.showError('Please enter a valid Keyword');
          }
          break;
        case 5:
          if (this.likelyCpeRegex.test(this.searchValue)) {
            this.searchUrl = `${environment.baseLocaUrl}${this.portNumber}${environment.searchLikelyCpe}`;
            this.navigationUrl = AppRoutes.CPE_SEARCH;
            this.paginationService.setCpeInitialIndex(0);
            this.paginationService.setCpePageSize(10);
            this.searchVulnerabilities();
          } else {
            this.showError('Please enter a valid CPE Name');
          }
          break;
          default:
          return;
      }
    } else {
            this.showError('Please enter a value in this field.');
    }
  }

  searchVulnerabilities(): void {
  this.cancelSearch();
  this.isLoading = true;
  this.http.get<any[]>(`${this.searchUrl}${this.searchValue}`)
    .pipe(takeUntil(this.cancelRequest$),
    finalize(() => this.vulnService.setLoading(false)))
    .subscribe({
      next: (response) => {
        this.searchVariant = true;
        this.vulnService.setSearchVariant(this.searchVariant);
        this.vulnService.setDarkMode(this.darkMode);
        let dataCount = response.length;
        if (this.searchField === 4 || this.searchField === 5) {
          this.vulnService.setCpeData(response);
          this.router.navigate([this.navigationUrl]);
        } else {
          this.vulnService.setVulnerabilityData(response);
          this.router.navigate([this.navigationUrl]);
        }
        this.showFeedback(
          dataCount ? 'Success! The data has been fetched.' : 'No data found.'
        );
      },
      error: (error) => {
        console.log(error);
        this.showError("An error occurred while searching for vulnerabilities");
      }
    });
}

private showError(message: string): void {
  this.snackBar.open(message, 'Dismiss', {
    duration: 5000
  });
}

private showFeedback(message: string): void {
  this.snackBar.open(message, 'Dismiss', {
    duration: 5000
  });
}


  getFirstMetricKey(metrics: any): string {
    return Object.keys(metrics)[0];
  }

  getCvssVersion(vulnerability: any): string {
    const key = this.getFirstMetricKey(vulnerability.cve.metrics);
    const metricArray = vulnerability.cve.metrics[key];
    return metricArray && metricArray.length > 0
      ? metricArray[0].cvssData?.version || 'N/A'
      : 'N/A';
  }

  getSeverity(vulnerability: any): string {
    return vulnerability.baseSeverity;
  }

  messages: any = [];
  eventSource: EventSource | null = null;
  isScanning = false;
  dependencies = [];

  startScan(): void {
    this.messages = [];
    this.isScanning = true;
    this.isAnimate = true;
    this.progressInterval = setInterval(()=>{
      if(this.progress < 100) this.progress++;
      else {
        this.isAnimate = false;
        clearInterval(this.progressInterval);
        this.eventSource?.close();
        this.showError("Unexpected error occured");
      }
    }, 1300);
    try {
      const url = `${environment.baseLocaUrl}${this.portNumber.toString()}${environment.fetchVulnerability}`;
      if (!url || !this.portNumber) {
        throw new Error('Invalid URL or port number.');
      }
      this.eventSource = new EventSource(url);
      this.eventSource.onmessage = (event) => {
        try {
          this.ngZone.run(() => {
            let data = {};
            if (event.data !== 'Analysis completed') {
              data = JSON.parse(event.data);
            }
            this.fetchedDependencies = (data as any)?.fetchedDependencies || 0;
            this.totalDependencies = (data as any)?.totalDependencies || 0;
            this.updateProgress(
              this.fetchedDependencies,
              this.totalDependencies
            );
          });

          if (event.data === 'Analysis completed') {
            console.log('completed');
            this.isAnimate = false;
            this.eventSource?.close();
            clearInterval(this.progressInterval);
            this.fetchFinalResults();
          }
        } catch (error) {
          console.error('Error while processing message:', error);
          this.showError('Unexpected error occured.');
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        this.showError(`Please check if the server is running on port ${this.portNumber}`);
        this.isAnimate = false;
        this.progress = 0;
        clearInterval(this.progressInterval);
        this.eventSource?.close();
        this.cd.detectChanges();
      };
      this.eventSource.onopen = () => {
        this.messages.push('Connection established');
      };
    } catch (error: any) {
      console.error('Error:', error);
      this.vulnService.setAnimate(false);
      this.progress = 0;
      clearInterval(this.progressInterval);
      this.showError(`Error occurred: ${error.message || 'Please check if the server is running.'}`);
      if (this.eventSource) {
        this.eventSource?.close();
      }
      this.cd.detectChanges();
    }
  }
  stopSSE() {
    this.isAnimate = false;
    this.fetchedDependencies = 0;
    this.totalDependencies = 0;
    this.progress = 0;
    clearInterval(this.progressInterval);
    this.eventSource?.close();
  }

  fetchFinalResults() {
    fetch(
      `${environment.baseLocaUrl}${this.portNumber.toString()}${environment.getVulnerabilities}`
    )
      .then((response) => {
        if (!response.ok) {
          console.log(response);
          throw new Error('Failed to fetch final results');
        }
        return response.json();
      })
      .then((data) => {
        this.isAnimate = false;
        let dataCount =data.length;
        if(dataCount) {
          this.showFeedback('Success! The data has been fetched.');
        } else {
          this.showError('No data found.');
        }
        this.paginationService.setDepInitialIndex(0);
        this.paginationService.setCpePageSize(5);
        this.vulnService.setDependencies(data);
        sessionStorage.setItem('dependencies', JSON.stringify(data));
        console.log(this.navBarParent)
        this.navBarParent?.nativeElement.classList.remove('sticky-top');
        this.router.navigate([AppRoutes.DEPENDENCIES]);
        console.log('Final vulnerability data:', data);
        this.cd.detectChanges();
      })
      .catch((error) => {
        console.error('Error fetching final results:', error);
        this.showError('Error fetching final results:');
      });
  }

updateProgress(fetched: number, total: number) {
  const targetProgress = total > 0 ? Math.round((fetched / total) * 100) : 0;
  if (this.progressInterval) {
    clearInterval(this.progressInterval);
    this.progressInterval = null;
  }
  this.progress = targetProgress;
  this.progressInterval = setInterval(() => {
    if (this.progress < 100) {
      this.progress++;
    } else {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }, 2100);
}

  changeTheme(event: any): void {
    this.vulnService.setDarkMode(event.target.checked);
  }
  openScanModal() {
    let dependencies: any[] = [];
    const bootstrap = (window as any).bootstrap;
    const dep = sessionStorage.getItem('dependencies');
    dependencies = dep ? JSON.parse(dep) : [];
    if (dependencies.length > 0) {
      if (bootstrap && bootstrap.Modal) {
        this.ngZone.run(()=> {
        setTimeout(()=>{
        const scanModal = new bootstrap.Modal(this.alertModal.nativeElement);
        scanModal.show();
        }, 50);  
        })
      } else {
        console.error(
          'Bootstrap Modal is not available. Make sure Bootstrap is loaded.'
        );
        this.snackBar.open('Bootstrap Modal is not available. Make sure Bootstrap is loaded.', 'Dismiss', { duration: 5000, 
        panelClass: ['snackbar-error'] });
      }
    } else {
      if (bootstrap && bootstrap.Modal) {
        this.ngZone.run(()=> {
        setTimeout(()=>{
        const scanModal = new bootstrap.Modal(
        this.portNumberModal.nativeElement
        );
        scanModal.show();
        }, 50);
        })
      } else {
        console.error(
          'Bootstrap Modal is not available. Make sure Bootstrap is loaded.'
        );
        this.snackBar.open('Bootstrap Modal is not available. Make sure Bootstrap is loaded.', 'Dismiss', { duration: 5000, 
        panelClass: ['snackbar-error'] });
      }
    }
  }
  openNewScan() {
    console.log('portNumberModal:', this.portNumberModal);
    let element = this.portNumberModal.nativeElement;
    const bootstrap = (window as any).bootstrap;
    const existingModal = bootstrap.Modal.getInstance(element);
    console.log(existingModal)
    console.log(this.portNumberModal.nativeElement)
    if (existingModal) {
    existingModal.dispose();
    }
    if (bootstrap && bootstrap.Modal) {
      this.ngZone.run(()=>{
      setTimeout(()=> {
      const scanModal = new bootstrap.Modal(
      this.portNumberModal.nativeElement
      );
      scanModal.show();
      }, 50);
      });
    } else {
      console.error(
        'Bootstrap Modal is not available. Make sure Bootstrap JS is loaded.'
      );
      this.snackBar.open('Bootstrap Modal is not available. Make sure Bootstrap is loaded.', 'Dismiss', { duration: 5000, 
        panelClass: ['snackbar-error'] });
    }
  }
  viewScannedDependencies() {
      console.log(this.navBarParent)
        this.navBarParent?.nativeElement.classList.remove('sticky-top');
    this.router.navigate(['/dependencies']);
  }
  onFocus(event: Event) {
  if (this.searchField === 2 && event.type === 'focus') {
    this.searchValue = 'CVE-';
  }
  else {
     this.searchValue = this.searchValue === 'CVE-' ? '' : this.searchValue; 
  }
}

onKeyDown(event: KeyboardEvent) {
  const cursorPos = (event.target as HTMLInputElement).selectionStart;
  if (
    cursorPos !== null &&
    cursorPos <= 4 &&
    (event.key === 'Backspace' || event.key === 'Delete') && this.searchField === 2
  ) {
    event.preventDefault();
  }
}

onInputChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!this.searchValue.startsWith('CVE-') && this.searchField === 2) {
    input.value = 'CVE-';
    const afterPrefix = input.value.slice(4).replace(/[^\d-]/g, '');
    this.searchValue = 'CVE-' + afterPrefix;
  }
}
cancelSearch(): void {
    this.cancelRequest$.next();
    this.isLoading = false;
    this.showFeedback('Search request cancelled.');
    console.log('Cancellation signal sent.');
  }
}
