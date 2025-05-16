import { AfterViewInit, Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VulnerabilityService } from '../../shared/VulnerabilityService';
import { VulnerabilitylistComponent } from '../vulnerabilitylist/vulnerabilitylist.component';
import { DependenciesComponent } from '../dependencies/dependencies.component';
import { RouterOutlet } from '@angular/router';
import { Location } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {MatRadioModule} from '@angular/material/radio';

@Component({
  selector: 'app-dashboard',
  standalone:true,
  imports: [MatIconModule, CommonModule, FormsModule, VulnerabilitylistComponent, DependenciesComponent, RouterOutlet,
    MatFormFieldModule, MatSelectModule, MatRadioModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css', './dashboard.component.scss']
})
export class DashboardComponent implements OnDestroy, AfterViewInit, OnInit {  
  isLoading = true;
  isAnimate = false;
  shouldAnimate = false;
  vulnerabilityData:any = [];
  searchType: number = 1;
  searchField: number = 0;
  searchValue: string = "";
  searchUrl: string = "";
  searchVariant:boolean = false;
  darkMode:boolean = false;
  progress:number = 0;
  animationStyle:string = "none";
  fetchedDependencies:number = 0;
  totalDependencies:number = 0;
  portNumber:number = 8080;
  navigationUrl:string = "/vulnerabilityList";
  regex = /^cpe:\d+\.\d+:[aho]:[^:]+:[^:]+:[^:]+(:\*){7}$/;
  searchTypes = [{id: 1, value: 'CVE Search'}, {id: 2, value: 'CPE Search'}];
  @ViewChild(RouterOutlet) outlet: RouterOutlet | undefined;
constructor(private http: HttpClient, private router: Router, private vulnService: VulnerabilityService, private ngZone:NgZone, private cd: ChangeDetectorRef,
  private location: Location
){
  this.vulnService.getDarkMode().subscribe((mode => {
    this.darkMode = mode;
  }))
  this.isLoading = false;
  if(vulnService.hasData()) {
    this.searchVariant = vulnService.getSearchVariant();
    this.vulnerabilityData = vulnService.getVulnerabilities();
    this.isLoading = false;
  }else{
    // this.http.get<any>(environment.getVulnerability).subscribe({
    //   next: (response) => {
    //     console.log(response.vulnerabilities)
    //     this.searchVariant = vulnService.getSearchVariant();
    //     this.vulnerabilityData = response;
    //     this.isLoading = false;
    //     vulnService.setVulnerabilities(this.vulnerabilityData);
    //   },
    //   error: (err) => {
    //     console.error(err);
    //   }
    // }); 
  }
}

  ngOnInit(): void {
    this.vulnService.darkMode$.subscribe((mode: boolean) => {
      this.darkMode = mode;
    });
    this.vulnService.isLoading$.subscribe((loading: boolean) => {
      this.isLoading = loading;
    })
  }

setSearchUrl() {
  this.dependencies = []; 
   if(this.searchValue !== "" && this.searchField !== 0){
      switch(this.searchField) {
           case 1: 
              if(this.searchValue.length > 0){
                this.searchUrl = environment.searchByKeyWordUrl;
                this.navigationUrl = "/vulnerabilityList";
                this.searchVulnerabilities();
              }
              else {
                window.alert("Please enter a valid keyword");
              }
              this.searchUrl = environment.searchByKeyWordUrl;
              this.searchVulnerabilities();
              break;
           case 2:
              if(this.searchValue.startsWith('CVE-')){
                this.searchUrl = environment.searchByCveid;
                this.searchVulnerabilities();
              }
              else {
                window.alert("Please enter a valid CVE ID");
              }
              break;
          case 3:
              if(this.regex.test(this.searchValue)){
                this.searchUrl = environment.searchByCpeName;
                this.searchVulnerabilities();
              }
              else {
                window.alert("Please enter a valid CPE Name");
              }
              break; 
          case 4:
              if(this.searchValue.length > 0) {
                this.searchUrl = environment.searchLikelyKeyword;
                this.navigationUrl = "/cpeSearchResults";
                this.searchVulnerabilities();
              }
              else {
                window.alert("Please enter a valid Keyword");
              }
              break;     
           case 5:
              if(this.regex.test(this.searchValue)){
                this.searchUrl = environment.searchLikelyCpe;
                this.navigationUrl = "/cpeSearchResults";
                this.searchVulnerabilities();
              }
              else {
                window.alert("Please enter a valid CPE Name");
              }
              break;         
           default:
              return;    
      }  
   } 
  }

searchVulnerabilities() {
 this.isLoading = true;
 this.http.get<any>(this.searchUrl.concat(this.searchValue)).subscribe({
       next:(response)=> {
        console.log(response, this.searchField)
        this.vulnerabilityData = response;
        this.searchVariant = true;
        this.vulnService.setSearchVariant(this.searchVariant);
        this.vulnService.setDarkMode(this.darkMode);
        if(this.searchField === 5 || this.searchField === 4) {
          this.vulnService.setCpeData(this.vulnerabilityData);
          this.isLoading = false;
          this.router.navigate([this.navigationUrl]);
        } else {
          this.vulnService.setVulnerabilityData(this.vulnerabilityData);
          this.isLoading = false;
          this.router.navigate(['/vulnerabilityList']);
        }
       },
       error:(error)=> {
          console.log(this.searchUrl);
          console.log(error);  
          window.alert("Unexpected error occured");
          this.isLoading = false;
       }
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

getSeverity(vulnerability:any): string {
  // let severityKey = Object.keys(vulnerability.cve.metrics)[0];
  // return vulnerability.cve.metrics[severityKey][0].cvssData.baseSeverity;
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

  try {
    const url = environment.baseLocaUrl
      .concat(this.portNumber.toString())
      .concat(environment.fetchVulnerability);
    if (!url || !this.portNumber) {
      throw new Error('Invalid URL or port number.');
    }
    console.log(window.location.host)
    this.eventSource = new EventSource(url);
    this.eventSource.onmessage = (event) => {
      try {
        console.log(event.data);
        this.ngZone.run(() => {
          let data = {};
          if (event.data !== 'Analysis completed') {
            data = JSON.parse(event.data);
          }
          this.fetchedDependencies = (data as any)?.fetchedDependencies || 0;
          this.totalDependencies = (data as any)?.totalDependencies || 0;
          this.updateProgress(this.fetchedDependencies, this.totalDependencies);
        });

        if (event.data === 'Analysis completed') {
          console.log("completed");
          this.isAnimate = false;
          this.eventSource?.close();
          this.fetchFinalResults();
        }

      } catch (messageError) {
        console.error('Error while processing message:', messageError);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.isScanning = false;
      window.alert(`Please check if the server is running on port ${this.portNumber}`);
      this.isAnimate = false;
      this.eventSource?.close();
      this.cd.detectChanges();
    };
    this.eventSource.onopen = () => {
      this.messages.push("Connection established");
    };

  } catch (error: any) {
    console.error('Error:', error);
    this.isScanning = false;
    this.isAnimate = false;
    window.alert(`Error occurred: ${error.message || 'Please check if the server is running.'}`);
    if (this.eventSource) {
      this.eventSource?.close();
    }
    this.cd.detectChanges();
  }
}


ngOnDestroy(): void {
  this.eventSource?.close();
}

fetchFinalResults() {
  fetch(environment.baseLocaUrl.concat(this.portNumber.toString()).concat(environment.getVulnerabilities))
    .then(response => {
      if (!response.ok) {
        console.log(response)
        throw new Error('Failed to fetch final results');
      }
      return response.json();
    })
    .then(data => {
      this.isAnimate = false;
      this.dependencies = data;
      this.isScanning = false;
      this.vulnService.setDependencies(this.dependencies);
      this.router.navigate(['/dependencies']);
      // localStorage.setItem("dependencies",JSON.stringify(data))
      console.log('Final vulnerability data:', data);
    })
    .catch(error => {
      console.error('Error fetching final results:', error);
    });
}

updateProgress(fetched: number, total: number) {
  this.progress = total > 0 ? Math.round((fetched / total) * 100) : 0;
}
ngAfterViewInit(): void {
  // this.vulnService.darkMode$.subscribe(mode => {
  //   const currentComponent = this.outlet!.component;
  //   if (currentComponent && 'ondarkModeChange' in currentComponent) {
  //     (currentComponent as { ondarkModeChange: (mode: boolean) => void }).ondarkModeChange(mode);
  //   }
  // });
}
changeTheme(event:any): void {
  this.vulnService.setDarkMode(event.target.checked);
}
}
