import { TemplateRef, Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { Computer, Dependency } from '../../vulnSyncModels/ComputerData';
import { UpdateDependencyDialogComponent } from './update-dependency-dialog.component';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ViewDependencyDialogComponent } from './view-dependency.component';

@Component({
  selector: 'app-applicationdependency',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatSelectModule,
    FormsModule, MatIconModule, MatDialogModule, MatTableModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './applicationdependency.component.html',
  styleUrl: './applicationdependency.component.css'
})
export class ApplicationdependencyComponent {
  isLoading: boolean = false;
  dependencyForm!: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';
  successInterval:any = 0;
  proggWidth = 100;
  storedDependencyData:Dependency[] = [];
  pageIndex:number = 0;
  pageSize:number = 10;
  initialIndex:number = 0;
  currentPageSize:number = this.pageSize;
  totalPages:number = 0;
  pageSizes:Array<number> = [];
  start:number = 0;
  end:number = 0;
  pagedDependencyData: any[] = [];
  applicationId: string | null = null;
  application: any = {};
  @ViewChild('successToast') successToast!: ElementRef;
  @ViewChild('errorToast') errorToast!: ElementRef;  
  @ViewChild('succToastProgress') succToastProgress!: ElementRef; 
  @ViewChild('updateDialog') updateDialog!: TemplateRef<any>;
  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;
  dialogRef!: MatDialogRef<any>;
  displayedColumns: string[] = [
  'name',
  'version',
  'groupId',
  'artifactId',
  'location',
  'createdAt',
  'updatedAt',
  'action'
  ];
  applicationDetail: string[] = ['name', 'version', 'vendor'];
  private bootstrap = (window as any).bootstrap;
  snackBar: MatSnackBar;
  constructor (private fb: FormBuilder, private http: HttpClient, private renderer: Renderer2, private cd: ChangeDetectorRef, private destroyRef: DestroyRef,
    private dialog: MatDialog, snackBar: MatSnackBar, private router: Router, private vulnSyncService: VulnerabilitySyncService
  ) {
    this.snackBar = snackBar;
    this.dependencyForm = this.fb.group({
      applicationId: ['', [Validators.required]],
      name: ['', [Validators.required]],
      version: ['', [Validators.required]],
      groupId: ['', [Validators.required]],
      artifactId: ['', [Validators.required]]
    });
  };

  ngOnInit(): void {
      this.application = this.vulnSyncService.getApplicationData();
      this.applicationId = this.application?.uuid ?? null;
      if (!this.isExistApplicationId()) return;  
      console.log(this.application)
      this.storedDependencyData = this.application?.dependencies ?? [];
      this.fetchDependencyData();
  }
  fetchDependencyData() {
      if (!this.isExistApplicationId()) return;
      this.isLoading = true;
      let params = {applicationUuid: this.applicationId!};
      this.http.get<Dependency[]>(vulnSyncEnvironments.getAllDependenciesUrl,{ params }).subscribe({
        next:(response)=>{
          console.log(response)
          this.storedDependencyData = response || [];
          this.updatePagedData(this.initialIndex);
          this.isLoading = false;
        },
        error:(error)=>{
          this.isLoading = false;
          console.log(error)
        }
      });
  }

  ngOnDestroy(): void {
      clearInterval(this.successInterval)
  }
  isExistApplicationId(): boolean {
  if (!this.applicationId) {
    this.showToast("ApplicationId not found", 'error');
    return false;
  }
  return true;
  }

  addDependencyData() {
    if (this.dependencyForm.invalid) {
      this.showToast("Make sure all fields are filled correctly", 'error');
      return;
    }
     if (!this.isExistApplicationId()) return;
      let params = { applicationUuid: this.applicationId! };
     this.http.post<any>(vulnSyncEnvironments.dependenciesCommonUrl, this.dependencyForm.value, {params}).subscribe({
      next:(response)=>{
          console.log(response);
          let successMessage = "Computer data added successfully";
          this.dependencyForm.reset({applicationId: this.dependencyForm.get('applicationId')?.value});
          this.showToast(successMessage, 'success');
          this.fetchDependencyData();
      },
      error:(error)=>{
        let errorMessage = "Make sure all fields are filled correctly";
        this.showToast(errorMessage, 'error');
        console.log(error);
      }
    }); 
  }
  showToast(message: string, type: 'success' | 'error'): void {
    if (type === 'success') {
      this.successMessage = message;
      if(this.successToast) {
        const toast = new this.bootstrap.Toast(this.successToast.nativeElement, {
          delay: 4000, autohide: true});
        toast.show();
      } else {
        window.alert(this.successMessage);
      }
    } else if (type === 'error') {
      this.errorMessage = message;
      if(this.errorToast) {
        const toast = new this.bootstrap.Toast(this.errorToast.nativeElement, {
          delay: 4000, autohide: true});
        toast.show();
      } else {
        window.alert(this.errorMessage);
      }
    }
    
  }
  nextPage(): void {
    if(this.pageIndex >= 0 && this.pageIndex <= this.totalPages && this.pageIndex !== this.totalPages - 1) {
    this.pageIndex++;
    this.start = this.pageIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pagedDependencyData = this.storedDependencyData.slice(this.start, this.end);
    console.log(this.pagedDependencyData, this.start, this.end);
    this.cd.detectChanges();
    }
   }
   previousPage(): void {
    if(this.pageIndex > 0) {
      this.pageIndex--;
      this.start = this.pageIndex * this.pageSize;
      this.end = this.start + this.pageSize;
      this.pagedDependencyData = this.storedDependencyData.slice(this.start, this.end);
      this.cd.detectChanges();
    }
   }
  onPageSizeChange(event: MatSelectChange): void {
     this.pageSize = event.value;
     this.pageIndex = 0;
     this.updatePagedData(this.initialIndex);
  }
  updatePagedData(initialIndex: number): void {
    let totalItems = this.storedDependencyData.length;
    let pages = Math.ceil(totalItems / this.pageSize);
    this.totalPages = pages;
    this.start = initialIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pageSizes = totalItems >= 100 ? [10, 25, 50, 100] : totalItems <= 100 && totalItems >= 50 ? [10, 25, 50] : 
    totalItems <= 50 && totalItems >= 25 ? [10, 25] : totalItems <= 25 && totalItems >= 10 ? [10] : [5];
    this.pagedDependencyData = this.storedDependencyData.slice(this.start, this.end);
   }

  openUpdateDialog(dependency: any): void {
  const dialogRef = this.dialog.open(UpdateDependencyDialogComponent, {
    width: '500px',
    disableClose: false,
    data: { ...dependency }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      console.log('Updated dependency data:', result);
      this.showToast('Dependency data updated successfully', 'success');
      this.fetchDependencyData();
    } else {
      result === false ? this.showToast('An error occurred while updating the computer', 'error') : "";
      console.log('Update dialog was closed without saving.');
    }
   });
  }
  openViewDependencyDialog(uuid: string){
  this.dialog.open(ViewDependencyDialogComponent, {
      hasBackdrop: true,
      width: '90vw',
      maxHeight: '90vh',
      panelClass: 'large-dialog',
      data:{ dependencyUuid: uuid}
    });
  }
  async deleteDependencyData(dependencyId: number): Promise<void> {
    this.dialogRef = this.dialog.open(this.confirmDialog);
    const confirmed = await firstValueFrom(this.dialogRef.afterClosed());
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.delete(`${vulnSyncEnvironments.dependenciesCommonUrl}`, {
          params: { uuid: dependencyId }
        })
      ).then((res) => {
        this.fetchDependencyData();
        let successMessage = "Dependency data deleted successfully";
        this.showToast(successMessage, 'success');
      });
      console.log('Dependency data deleted.');
    } catch (error) {
      console.error('Error deleting dependency data:', error);
    }
  }
  addVulnerability(dependency: any): void {
  this.vulnSyncService.setDependencyData(dependency);
  this.router.navigate(['/vulnerabilitySync/dependency', dependency.uuid]);
  }
}
