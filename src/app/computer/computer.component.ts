import {
  TemplateRef,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  Inject,
  AfterViewInit,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { vulnSyncEnvironments } from '../../environments/vulnSyncEnvironments';
import { Renderer2 } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { ChangeDetectorRef } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { Computer } from '../../vulnSyncModels/ComputerData';
import { VulnerabilitySyncService } from '../../shared/VulnerabilitySyncService';
import { UpdateComputerDialogComponent } from './update-computer-dialog.computer.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ViewComputerDialogComponent } from './view-computer.component';
import { MatSortModule } from '@angular/material/sort';
import { Sort } from '@angular/material/sort';
import { NgZone } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { VulnerabilitysyncdashboardComponent } from '../vulnerabilitysyncdashboard/vulnerabilitysyncdashboard.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
@Component({
  selector: 'app-computer',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatSelectModule,
    FormsModule,
    MatIconModule,
    MatDialogModule,
    MatTableModule,
    MatTooltipModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatSortModule, MatDatepickerModule
  ],
  templateUrl: './computer.component.html',
  styleUrl: './computer.component.css',
  providers: [
  { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },  // optional
]

})
export class ComputerComponent implements OnInit, OnDestroy, AfterViewInit {
  isTableLoading: boolean = false;
  computerForm!: FormGroup;
  deviceForm!: FormGroup;
  updateComputerForm!: FormGroup;
  successInterval: any = 0;
  proggWidth = 100;
  storedComputerData: Computer[] = [];
  pageIndex: number = 0;
  pageSize: number = 5;
  initialIndex: number = 0;
  currentPageSize: number = this.pageSize;
  totalPages: number = 0;
  pageSizes: Array<number> = [];
  start: number = 0;
  end: number = 0;
  pagedComputerData: any[] = [];
  selectedComputerId: number | null = null;
  computerData: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  
  @ViewChild('updateDialog') updateDialog!: TemplateRef<any>;
  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;
  @ViewChild('dialogTemplate') dialogTemplate!: TemplateRef<any>;

  dialogRef!: MatDialogRef<any>;
  displayedColumns: string[] = [
    'ipAddress',
    'hostname',
    'osVersion',
    'antivirusStatus',
    'firewallStatus',
    'loggedInUser',
    'lastUpdateCheck',
    'active',
    'action',
  ];

  snackBar: MatSnackBar;
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private renderer: Renderer2,
    private cd: ChangeDetectorRef,
    private destroyRef: DestroyRef,
    private dialog: MatDialog,
    snackBar: MatSnackBar,
    private router: Router, matIconRegistry: MatIconRegistry, sanitizer: DomSanitizer,
    private vulnSyncService: VulnerabilitySyncService, private ngZone: NgZone,
    private vulnSyncDash: VulnerabilitysyncdashboardComponent
  ) {
    matIconRegistry.registerFontClassAlias('material-symbols-outlined');
    matIconRegistry.setDefaultFontSetClass('material-icons');
    this.snackBar = snackBar;
    this.computerForm = this.fb.group({
      ipAddress: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^(25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)){3}$/
          ),
        ],
      ],
      hostName: ['', [Validators.required]],
      osName: ['', [Validators.required]],
      osVersion: ['', [Validators.required]],
      location: ['', [Validators.required]],
    });

  }

  ngOnInit(): void {
    this.vulnSyncService.setLoading(true);
    this.fetchComputerData();
    this.initForm();
  }
  ngAfterViewInit(): void {
    document.querySelectorAll('.menu-item')[0].classList.add('active-link');
    document.querySelectorAll('.icon')[0].classList.remove('icon-shadow');
    this.vulnSyncService.setLoading(false);
  }
  initForm() {
  this.deviceForm = this.fb.group({
  deviceId: ['', Validators.required],
  machineName: ['', Validators.required],
  ipAddress: ['', [Validators.required, Validators.pattern(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)]],
  osVersion: ['', Validators.required],
  antivirusStatus: ['', Validators.required],
  firewallStatus: ['', Validators.required],
  loggedInUser: ['Muthukumar Ramasamy'],
  installedSoftware: this.fb.array([
    this.createSoftwareGroup()
  ]),
  lastUpdateCheck: [null, Validators.required],
  timestamp: [new Date(), Validators.required]
});

  }
  createSoftwareGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      version: ['', Validators.required],
      InstalledDate: [null, Validators.required],
      VendorName: ['', Validators.required]
    });
  }
  onDateChange(date: Date, controlName: string): void {
  const formatted = this.formatUTC(date);
  this.deviceForm.get(controlName)?.setValue(formatted); 
  }
 onSoftwareDateChange(selectedDate: Date, index: number): void {
  if (!selectedDate) {
    return;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDateTime = new Date(selectedDate);
  console.log(selectedDateTime)
  selectedDateTime.setHours(0, 0, 0, 0); 
  if (selectedDateTime.getTime() > today.getTime()) {
    this.installedSoftware.at(index).get('InstalledDate')?.setValue(''); 
    this.vulnSyncDash.showToast('Installed date cannot be in the future', 'error');
    return;
  }
  }
  

formatDateTime(date: Date): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

formatUTC(date: Date): string {
  if (!date) return '';
  return date.toISOString().split('.')[0] + 'Z'; // trims milliseconds
}

  get installedSoftware(): FormArray {
    return this.deviceForm.get('installedSoftware') as FormArray;
  }

  addSoftware(): void {
    this.installedSoftware.push(this.createSoftwareGroup());
  }

  removeSoftware(index: number): void {
    if (this.installedSoftware.length > 1) {
      this.installedSoftware.removeAt(index);
    }
  }
  
  fetchComputerData() {
    this.isTableLoading = true;
    this.http.get<Computer[]>(vulnSyncEnvironments.computerCommonUrl).subscribe({
      next: (response) => {
        console.log(response);
        this.storedComputerData = response || [];
        this.updatePagedData(this.pageIndex);
        this.isTableLoading = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        this.isTableLoading = false;
        this.cd.detectChanges();
        console.log(error);
      },
    });
  }

  ngOnDestroy(): void {}
  openDialog() {
    this.dialogRef = this.dialog.open(this.dialogTemplate,{
      hasBackdrop: true,
      width: '50vw',
      maxHeight: '50vh'
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  submit() {
    const body = JSON.parse(this.computerData);

    this.http.post('http://localhost:8081/api/computers', body).subscribe({
      next: (res) => {
        console.log('Success', res);
        this.closeDialog();
      },
      error: (err) => {
        console.error('Error', err);
      }
    });
  }
  addComputerData() {
    if (this.deviceForm.invalid) {
      this.vulnSyncDash.showToast('Make sure all fields are filled correctly', 'error');
      return;
    }
    let timestampDate = this.deviceForm.get('timestamp')?.value;
    this.deviceForm.get('timestamp')?.setValue(this.formatUTC(timestampDate));
    console.log(this.deviceForm.value);
    this.vulnSyncService.setLoading(true);
    this.http
      .post<any>(
        vulnSyncEnvironments.computerCommonUrl,
        this.deviceForm.value
      )
      .subscribe({
        next: (response) => {
          console.log(response);
          let successMessage = 'Computer data added successfully';
          this.deviceForm.reset()
          this.vulnSyncDash.showToast(successMessage, 'success');
          this.fetchComputerData();
          this.vulnSyncService.setLoading(false);
        },
        error: (error) => {
          this.vulnSyncService.setLoading(false);
          let errorMessage = error.error.errorMessage || 'Check your internet connection';
          this.vulnSyncDash.showToast(errorMessage, 'error');
          console.log(error);
        },
      });
  }

  sortData(sort: Sort) {
  const { active, direction } = sort;
  if (!active || direction === '') {
    this.updatePagedData(this.pageIndex);
    return;
  }

  this.storedComputerData.sort((a, b) => {
    let valueA = (a as any)[active];
    let valueB = (b as any)[active];
    console.log(valueA,valueB)

    if (active === 'active') {
      valueA = a.active ? 'Active' : 'No';
      valueB = b.active ? 'Active' : 'No';
    }

    const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    return direction === 'asc' ? comparison : -comparison;
  });

  this.updatePagedData(this.pageIndex);
}

  nextPage(): void {
    if (
      this.pageIndex >= 0 &&
      this.pageIndex <= this.totalPages &&
      this.pageIndex !== this.totalPages - 1
    ) {
      this.pageIndex++;
      this.start = this.pageIndex * this.pageSize;
      this.end = this.start + this.pageSize;
      this.pagedComputerData = this.storedComputerData.slice(
        this.start,
        this.end
      );
      console.log(this.pagedComputerData, this.start, this.end);
      this.cd.detectChanges();
    }
  }
  previousPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.start = this.pageIndex * this.pageSize;
      this.end = this.start + this.pageSize;
      this.pagedComputerData = this.storedComputerData.slice(
        this.start,
        this.end
      );
      this.cd.detectChanges();
    }
  }
  onPageSizeChange(event: MatSelectChange): void {
    this.pageSize = event.value;
    this.pageIndex = 0;
    this.updatePagedData(this.pageIndex);
  }
  updatePagedData(initialIndex: number): void {
    let totalItems = this.storedComputerData.length;
    let pages = Math.ceil(totalItems / this.pageSize);
    this.totalPages = pages;
    this.start = initialIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pageSizes =
      totalItems >= 100
        ? [10, 25, 50, 100]
        : totalItems <= 100 && totalItems >= 50
        ? [10, 25, 50]
        : totalItems <= 50 && totalItems >= 25
        ? [10, 25]
        : totalItems <= 25 && totalItems >= 10
        ? [10]
        : [5];
    this.pagedComputerData = this.storedComputerData.slice(
      this.start,
      this.end
    );
  }

  openUpdateDialog(event: MouseEvent, computer: any): void {
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const origin = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };

    const dialogRef = this.dialog.open(UpdateComputerDialogComponent, {
      data: { computer, origin },
      panelClass: ['animated-dialog-container'],
      hasBackdrop: true,
      backdropClass: 'custom-backdrop',
      disableClose: true,
    });
    dialogRef.backdropClick().subscribe(() => {
      dialogRef.close();
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Updated computer data:', result);
        this.vulnSyncDash.showToast('Computer data updated successfully', 'success');
        this.fetchComputerData();
      } else if (result === 0) {
        this.vulnSyncDash.showToast('UUID not provided for update', 'error');
      } else {
        result === false
          ? this.vulnSyncDash.showToast(
              'An error occurred while updating the computer',
              'error'
            )
          : '';
        console.log('Update dialog was closed without saving.');
      }
    });
  }

  openViewComputerDialog(uuid: string) {
    console.log(uuid);
    const dialogRef = this.dialog.open(ViewComputerDialogComponent, {
      data: { computerUuid: uuid },
      hasBackdrop: true,
      width: '90vw',
      maxHeight: '90vh'
    });
    dialogRef.afterOpened().subscribe(() => {
    setTimeout(() => {
    const container = document.querySelector('.mat-mdc-dialog-panel');
    const conatinerHeight = container?.getBoundingClientRect().height;
    if (container) {
      const viewTable = document.querySelector<HTMLElement>('.view-table');
      if (viewTable && typeof conatinerHeight === 'number') {
        viewTable.style.height = `${conatinerHeight -20}px`;
      }
    }
    }, 0);
   });

    dialogRef.afterClosed().subscribe((result) => {
     if (result === 2004) {
        this.vulnSyncDash.showToast('Computer not found', 'error');
      }
    });
  }
  
  async deleteComputerData(computerId: number): Promise<void> {
    this.dialogRef = this.dialog.open(this.confirmDialog);
    const confirmed = await firstValueFrom(this.dialogRef.afterClosed());
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.delete(`${vulnSyncEnvironments.computerCommonUrl}`, {
          params: { computerUuid: computerId },
        })
      ).then((res) => {
        this.fetchComputerData();
        let successMessage = 'Computer data deleted successfully';
        this.vulnSyncDash.showToast(successMessage, 'success');
      });
      console.log('Computer data deleted.');
    } catch (error) {
      console.error('Error deleting computer data:', error);
    }
  }
  addApplication(computer: any): void {
    this.vulnSyncService.setComputerData(computer);
    this.router.navigate(['/vulnerabilitySync/computer', computer.uuid], {
      state: { computer: computer },
    });
  }
}
