import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { vulnSyncEnvironments } from '../../environments/vulnSyncEnvironments';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

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
    MatButtonModule, MatCardModule, MatDividerModule
  ]
})
export class UpdateComputerDialogComponent {
  updateComputerForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<UpdateComputerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder, private http: HttpClient
  ) {
    this.updateComputerForm = this.fb.group({
      ipAddress: [data?.ipAddress, Validators.required],
      hostName: [data?.hostName, Validators.required],
      osName: [data?.osName, Validators.required],
      osVersion: [data?.osVersion, Validators.required],
      location: [data?.location, Validators.required]
    });
  }

  onSubmit(): void {
  if (this.updateComputerForm.valid) {
    const uuid = this.data?.uuid;

    if (!uuid) {
      console.error('UUID not provided for update');
      return;
    }

    const params = { computerUuid: uuid };
    this.http.put(vulnSyncEnvironments.computerCommonUrl, this.updateComputerForm.value, { params })
      .subscribe({
        next: (res) => {
          console.log('Update success:', res);
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Update error:', err);
          this.dialogRef.close(false);
        }
      });
  }
}

}
