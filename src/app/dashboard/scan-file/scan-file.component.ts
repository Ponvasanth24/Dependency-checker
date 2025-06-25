import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VulnerabilityService } from '../../../shared/VulnerabilityService';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { environment } from '../../../environments/environments';
import { MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CVSSPaginationService } from '../../../shared/CVSSPaginationService';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRoutes } from '../../../shared/AppRoutes';
import { Renderer2 } from '@angular/core';

@Component({
  selector: 'app-scan-file',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatIcon, MatInputModule],
  templateUrl: './scan-file.component.html',
  styleUrls: ['./scan-file.component.css', './scan-file.component.scss']
})
export class ScanFileComponent implements OnInit, AfterViewInit{
  portNumber: number = 8080;
  selectedFile: File | null = null;
  formData:FormData = new FormData();
  scanUrl: string = '';
  messages: any[] = [];
  isScanning: boolean = false;
  darkMode:boolean = false;
  private progressInterval: any = null;
  isAnimate: boolean = false;
  animationStyle: string = 'none';
  progress: number = 0;
  eventSource: EventSource | null = null;
  fetchEventLogUrl: string = '';
  fetchedDependencies: number = 0;
  totalDependencies: number = 0;
  scanVariant:number = 0;
  fetchFinalResultUrl: string = '';
  dependencies: any[] = [];
  dialogRef: MatDialogRef<any> | undefined;
  @ViewChild('scanFile') scanFile!: ElementRef;
  @ViewChild('scanProject') scanProject!: ElementRef;
  constructor(private vulnService: VulnerabilityService, private cd: ChangeDetectorRef,
    private snackBar: MatSnackBar, private ngZone: NgZone, private paginationService: CVSSPaginationService,
    private router: Router, private route: ActivatedRoute, private renderer: Renderer2
  ) {}
      
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.scanVariant = Number(params.get('id'));
    });
    this.vulnService.darkMode$.subscribe((mode: boolean) => {
      this.darkMode = mode;
    });
    this.vulnService.portNumber$.subscribe((port:number)=>{
      this.portNumber = port;
    });
    const dep = sessionStorage.getItem('dependencies');
    this.dependencies = dep ? JSON.parse(dep) : [];
    this.vulnService.setIsStickyNavbar(false);
  }

  ngAfterViewInit(): void {
    this.renderer.setStyle(this.scanFile?.nativeElement, 'min-height', `${window.innerHeight}px`);
    this.renderer.setStyle(this.scanFile?.nativeElement, 'max-height', "fit-content");
    if(this.scanProject) {
    this.renderer.setStyle(this.scanProject?.nativeElement, 'min-height', `${window.innerHeight}px`);
    this.renderer.setStyle(this.scanProject?.nativeElement, 'max-height', "fit-content");
    }
  }

  removeFile(): void {
  this.selectedFile = null;
  this.formData = new FormData();
}

onFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const filename = file.name;
    console.log(filename)
    this.formData = new FormData();
    this.formData.append('file', file);
    if (filename === 'pom.xml') {
       this.formData.append('fileType', 'POM');
       console.log(this.formData.values())
    } else if (filename === 'package.json') {
       this.formData.append('fileType', 'PACKAGE_JSON');
    } else if (filename === 'package-lock.json') {
       this.formData.append('fileType', 'PACKAGE_LOCK_JSON');
    } else {
      alert('Unsupported file. Upload pom.xml, package.json, or package-lock.json');
    }
  }

  startScan(): void {
    console.log(this.portNumber)
    this.messages = [];
    this.isScanning = true;
    this.isAnimate = true;
    this.vulnService.setAnimate(true);
    this.progressInterval = setInterval(()=>{
      if(this.progress < 100) this.progress++;
      else {
        this.isAnimate = false;
        this.vulnService.setAnimate(false);
        clearInterval(this.progressInterval);
        this.eventSource?.close();
        this.showFeedback("Unexpected error occured");
      }
    }, 1300);

    try {

      // if (!this.scanUrl || !this.portNumber) {
      //   throw new Error('Invalid URL or port number.');
      // } 
     let hasFiles = false;

     for (const value of this.formData.values()) {
     if (value instanceof File && value.name) {
      hasFiles = true;
      break;
     }
     }
    if (hasFiles) {
     this.scanUrl = `${environment.baseLocaUrl}${this.portNumber.toString()}${environment.uploadFile}`; 
     this.fetchFinalResultUrl = `${environment.baseLocaUrl}${this.portNumber.toString()}${environment.getScanVulnerabilities}`;
     fetch(this.scanUrl, {
     method: 'POST',
     body: this.formData
    })
    .then(response => {
      console.log(response)
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    })
    .then((res) => {
       console.log(res)
       const jobId = res.jobId;
      //  this.formData = new FormData();
       this.fetchEventLogUrl = `${environment.baseLocaUrl}${this.portNumber}${environment.getFileUploadEventLog}${jobId}`
       this.fetchEventLog();
      })
    .catch(err => {
      this.isAnimate = false;
      this.vulnService.setAnimate(false);
      this.progress = 0;
      this.fetchedDependencies = 0;
      this.totalDependencies = 0;
      clearInterval(this.progressInterval);
      console.error('Upload or SSE setup failed:', err);
      this.showFeedback('Upload or SSE setup failed');
      return;
    });
}

     else {
       this.fetchEventLogUrl = `${environment.baseLocaUrl}${this.portNumber.toString()}${environment.fetchVulnerability}`;
       this.fetchFinalResultUrl = `${environment.baseLocaUrl}${this.portNumber.toString()}${environment.getVulnerabilities}`;
       this.fetchEventLog();
      }   
     
    } catch (error: any) {
      console.error('Error:', error);
      this.isAnimate = false;
      this.vulnService.setAnimate(false);
      this.progress = 0;
      clearInterval(this.progressInterval);
      this.showFeedback(`Error occurred: ${error.message || 'Please check if the server is running.'}`);
      if (this.eventSource) {
        this.eventSource?.close();
      }
      this.cd.detectChanges();
    }
  }
  
  fetchEventLog() {
       this.fetchedDependencies = 0;
       this.totalDependencies = 0;
       this.eventSource = new EventSource(this.fetchEventLogUrl);
       this.eventSource.onmessage = (event) => {
        try {
          this.ngZone.run(() => {
            let data = {};
            if (event.data !== 'Analysis Completed') {
              console.log(event.data)
              data = JSON.parse(event.data);
            }
            this.fetchedDependencies = (data as any)?.fetchedDependencies || 0;
            this.totalDependencies = (data as any)?.totalDependencies || 0;
            this.updateProgress(
              this.fetchedDependencies,
              this.totalDependencies
            );
          });

          if (event.data === 'Analysis Completed') {
            console.log('completed');
            this.isAnimate = false;
            this.vulnService.setAnimate(false);
            this.eventSource?.close();
            clearInterval(this.progressInterval);
            this.fetchFinalResult();
          }
        } catch (error) {
          console.error('Error while processing message:', error);
          this.showFeedback('Unexpected error occured.');
        }
      };
       this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        this.showFeedback('SSE error');
        this.isAnimate = false;
        this.vulnService.setAnimate(false);
        this.progress = 0;
        clearInterval(this.progressInterval);
        this.eventSource?.close();
        this.cd.detectChanges();
      };
      this.eventSource.onopen = () => {
        this.messages.push('Connection established');
      };
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

fetchFinalResult() {
    this.selectedFile = null;
    fetch(
      this.fetchFinalResultUrl
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
        this.vulnService.setAnimate(false);
        let dataCount =data.length;
        if(dataCount) {
          this.showFeedback('Success! The data has been fetched.');
        } else {
          this.showFeedback('No data found.');
        }
        this.paginationService.setDepInitialIndex(0);
        this.paginationService.setCpePageSize(5);
        this.vulnService.setDependencies(data);
        sessionStorage.setItem('dependencies', JSON.stringify(data));
        this.router.navigate([AppRoutes.DEPENDENCIES]);
        console.log('Final vulnerability data:', data);
        this.cd.detectChanges();
      })
      .catch((error) => {
        console.error('Error fetching final results:', error);
        this.showFeedback('Error fetching final results:');
      });
  }
  viewScannedDependencies() {
    this.router.navigate(['/dependencies']);
  }

  stopSSE() {
    this.isAnimate = false;
    this.vulnService.setAnimate(false);
    this.fetchedDependencies = 0;
    this.totalDependencies = 0;
    this.progress = 0;
    clearInterval(this.progressInterval);
    this.eventSource?.close();
    this.showFeedback("SSE emitter stopped");
  }

private showFeedback(message: string): void {
  this.snackBar.open(message, 'Dismiss', {
    duration: 5000
  });
}
}
