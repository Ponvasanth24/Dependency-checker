import { TemplateRef, Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { vulnSyncEnvironments } from '../../environments/vulnSyncEnvironments';
import { Renderer2 } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { ChangeDetectorRef } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { Router,ActivatedRoute } from '@angular/router';
import { VulnerabilitySyncService } from '../../shared/VulnerabilitySyncService';
import { Application, Computer } from '../../vulnSyncModels/ComputerData';
import { UpdateApplicationDialogComponent } from './update-application-dialog.component';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';
import { ViewApplicationDialogComponent } from './view-application.component';
import { MatSort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { VulnerabilitysyncdashboardComponent } from '../vulnerabilitysyncdashboard/vulnerabilitysyncdashboard.component';
import { fakeAsync } from '@angular/core/testing';

interface ApplicationData {
  id: number;
  uuid: string;
  name: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  active: boolean;
  vulnerabilities: any[];
  [key: string]: any;
}

@Component({
  selector: 'app-application',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatSelectModule,
  FormsModule, MatIconModule, MatDialogModule, MatTableModule, MatTooltipModule, MatCardModule,
  MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule, MatSortModule],
  providers: [
    provideNativeDateAdapter()
  ],
  templateUrl: './application.component.html',
  styleUrl: './application.component.css'
})
export class ApplicationComponent implements OnInit, AfterViewInit, OnDestroy {
  isLoading: boolean = true;
  applicationForm!: FormGroup;
  updateApplicationForm!: FormGroup;
  successMessage = '';
  errorMessage = '';
  successInterval: any = 0;
  proggWidth = 100;
  storedApplicationData: any = [];
  pageIndex: number = 0;
  pageSize: number = 5;
  initialIndex: number = 0;
  currentPageSize: number = this.pageSize;
  totalPages: number = 0;
  pageSizes: Array<number> = [];
  start: number = 0;
  end: number = 0;
  pagedApplicationData!: MatTableDataSource<any>;
  selectedApplicationId: number | null = null;
  computerUuid: string | null = null;
  computer: any = {};
  footerColumns = ['pagination'];
  sortActive = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  computerDetailTable: string[] = ['ipAddress', 'hostName', 'os', 'antivirusStatus', 'firewallStatus', 'status', 'action'];
  displayedColumns: string[] = ['name', 'version', 'vendor', 'installedDate', 'createdAt','status' ,'action'];
  @ViewChild('successToast') successToast!: ElementRef;
  @ViewChild('errorToast') errorToast!: ElementRef;
  @ViewChild('succToastProgress') succToastProgress!: ElementRef;
  @ViewChild('updateDialog') updateDialog!: TemplateRef<any>;
  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;
  @ViewChild(MatSort) sort!: MatSort;
  dialogRef!: MatDialogRef<any>;
  private bootstrap = (window as any).bootstrap;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private renderer: Renderer2,
    private cd: ChangeDetectorRef,
    private destroyRef: DestroyRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router, private vulnSyncService: VulnerabilitySyncService,
    private vulnSyncDash: VulnerabilitysyncdashboardComponent
  ) {
    this.applicationForm = this.fb.group({
      computerUuid: ['', Validators.required],
      name: ['', Validators.required],
      version: ['', Validators.required],
      vendorName: ['', Validators.required],
      installedDate: ['', Validators.required],
    });
  }

ngOnInit(): void {
    this.computer = this.vulnSyncService.getComputerData();
    console.log(this.computer);
    this.computerUuid = this.computer?.uuid;
    if(!this.isExistComputrtId()) return;
    this.storedApplicationData = this.computer.applications;
    this.fetchApplicationData();
}

ngAfterViewInit(): void {
this.sort.sortChange.subscribe(sort => {
    this.sortActive = sort.active;
    this.sortDirection = sort.direction as 'asc' | 'desc';
    this.updatePagedData(this.pageIndex);
  });
   this.vulnSyncService.setLoading(false);
   this.cd.detectChanges();
}

ngOnDestroy(): void {
    clearInterval(this.successInterval);
}

fetchApplicationData(): void {
    if(!this.isExistComputrtId()) return;
    this.isLoading = true;
    let params = {computerUuid:this.computerUuid ? this.computerUuid : ""};
    this.http.get<any>(`${vulnSyncEnvironments.computerCommonUrl}/${this.computerUuid}/applications`).subscribe({
      next: (response) => {
        console.log(params);
        console.log(response);
        this.storedApplicationData = response || [];
        this.updatePagedData(this.initialIndex);
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  isExistComputrtId():boolean {
    if(!this.computerUuid) {
        let errorMessage = "ComputerUuid not found"
        this.vulnSyncDash.showToast(errorMessage, 'error');
        return false;
      }  
      return true
  }
  addApplicationData(): void {
    if (this.applicationForm.invalid) {
      this.vulnSyncDash.showToast("Make sure all fields are filled correctly", 'error');
      return;
    }
    this.vulnSyncService.setLoading(true);
    if(!this.isExistComputrtId()) return;
    let params = {computerUuid:this.computer.uuid};
    const AddedApplication = this.applicationForm.getRawValue();
    AddedApplication.installedDate = String(AddedApplication.installedDate.toISOString()).replace(/Z$/,'');
    const { computerUuid ,...refinigAddedApplication} = AddedApplication;
    if(String(this.computer.timestamp).indexOf('Z') === -1 || String(this.computer.installedDate).indexOf('Z') === -1) {
       const lastUpdateCheck = this.computer.lastUpdateCheck.concat('Z');
       const timestamp = this.computer.timestamp.concat('Z');
       this.computer.timestamp = timestamp;
       this.computer.lastUpdateCheck = lastUpdateCheck;
    }
    const { deleted ,uuid, id, createdAt, updatedAt, active, ...computerData } = this.computer;
    const refiningInstalledSoftware = (this.storedApplicationData as ApplicationData[]).map(({id, uuid, createdAt, deleted, active, updatedAt, vulnerabilities, ...rest}) => rest);
    const installedSoftware = [...refiningInstalledSoftware, refinigAddedApplication];
    const updatedForm = { ...computerData, installedSoftware};
    console.log(updatedForm);
    this.http.post<any>(vulnSyncEnvironments.computerCommonUrl, updatedForm ).subscribe({
      next: () => {
        this.applicationForm.reset({computerUuid: this.applicationForm.get('computerUuid')?.value});
        this.vulnSyncDash.showToast("Application data added successfully", 'success');
        this.fetchApplicationData();
        this.vulnSyncService.setLoading(false);
      },
      error: (error) => {
        this.vulnSyncService.setLoading(false);
        let errorMessage = error.error.errorMessage || 'Check your internet connection';
        this.vulnSyncDash.showToast(errorMessage, 'error');
        console.error(error);
      }
    });
  }
  addDependency(application: Application) {
    this.vulnSyncService.setApplicationData(application);
    this.router.navigate(['/vulnerabilitySync/application', application.uuid]);
  }
  updatePagedData(initialIndex: number): void {
  this.pageIndex = initialIndex;
  const totalItems = this.storedApplicationData?.length || 0;
  this.totalPages = Math.ceil(totalItems / this.pageSize);
  this.start = initialIndex * this.pageSize;
  this.end = this.start + this.pageSize;

  this.pageSizes = totalItems >= 100 ? [10, 25, 50, 100] :
    totalItems >= 50 ? [10, 25, 50] :
    totalItems >= 25 ? [10, 25] :
    totalItems >= 10 ? [10] : [5];

  let sortedData = [...this.storedApplicationData];

  if (this.sortActive) {
    sortedData.sort((a, b) => {
      let aValue = a[this.sortActive];
      let bValue = b[this.sortActive];

      if (this.sortActive === 'installedDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  this.pagedApplicationData = new MatTableDataSource(sortedData.slice(this.start, this.end));
}


  nextPage(): void {
    if (this.pageIndex < this.totalPages - 1) {
      this.pageIndex++;
      this.updatePagedData(this.pageIndex);
      this.cd.detectChanges();
    }
  }

  previousPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.updatePagedData(this.pageIndex);
      this.cd.detectChanges();
    }
  }

  onPageSizeChange(event: MatSelectChange): void {
    this.pageSize = event.value;
    this.pageIndex = 0;
    this.updatePagedData(this.initialIndex);
  }

  openUpdateDialog(application: any): void {
    const dialogRef = this.dialog.open(UpdateApplicationDialogComponent, {
      width: '500px',
      disableClose: false,
      data:{ computer: this.computer, application: application},
      panelClass:['app-update-form']
    });
    dialogRef.backdropClick().subscribe(()=> {
         dialogRef.close();
    }) 
    dialogRef.afterClosed().subscribe(result => {
      console.log(result)
      switch (result) {
      case 200:
      this.vulnSyncDash.showToast("Application data updated successfully", 'success');
      this.fetchApplicationData();
      break;

      case 201:
      this.vulnSyncDash.showToast('No changes detected in applications', 'error');
      break;

      case 4001:
      this.vulnSyncDash.showToast('Duplicate application added. please check the input', 'error');
      break;
      default:
         break;
}
    })
  }

  openViewApplicationDialog(statusObj: {status: boolean}){
    const dialogRef = this.dialog.open(ViewApplicationDialogComponent, {
      hasBackdrop: true,
      width: '90vw',
      minHeight: '50vh',
      maxHeight: '90vh',
      data:{ computerUuid: this.computerUuid, status: statusObj.status}
    });

    dialogRef.afterOpened().subscribe(() => {
    setTimeout(() => {
    const container = document.querySelector('.mat-mdc-dialog-panel');
    const conatinerHeight = container?.getBoundingClientRect().height;
    if (container) {
      const viewTable = document.querySelector<HTMLElement>('.view-table');
      if (viewTable && typeof conatinerHeight === 'number') {
        viewTable.style.height = `${conatinerHeight}px`;
      }
    }
    }, 0);
   });
  }

  async deleteApplicationData(applicationId: number): Promise<void> {
    this.dialogRef = this.dialog.open(this.confirmDialog);
    const confirmed = await firstValueFrom(this.dialogRef.afterClosed());
    if (!confirmed) return;
    console.log(this.storedApplicationData)
    console.log(this.computer)
    this.vulnSyncService.setLoading(true);
    if(this.computer.timestamp.indexOf('Z') === -1 || this.computer.lastUpdateCheck.indexOf('Z') === -1) {
       const lastUpdateCheck = this.computer.lastUpdateCheck.concat('Z');
       const timestamp = this.computer.timestamp.concat('Z');
       this.computer.timestamp = timestamp;
       this.computer.lastUpdateCheck = lastUpdateCheck;
    }
    const { deleted,uuid, id,createdAt, updatedAt, active, ...computerData } = this.computer;
    const afterRemovedApp = this.storedApplicationData.filter((app: any, index:number)=> app.uuid !== applicationId && !app.deleted).map((app:any )=> {
         const { id, uuid,createdAt, updatedAt, deleted, vulnerabilities, ...refinedApp } = app;
         if(!refinedApp.deleted) {
             return refinedApp;
         };
    });  
    console.log(afterRemovedApp)
    const installedSoftware = [...afterRemovedApp]
    const updatedValue = {...computerData, installedSoftware};
    console.log(updatedValue)
      this.http.post<any>(vulnSyncEnvironments.computerCommonUrl,updatedValue).subscribe({
        next:(reponse)=>{
             this.fetchApplicationData();
             this.vulnSyncService.setLoading(false);
             this.vulnSyncDash.showToast("Application data deleted successfully", 'success');
        }, error: (error)=>{
             console.log(error);
             this.vulnSyncService.setLoading(false);
             this.vulnSyncDash.showToast(error.error.errorMessage, 'error');
        }
      });
  }

  activateComputer(uuid: string) {
     this.vulnSyncService.setLoading(true);
     this.http.patch<any>(`${vulnSyncEnvironments.computerCommonUrl}/${uuid}/activate`,{headers: new HttpHeaders({ 'Content-Type': 'application/json' })}).subscribe({
      next: (response) => {
        console.log(response)
        if(response.statusCode === 2012) {
          this.vulnSyncDash.showToast("computer activated successfully", 'success');
        }
        this.fetchApplicationData();
        this.vulnSyncService.setLoading(false);
      },
      error: (error) => {
        if(error.error.errorCode === 2009) {
         let errorMessage = error.error.errorMessage || 'Check your internet connection';
         this.vulnSyncDash.showToast(errorMessage, 'error');
        } else{
         this.vulnSyncDash.showToast('Unexpected error occured', 'error');
        }
        console.error(error);
        this.vulnSyncService.setLoading(false);
      }
    });
  }

  deActivateComputer(uuid: string) {
     this.http.patch<any>(`${vulnSyncEnvironments.computerCommonUrl}/${uuid}/deactivate`, {}).subscribe({
      next: (response) => {
        if(response.statusCode === 2006) {
          this.vulnSyncDash.showToast("computer deactivated successfully", 'success');
          this.fetchApplicationData();
        }
      },
      error: (error) => {
        if(error.error.errorCode === 2008) {
         let errorMessage = error.error.errorMessage;
         this.vulnSyncDash.showToast(errorMessage, 'error');
        } else if(error.error.errorCode === 2017) {
         this.vulnSyncDash.showToast(error.error.errorMessage, 'error');
        }
        console.error(error);
      }
    });
  }

  showToast(message: string, type: 'success' | 'error'): void {
  if (type === 'success') {
    this.successMessage = message;
    if (this.successToast) {
      const toastEl = this.successToast.nativeElement;
      const toast = new this.bootstrap.Toast(toastEl, {
        delay: 4000,
        autohide: true,
      });
      toast.show();

      toastEl.classList.add('slide-in-right');
      toastEl.addEventListener('animationend', () => {
      toastEl.classList.remove('slide-in-right');
      }, { once: true });
    } else {
      window.alert(this.successMessage);
    }
  } else if (type === 'error') {
    this.errorMessage = message;
    if (this.errorToast) {
      const toastEl = this.errorToast.nativeElement;
      const toast = new this.bootstrap.Toast(toastEl, {
        delay: 4000,
        autohide: true,
      });
      toast.show();
      toastEl.classList.add('slide-in-right');
      toastEl.addEventListener('animationend', () => {
        toastEl.classList.remove('slide-in-right');
      }, { once: true });
    } else {
      window.alert(this.errorMessage);
    }
  }
}

}
