import { TemplateRef, Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
import { Application, Computer, Dependency } from '../../vulnSyncModels/ComputerData';
import { UpdatevulnerabilityDialogComponent } from './update-vulnerability-dialog.component';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-dependencyvulnerabilities',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatSelectModule,
  FormsModule, MatIconModule, MatDialogModule, MatTableModule, MatTooltipModule, MatNativeDateModule, MatDatepickerModule,
  MatProgressSpinnerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './dependencyvulnerabilities.component.html',
  styleUrl: './dependencyvulnerabilities.component.css'
})
export class DependencyvulnerabilitiesComponent implements OnInit, AfterViewInit {
    isLoading: boolean = false;
    vulnerabilityForm!: FormGroup;
    updateVulnerabilityForm!: FormGroup;
    successMessage = '';
    errorMessage = '';
    successInterval: any = 0;
    proggWidth = 100;
    storedVulnerabilityData: any = [];
    pageIndex: number = 0;
    pageSize: number = 5;
    initialIndex: number = 0;
    currentPageSize: number = this.pageSize;
    totalPages: number = 0;
    pageSizes: Array<number> = [];
    start: number = 0;
    end: number = 0;
    pagedVulnerabilityData: any[] = [];
    selectedVulnerabilityId: number | null = null;
    dependencyId: string | null = null;
    dependency: any = {};
    @ViewChild('successToast') successToast!: ElementRef;
    @ViewChild('errorToast') errorToast!: ElementRef;
    @ViewChild('succToastProgress') succToastProgress!: ElementRef;
    @ViewChild('updateDialog') updateDialog!: TemplateRef<any>;
    @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;
    dialogRef!: MatDialogRef<any>;
    private bootstrap = (window as any).bootstrap;
    displayedColumns: string[] = [
    'cveId',
    'description',
    'severity',
    'cvssScore',
    'publishedDate',
    'createdAt',
    'updatedAt',
    'action'
   ];
    dependencyDetailColumns: string[] = ['name', 'version', 'artifactId', 'groupId'];
    constructor(
      private fb: FormBuilder,
      private http: HttpClient,
      private renderer: Renderer2,
      private cd: ChangeDetectorRef,
      private destroyRef: DestroyRef,
      private dialog: MatDialog,
      private snackBar: MatSnackBar,
      private route: ActivatedRoute,
      private vulnSyncService: VulnerabilitySyncService
    ) {
      this.vulnerabilityForm = this.fb.group({
        dependencyId:['', Validators.required],
        cveId: ['', Validators.required],
        severity: ['', Validators.required],
        description: ['', Validators.required],
        cvssScore: ['', Validators.required],
        publishedDate: ['', Validators.required],
      });
    }
  
    ngOnInit(): void {
      this.dependency = this.vulnSyncService.getDependencyData();
      console.log(this.dependency);
      this.dependencyId = this.dependency?.uuid;
      this.vulnSyncService.setLoading(true);
      this.fetchVulnerabilityData();
    }
    ngAfterViewInit(): void {
      this.vulnSyncService.setLoading(false);
    }
    fetchVulnerabilityData(): void {
      if(!this.isExistDependencyId()) return;
      this.isLoading = true;
      let params = {dependencyUuid: this.dependencyId!};
      this.http.get<any>(vulnSyncEnvironments.getVulnerabilitiesUrl,{params}).subscribe({
        next: (response) => {
          this.storedVulnerabilityData = response || [];
          this.updatePagedData(this.initialIndex);
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          console.error(error)
        }
      });
    }
    isExistDependencyId(): boolean {
    if (!this.dependencyId) {
    this.showToast("DependencyId not found", 'error');
    return false;
    }
    return true;
    }

    addVulnerabilityData(): void {
      if (this.vulnerabilityForm.invalid) {
        this.showToast("Make sure all fields are completed correctly", 'error');
        return;
      }
      
      if(!this.isExistDependencyId()) return;
      const params = {dependencyUuid: this.dependency.uuid!};
      const formValue = { ...this.vulnerabilityForm.value };

      if (formValue.publishedDate) {
      const date: Date = formValue.publishedDate;
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      formValue.publishedDate = `${yyyy}-${mm}-${dd}`;
      }
      this.http.post<any>(vulnSyncEnvironments.vulnerabilitiesCommonUrl, formValue, {params}).subscribe({
        next: (res) => {
          console.log(res);
          this.vulnerabilityForm.reset({dependencyId: this.vulnerabilityForm.get('dependencyId')?.value});
          this.showToast("Vulnerability data added successfully", 'success');
          this.fetchVulnerabilityData();
        },
        error: (error) => {
          this.showToast("Make sure all fields are filled correctly", 'error');
          console.error(error);
        }
      });
    }
    // addVulnerability(application: Application) {
    //   this.vulnSyncService.setApplicationData(application);
    //   this.router.navigate(['/vulnerabilitySync/application', application.uuid], {state: {application:application}});
    // }
    updatePagedData(initialIndex: number): void {
      const totalItems = this.storedVulnerabilityData.length;
      this.totalPages = Math.ceil(totalItems / this.pageSize);
      this.start = initialIndex * this.pageSize;
      this.end = this.start + this.pageSize;
      this.pageSizes = totalItems >= 100 ? [10, 25, 50, 100] :
        totalItems >= 50 ? [10, 25, 50] :
        totalItems >= 25 ? [10, 25] :
        totalItems >= 10 ? [10] : [5];
  
      this.pagedVulnerabilityData = this.storedVulnerabilityData.slice(this.start, this.end);
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
      const dialogRef = this.dialog.open(UpdatevulnerabilityDialogComponent, {
        width: '500px',
        disableClose: false,
        data:{...application}
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if(result) {
          this.showToast("Application data updated successfully", 'success');
          this.fetchVulnerabilityData();
        } else {
          result === false ? this.showToast('An error occurred while updating the computer', 'error') : "";
        }
      })
    }
    async deleteVulnerabilityData(vulnerabilityId: number): Promise<void> {
      this.dialogRef = this.dialog.open(this.confirmDialog);
      const confirmed = await firstValueFrom(this.dialogRef.afterClosed());
      if (!confirmed) return;
      
      try {
        await firstValueFrom(this.http.delete(`${vulnSyncEnvironments.vulnerabilitiesCommonUrl}`, {
          params: { vulnerabilityUuid: vulnerabilityId }
        }));
        this.fetchVulnerabilityData();
        this.showToast("Application data deleted successfully", 'success');
      } catch (error) {
        console.error('Error deleting application data:', error);
      }
    }
  
    showToast(message: string, type: 'success' | 'error'): void {
      if (type === 'success') {
        this.successMessage = message;
        if (this.successToast) {
          const toast = new this.bootstrap.Toast(this.successToast.nativeElement, {
            delay: 4000, autohide: true
          });
          toast.show();
        } else {
          window.alert(this.successMessage);
        }
      } else {
        this.errorMessage = message;
        if (this.errorToast) {
          const toast = new this.bootstrap.Toast(this.errorToast.nativeElement, {
            delay: 4000, autohide: true
          });
          toast.show();
        } else {
          window.alert(this.errorMessage);
        }
      }
    }
}
