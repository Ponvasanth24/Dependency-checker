import { Component } from '@angular/core';
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
import { DashboardComponent } from '../dashboard.component';

@Component({
  selector: 'app-search-component',
  imports: [CommonModule, FormsModule, MatSelectModule],
  templateUrl: './search-component.component.html',
  styleUrl: './search-component.component.css'
})
export class SearchComponentComponent {
  searchType: number = 1;
  searchField: number = 0;
  searchValue: string = '';
  searchUrl: string = '';
  darkMode: boolean = false;
  dependencies = [];
  portNumber:number = 8080;
  navigationUrl: string = '';
  isLoading:boolean = false;
  searchVariant: boolean = false;
  private cancelRequest$ = new Subject<void>();
  searchTypes = [
    { id: 1, value: 'CVE Search' },
    { id: 2, value: 'CPE Search' },
  ];
  CVESearch = [ {id: 0, value: 'Select Variant'},{id: 1, value: 'Keyword'}, {id:2, value: 'CVE Id'}, {id:3, value:'CPE Name'}];
  CPESearch = [ {id: 0, value: 'Select Variant'}, {id: 1, value: 'Keyword'}, {id:2, value: 'Likely CPE Name'}];
  
  cpeRegex = /^cpe:\d+\.\d+:[aho]:([^:]+):([^:]+):([0-9]+\.[0-9]+(?:\.[0-9]+)(?:[-_a-zA-Z0-9.]+)?):([^:]):([^:]):([^:]):([^:]):([^:]):([^:]):([^:])$/;
  likelyCpeRegex = /^cpe:\d+\.\d+:[aho\*]:[^:]+:[^:]+:[^:]+(?::[^:]*){0,7}$/;
  cveRegex = /^CVE-\d{4}-\d{4,}$/;
  constructor(private paginationService: CVSSPaginationService, private http: HttpClient, private vulnService: VulnerabilityService,
    private router: Router, private dashboard: DashboardComponent
  ) {}

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
            this.dashboard.showError('Please enter a valid keyword');
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

            this.dashboard.showError('Please enter a valid CVE ID');
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
            this.dashboard.showError('Please enter a valid CPE Name');
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
            this.dashboard.showError('Please enter a valid Keyword');
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
            this.dashboard.showError('Please enter a valid CPE Name');
          }
          break;
          default:
          return;
      }
    } else {
            this.dashboard.showError('Please enter a value in this field.');
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
          this.dashboard.showFeedback(
            dataCount ? 'Success! The data has been fetched.' : 'No data found.'
          );
        },
        error: (error) => {
          console.log(error);
          this.dashboard.showError("An error occurred while searching for vulnerabilities");
        }
      });
  }

  cancelSearch(): void {
    this.cancelRequest$.next();
    this.isLoading = false;
    this.dashboard.showFeedback('Search request cancelled.');
    console.log('Cancellation signal sent.');
  }
}
