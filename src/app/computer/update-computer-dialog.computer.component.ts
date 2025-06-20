import { Component, Inject, HostBinding } from '@angular/core';
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
  constructor(
    public dialogRef: MatDialogRef<UpdateComputerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private http: HttpClient, private vulnSyncService: VulnerabilitySyncService
  ) {
    this.updateComputerForm = this.fb.group({
      ipAddress: ['', Validators.required],
      hostname: ['', Validators.required],
      osVersion: ['', Validators.required],
      antivirusStatus: ['', Validators.required],
      firewallStatus:['', Validators.required],
      lastUpdateCheck:['', Validators.required]
    });
  }
  ngOnInit(): void {
    console.log(this.data.computer)
    if (this.data && this.data.computer) {
      this.updateComputerForm.patchValue({
        ipAddress: this.data.computer.ipAddress,
        hostname: this.data.computer.hostname,
        osVersion: this.data.computer.osVersion,
        antivirusStatus: this.data.computer.antivirusStatus,
        firewallStatus: this.data.computer.firewallStatus,
        lastUpdateCheck: this.data.computer.lastUpdateCheck
      });
    }
    const origin = this.data.origin;
    this.originStyle = {
      top: `${origin.top}px`,
      left: `${origin.left}px`,
      width: `${origin.width}px`,
      height: `${origin.height}px`,
    };
    setTimeout(() => {
      this.animate = true;
    });
  }

  close(): void {
    this.animate = false;
    this.startCloseAnimation();
    setTimeout(() => this.dialogRef.close(), 300);
  }

  onSubmit(): void {
    if (this.updateComputerForm.valid) {
      // const uuid = this.data?.computer.uuid;

      // if (!uuid) {
      //   this.dialogRef.close(0);
      //   console.error('UUID not provided for update');
      //   return;
      // }
       const {deleted,uuid,id, ...computerData} = this.data.computer;
       const updatedForm = {...computerData, ...this.updateComputerForm.value}
      
       console.log(updatedForm)
       this.http
      .post<any>(
        vulnSyncEnvironments.computerCommonUrl,
        updatedForm
      )
      .subscribe({
        next: (response) => {
          console.log(response);
          let successMessage = 'Computer data added successfully';
          this.updateComputerForm.reset()
          this.vulnSyncDash.showToast(successMessage, 'success');
          this.vulnSyncService.setLoading(false);
        },
        error: (error) => {
          console.log(error);
          this.vulnSyncService.setLoading(false);
          let errorMessage = error.error.errorMessage || 'Check your internet connection';
          this.vulnSyncDash.showToast(errorMessage, 'error');
          console.log(error);
        },
      });
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
  const formatted = this.formatUTC(date);
  this.updateComputerForm.get(controlName)?.setValue(formatted); 
  }
  formatUTC(date: Date): string {
  if (!date) return '';
  return date.toISOString().split('.')[0] + 'Z'; // trims milliseconds
}
}
