import { Component, OnInit } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environments';
import { AppRoutes } from '../../../shared/AppRoutes';
import { CVSSPaginationService } from '../../../shared/CVSSPaginationService';
import { HttpClient } from '@angular/common/http';
import { finalize, Subject, takeUntil } from 'rxjs';
import { VulnerabilityService } from '../../../shared/VulnerabilityService';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-search-component',
  imports: [CommonModule, FormsModule, MatSelectModule],
  templateUrl: './search-component.component.html',
  styleUrl: './search-component.component.css'
})
export class SearchComponentComponent implements OnInit {
  searchType: number = 1;
  searchField: number = 0;
  searchValue: string = '';
  searchUrl: string = '';
  darkMode: boolean = false;
  dependencies = [];
  portNumber:number = 8080;
  navigationUrl: string = '';
  isLoading: boolean = false;
  searchVariant: boolean = false;
  private cancelRequest$ = new Subject<void>();
  searchTypes = [
    { id: 1, value: 'CVE Search' },
    { id: 2, value: 'CPE Search' },
  ];
  CVESearch = [ {id: 0, value: 'Select Variant'},{id: 1, value: 'Keyword'}, {id:2, value: 'CVE Id'}, {id:3, value:'CPE Name'}];
  CPESearch = [ {id: 0, value: 'Select Variant'}, {id: 4, value: 'Keyword'}, {id:5, value: 'Likely CPE Name'}];
  
  cpeRegex = /^cpe:\d+\.\d+:[aho]:([^:]+):([^:]+):([0-9]+\.[0-9]+(?:\.[0-9]+)(?:[-_a-zA-Z0-9.]+)?):([^:]):([^:]):([^:]):([^:]):([^:]):([^:]):([^:])$/;
  likelyCpeRegex = /^cpe:\d+\.\d+:[aho\*]:[^:]+:[^:]+:[^:]+(?::[^:]*){0,7}$/;
  cveRegex = /^CVE-\d{4}-\d{4,}$/;
  constructor(private paginationService: CVSSPaginationService, private http: HttpClient, private vulnService: VulnerabilityService,
    private router: Router, private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.vulnService.darkMode$.subscribe((mode: boolean) => {
      this.darkMode = mode;
    });
     this.vulnService.portNumber$.subscribe((port:number)=>{
      this.portNumber = port;
    });
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

setSearchUrl() {
  console.log(this.searchField, this.searchType)
    this.dependencies = [];

    if (this.searchValue.trim() !== '' && this.searchField !== 0) {
      switch (Number(this.searchField)) {
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
          if (this.cpeRegex.test(this.searchValue)) {
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
    this.vulnService.setLoading(true);
    this.http.get<any[]>(`${this.searchUrl}${this.searchValue}`)
      .pipe(takeUntil(this.cancelRequest$),
      finalize(() => this.vulnService.setLoading(false)))
      .subscribe({
        next: (response) => {
          console.log(response)
          this.searchVariant = true;
          this.vulnService.setSearchVariant(this.searchVariant);
          this.vulnService.setDarkMode(this.darkMode);
          let dataCount = response.length;
          if (Number(this.searchField) === 4 || Number(this.searchField) === 5) {
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

  cancelSearch(): void {
    this.cancelRequest$.next();
    this.vulnService.setLoading(true);
    this.showFeedback('Search request cancelled.');
    console.log('Cancellation signal sent.');
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
}
