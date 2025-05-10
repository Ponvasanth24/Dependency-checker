import { AfterViewInit, Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
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

@Component({
  selector: 'app-dashboard',
  standalone:true,
  imports: [MatIconModule, CommonModule, FormsModule, VulnerabilitylistComponent, DependenciesComponent, RouterOutlet],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css', './dashboard.component.scss']
})
export class DashboardComponent implements OnDestroy, AfterViewInit {  
  isLoading = true;
  isAnimate = false;
  shouldAnimate = false;
  vulnerabilityData:any = [];
  searchType: number = 0;
  searchValue: string = "";
  searchUrl: string = "";
  searchVariant:boolean = false;
  lightMode:boolean = false;
  progress:number = 0;
  animationStyle:string = "none";
  fetchedDependencies:number = 0;
  totalDependencies:number = 0;
  @ViewChild(RouterOutlet) outlet: RouterOutlet | undefined;
  @ViewChild('loaderRef', {static:false}) loaderRef!:ElementRef;
constructor(private http: HttpClient, private router: Router, private vulnService: VulnerabilityService, private ngZone:NgZone, private cd: ChangeDetectorRef,
  private location: Location
){
  this.vulnService.getLightMode().subscribe((mode => {
    this.lightMode = mode;
  }))
  this.isLoading = false;
  if(vulnService.hasData()){
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

searchVulnerabilities() {
  this.isAnimate = true;
  this.dependencies = []; 
   if(this.searchValue !== "" && this.searchType !== 0){
      switch(this.searchType) {
           case 1: 
              this.searchUrl = environment.searchByKeyWordUrl;
              break;
           case 2:
              this.searchUrl = environment.searchByCveid;
              break;
           case 3:
              this.searchUrl = environment.searchByCpeName;
              break;      
           default:
              return;    
      }  
   }
   
   this.http.get<any>(this.searchUrl.concat(this.searchValue)).subscribe({
       next:(response)=> {
        console.log(response)
        this.vulnerabilityData = response;
        this.searchVariant = true;
        this.vulnService.setSearchVariant(this.searchVariant);
        this.vulnService.setLightMode(this.lightMode);
        this.router.navigate(['/vulnerabilityList'], {
          state:{searchVariant: this.searchVariant}
        });
        this.isAnimate = false;
        this.vulnService.setVulnerabilityData(this.vulnerabilityData);
       },
       error:(error)=> {
          console.log(this.searchUrl)
          console.log(error)  
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
  // this.isLoading = true;
  // this.eventSource = new EventSource('http://localhost:8080/cvss/getVulnerabilities');
  const dependencies = localStorage.getItem("dependencies");
  if (dependencies) {
    console.log(JSON.parse(dependencies));
    this.dependencies = JSON.parse(dependencies);
    this.vulnService.setLightMode(this.lightMode);
  } else {
    console.log("No dependencies found in localStorage.");
  }
  this.router.navigate(['/dependencies']);
  this.vulnService.setDependencies(this.dependencies);
  // this.eventSource.onmessage = (event) => {
  //   console.log(event.data)
  //   this.ngZone.run(() => {
  //     let data = {};
  //     if(event.data !== 'Analysis completed'){
  //       data = JSON.parse(event.data);
  //     }
  //     this.fetchedDependencies = (data as any)?.fetchedDependencies || 0;
  //     this.totalDependencies = (data as any)?.totalDependencies || 0;
  //     this.updateProgress(this.fetchedDependencies, this.totalDependencies);
  //   });

  //   if (event.data === 'Analysis completed') {
  //     console.log("completed")
  //     this.isLoading = false;
  //     this.eventSource?.close(); // Stop listening to SSE
  //     this.fetchFinalResults(); 
  //   }
  // };

  // this.eventSource.onerror = (error) => {
  //   console.error('SSE error:', error);
  //   this.isScanning = false;
  //   this.eventSource?.close();
  // };

  // this.eventSource.onopen = () => {
  //   this.messages.push();
  // };
}

ngOnDestroy(): void {
  this.eventSource?.close();
}

fetchFinalResults() {
  fetch('http://localhost:8080/cvss/vulnerabilities')
    .then(response => {
      if (!response.ok) {
        console.log(response)
        throw new Error('Failed to fetch final results');
      }
      return response.json();
    })
    .then(data => {
      this.isLoading = false;
      this.dependencies = data;
      // localStorage.setItem("dependencies",JSON.stringify(data))
      console.log('Final vulnerability data:', data);
      // this.cd.detectChanges();
    })
    .catch(error => {
      console.error('Error fetching final results:', error);
    });
}

updateProgress(fetched: number, total: number) {
  this.progress = total > 0 ? Math.round((fetched / total) * 100) : 0;
}
ngAfterViewInit(): void {
  // this.vulnService.lightMode$.subscribe(mode => {
  //   const currentComponent = this.outlet!.component;
  //   if (currentComponent && 'onLightModeChange' in currentComponent) {
  //     (currentComponent as { onLightModeChange: (mode: boolean) => void }).onLightModeChange(mode);
  //   }
  // });
}
changeTheme(event:any): void {
  this.vulnService.setLightMode(event.target.checked);
}
}
