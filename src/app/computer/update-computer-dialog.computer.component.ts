import { Component, Inject, HostBinding, ViewChild, ElementRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { vulnSyncEnvironments } from '../../environments/vulnSyncEnvironments';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { VulnerabilitySyncService } from '../../shared/VulnerabilitySyncService';
import { VulnerabilitysyncdashboardComponent } from '../vulnerabilitysyncdashboard/vulnerabilitysyncdashboard.component';
import { timestamp } from 'rxjs';
import { ComputerDetailsResponse } from '../../vulnSyncModels/ComputerData';
import { Renderer2 } from '@angular/core';
@Component({
  selector: 'app-update-computer-dialog',
  standalone: true,
  templateUrl: './update-computer-dialog.component.html',
  styleUrl: './computer.component.css',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatDatepickerModule
  ],
  providers: [
  { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },  // optional
]
})
export class UpdateComputerDialogComponent {
  private vulnSyncDash!: VulnerabilitysyncdashboardComponent
  @HostBinding('style.transformOrigin') transformOrigin: string =
    'center center';
  originStyle = {};
  animate = false;
  updateComputerForm!: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';
  computerData: ComputerDetailsResponse | null = null;
  @ViewChild('successToast') successToast!: ElementRef;
  @ViewChild('errorToast') errorToast!: ElementRef;
  @ViewChild('updateDialog') updateDialog!: ElementRef;
  private bootstrap = (window as any).bootstrap;

  constructor(
    public dialogRef: MatDialogRef<UpdateComputerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data:{uuid: string, origin: any},
    private fb: FormBuilder,
    private http: HttpClient, private vulnSyncService: VulnerabilitySyncService, private renderer: Renderer2
  ) {
    this.updateComputerForm = this.fb.group({
      ipAddress: ['', Validators.required],
      machineName: ['', Validators.required],
      osVersion: ['', Validators.required],
      antivirusStatus: ['', Validators.required],
      firewallStatus:['', Validators.required],
      lastUpdateCheck:['', Validators.required],
      timestamp: ['']
    });
  }
  ngOnInit(): void {
    console.log(this.data.uuid)
    const computerUuid = this.data.uuid;
    this.http.get<any>(`${vulnSyncEnvironments.computerCommonUrl}/${computerUuid}`).subscribe({
      next: (response) => {
        console.log(response)
        this.computerData = response || [];
        this.initForm()
      },
      error: (error) => {
        console.error(error);
        this.dialogRef.close();
      }
    });
  }

  initForm() {
    this.updateComputerForm.patchValue({
        ipAddress: this.computerData?.computer.ipAddress,
        machineName: this.computerData?.computer.machineName,
        osVersion: this.computerData?.computer.osVersion,
        antivirusStatus: this.computerData?.computer.antivirusStatus,
        firewallStatus: this.computerData?.computer.firewallStatus,
        lastUpdateCheck: this.computerData?.computer.lastUpdateCheck
      });
  }

  close(): void {
    this.animate = false;
    this.startCloseAnimation();
    setTimeout(() => this.dialogRef.close(), 300);
  }

 onSubmit(): void {
  this.vulnSyncService.setLoading(true);
  const container = document.querySelector('.update-dialog-container');
  if (container) {
    this.renderer.setStyle(container, 'visibility', 'hidden');
  }

  const timestamp = this.computerData?.computer.timestamp;
  const formatted =timestamp?.concat('Z');
  this.updateComputerForm.get('timestamp')?.setValue(formatted);
  console.log(this.updateComputerForm.valid)
  const lucDateRaw = this.updateComputerForm.get('lastUpdateCheck')?.value;
  console.log(lucDateRaw.indexOf('Z'))
  if(lucDateRaw.indexOf('Z') === -1){
    const formattedLuc = lucDateRaw.concat('Z');
    this.updateComputerForm.get('lastUpdateCheck')?.setValue(formattedLuc);
  }

  const finalPayload = this.updateComputerForm.getRawValue();
  console.log(finalPayload);
  try {
    if (this.computerData) {
      const { deleted ,uuid, id, createdAt, updatedAt, active, timestamp, lastUpdateCheck, ...computerData } = this.computerData.computer;
      const installedSoftware = [...this.computerData.applications];
      const updatedForm = { ...computerData, ...finalPayload, installedSoftware };
      
      console.log(updatedForm)
      this.http.post<any>(vulnSyncEnvironments.computerCommonUrl, updatedForm).subscribe({
        next: (response) => {
          console.log(response)
          this.dialogRef.close(true);
          this.successMessage = 'Computer data added successfully';
          this.updateComputerForm.reset();
          this.vulnSyncService.setLoading(false);
        },
        error: (error) => {
          console.log(error)
          this.vulnSyncService.setLoading(false);
          this.dialogRef.close(false);
          this.errorMessage = error.error?.errorMessage || 'Check your internet connection';
          this.showToast(this.errorMessage, 'error');
        }
      });
    } else {
      throw new Error('Computer data is null');
    }
  } catch (error) {
    console.error('Submit error:', error);
  }
}

  closeDialog(): void {
    setTimeout(() => this.dialogRef.close(), 200);
  }
  startCloseAnimation(): void {
    this.animate = false;
    setTimeout(() => this.dialogRef.close(), 200);
  }
  onDateChange(date: Date, controlName: string): void {
  const lucDate = date.toISOString();
  const formatted = lucDate.split('.')[0].concat('Z');
  this.updateComputerForm.get(controlName)?.setValue(formatted); 
  }
  formatUTC(date: Date): string {
  if (!date) return '';
  return date.toISOString().split('.')[0] + 'Z';
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
