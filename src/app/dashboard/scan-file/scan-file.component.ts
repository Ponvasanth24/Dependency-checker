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
import { Subject } from 'rxjs';

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
  private cancelRequest$ = new Subject<void>();
  private destroy$ = new Subject<void>();
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
    // this.renderer.setStyle(this.scanFile?.nativeElement, 'min-height', `${window.innerHeight}px`);
    // this.renderer.setStyle(this.scanFile?.nativeElement, 'max-height', "fit-content");
    // console.log(this.scanFile.nativeElement)
    // if(this.scanProject) {
    // this.renderer.setStyle(this.scanProject?.nativeElement, 'min-height', `${window.innerHeight}px`);
    // this.renderer.setStyle(this.scanProject?.nativeElement, 'max-height', "fit-content");
    // }
  }

  ngOnDestroy(): void {
    clearInterval(this.progressInterval);
    this.eventSource?.close();
    this.cancelRequest$.complete();
    this.destroy$.next();
    this.destroy$.complete();
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
    this.formData = new FormData();
    this.formData.append('file', file);
    if (filename === 'pom.xml') {
       this.formData.append('fileType', 'POM');
    } else if (filename === 'package.json') {
       this.formData.append('fileType', 'PACKAGE_JSON');
    } else if (filename === 'package-lock.json') {
       this.formData.append('fileType', 'PACKAGE_LOCK_JSON');
    } else {
      this.removeFile();
      this.showFeedback('Unsupported file. Upload pom.xml, package.json, or package-lock.json');
    }
  }

  startFileScan(): void {
    this.messages = [];
    this.isAnimate = true;
    this.startProgress();
    try {
    const hasFiles = Array.from(this.formData.values()).some(value => value instanceof File && value.name);
    if (hasFiles) {
     this.scanUrl = `${environment.baseLocaUrl}${this.portNumber.toString()}${environment.uploadFile}`; 
     this.fetchFinalResultUrl = `${environment.baseLocaUrl}${this.portNumber.toString()}${environment.getScanVulnerabilities}`;
     fetch(this.scanUrl, {method: 'POST',body: this.formData})
    .then(response => {
      if (!response.ok) throw new Error('Please check if the server is running on correct port');
      return response.json();
    })
    .then((res) => {
       const jobId = res.jobId;
       this.fetchEventLogUrl = `${environment.baseLocaUrl}${this.portNumber}${environment.getFileUploadEventLog}${jobId}`
       this.fetchEventLog();
      })
    .catch(error => {
      console.log(error);
      this.resetAnimationState();
      return;
     });
     } else {
        this.showFeedback('File is not uploaded or Not valid');
      }   
    } catch (error: any) {
      console.error('Error:', error);
      this.resetAnimationState();
    }
  }

  startProjectScan() {
     this.messages = [];
     this.isAnimate = true;
     this.startProgress();
      try{
        this.fetchEventLogUrl = `${environment.baseLocaUrl}${this.portNumber.toString()}${environment.fetchVulnerability}`;
        this.fetchFinalResultUrl = `${environment.baseLocaUrl}${this.portNumber.toString()}${environment.getVulnerabilities}`;
        this.fetchEventLog();
      } catch(error:any) {
        console.error('Error:', error);
        this.resetAnimationState();
      }
  }

  startProgress(){
      this.progressInterval = setInterval(()=>{
      if(this.progress < 100) this.progress++;
      else {
        this.isAnimate = false;
        clearInterval(this.progressInterval);
        this.eventSource?.close();
        this.showFeedback("Unexpected error occured");
      }
    }, 1300);
  }

  resetAnimationState() {
      this.isAnimate = false;
      this.vulnService.setAnimate(false);
      this.progress = 0;
      this.fetchedDependencies = 0;
      this.totalDependencies = 0;
      clearInterval(this.progressInterval);
      this.showFeedback('Failed to fetch | Please check if the server is running on correct port.');
      if (this.eventSource) {
        this.eventSource?.close();
      }
      this.cd.detectChanges();
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
        this.showFeedback('SSE error | Please check if the server is running on correct port.');
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
