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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';

@Component({
  selector: 'app-update-application-dialog',
  standalone: true,
  templateUrl: './update-application-dialog.component.html',
  styleUrls: ['./application.component.css', './application.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule, MatCardModule, MatDividerModule, MatDatepickerModule, MatNativeDateModule
  ],
  providers: [
    provideNativeDateAdapter()
  ]
})
export class UpdateApplicationDialogComponent {
  updateApplicationForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<UpdateApplicationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder, private http: HttpClient
  ) {
    this.updateApplicationForm = this.fb.group({
      name: [data?.name, Validators.required],
      vendor: [data?.vendor, Validators.required],
      version: [data?.version, Validators.required],
      installedDate: [data?.installedDate, Validators.required],
    });
  }

  onSubmit(): void {
  if (this.updateApplicationForm.valid) {
    const uuid = this.data?.uuid;

    if (!uuid) {
      console.error('UUID not provided for update');
      return;
    }

    const params = { applicationUuid: uuid };

    this.http.put(`${vulnSyncEnvironments.applicationCommonUrl}`, this.updateApplicationForm.value, { params })
      .subscribe({
        next: (res) => {
          console.log('Update success:', res);
          this.dialogRef.close(this.updateApplicationForm.value);
        },
        error: (err) => {
          console.error('Update error:', err);
        }
      });
  }
}

}
