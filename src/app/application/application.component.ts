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
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-application',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatSelectModule,
    FormsModule, MatIconModule, MatDialogModule],
  templateUrl: './application.component.html',
  styleUrl: './application.component.css'
})
export class ApplicationComponent implements OnInit, OnDestroy {
  applicationForm!: FormGroup;
  updateApplicationForm!: FormGroup;
  successMessage = '';
  errorMessage = '';
  successInterval: any = 0;
  proggWidth = 100;
  storedApplicationData: any = [];
  pageIndex: number = 0;
  pageSize: number = 10;
  initialIndex: number = 0;
  currentPageSize: number = this.pageSize;
  totalPages: number = 0;
  pageSizes: Array<number> = [];
  start: number = 0;
  end: number = 0;
  pagedApplicationData: any[] = [];
  selectedApplicationId: number | null = null;
  computerId: string | null = null;
  @ViewChild('successToast') successToast!: ElementRef;
  @ViewChild('errorToast') errorToast!: ElementRef;
  @ViewChild('succToastProgress') succToastProgress!: ElementRef;
  @ViewChild('updateDialog') updateDialog!: TemplateRef<any>;
  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;
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
    private route: ActivatedRoute
  ) {
    this.applicationForm = this.fb.group({
      computerId: ['', Validators.required],
      name: ['', Validators.required],
      vendor: ['', Validators.required],
      version: ['', Validators.required],
      installDate: ['', Validators.required],
    });

    this.updateApplicationForm = this.fb.group({
      name: ['', Validators.required],
      vendor: ['', Validators.required],
      version: ['', Validators.required],
      installDate: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.fetchApplicationData();
    this.route.paramMap.subscribe(params => {
    const computerId = params.get('computerId');
    if (computerId) {
      this.applicationForm.patchValue({ computerId: computerId });
      this.computerId = computerId;
    }
  });
  }

  ngOnDestroy(): void {
    clearInterval(this.successInterval);
  }

  fetchApplicationData(): void {
    this.http.get<any>(vulnSyncEnvironments.applicationCommonUrl).subscribe({
      next: (response) => {
        this.storedApplicationData = response;
        this.updatePagedData(this.initialIndex);
      },
      error: (error) => console.error(error)
    });
  }

  addApplicationData(): void {
    if (this.applicationForm.invalid) {
      this.showToast("Make sure all fields are completed correctly", 'error');
      return;
    }

    this.http.post<any>(vulnSyncEnvironments.applicationCommonUrl, this.applicationForm.value).subscribe({
      next: () => {
        this.applicationForm.reset();
        this.showToast("Application data added successfully", 'success');
        this.fetchApplicationData();
      },
      error: (error) => {
        this.showToast("Make sure all fields are filled correctly", 'error');
        console.error(error);
      }
    });
  }

  updatePagedData(initialIndex: number): void {
    const totalItems = this.storedApplicationData.length;
    this.totalPages = Math.ceil(totalItems / this.pageSize);
    this.start = initialIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pageSizes = totalItems >= 100 ? [10, 25, 50, 100] :
      totalItems >= 50 ? [10, 25, 50] :
      totalItems >= 25 ? [10, 25] :
      totalItems >= 10 ? [10] : [5];

    this.pagedApplicationData = this.storedApplicationData.slice(this.start, this.end);
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
    this.selectedApplicationId = application.id;
    this.updateApplicationForm.patchValue(application);
    this.dialog.open(this.updateDialog, {
      width: '700px',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-dialog-backdrop',
      disableClose: false,
    });
  }

  updateApplicationData(dialogRef: any): void {
    if (!this.updateApplicationForm.valid || !this.selectedApplicationId) return;

    const params = { applicationId: this.selectedApplicationId };
    this.http.put(`${vulnSyncEnvironments.applicationCommonUrl}`, this.updateApplicationForm.value, { params })
      .subscribe({
        next: () => {
          dialogRef.close();
          this.showToast("Application data updated successfully", 'success');
          this.fetchApplicationData();
        },
        error: (err) => {
          this.showToast("Make sure all fields are filled correctly", 'error');
          console.error(err);
        }
      });
  }

  async deleteApplicationData(applicationId: number): Promise<void> {
    this.dialogRef = this.dialog.open(this.confirmDialog);
    const confirmed = await firstValueFrom(this.dialogRef.afterClosed());
    if (!confirmed) return;

    try {
      await firstValueFrom(this.http.delete(`${vulnSyncEnvironments.applicationCommonUrl}`, {
        params: { applicationId: applicationId.toString() }
      }));
      this.fetchApplicationData();
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
