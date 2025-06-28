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
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-update-dependency-dialog',
  standalone: true,
  templateUrl: './update-dependency-dialog.component.html',
  styleUrl: './applicationdependency.component.css',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule, MatCardModule, MatDividerModule, MatIcon
  ]
})
export class UpdateDependencyDialogComponent {
  updateDependencyForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<UpdateDependencyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder, private http: HttpClient
  ) {
    this.updateDependencyForm = this.fb.group({
      name: [data?.name, Validators.required],
      version: [data?.version, Validators.required],
      artifactId: [data?.artifactId, Validators.required],
      groupId: [data?.groupId, Validators.required]
    });
  }

  onSubmit(): void {
    if (this.updateDependencyForm.valid) {
      const uuid = this.data?.uuid;

      if (!uuid) {
        console.error('UUID not provided for update');
        return;
      }

      const params = { dependencyUuid: uuid };

      this.http.put(vulnSyncEnvironments.dependenciesCommonUrl, this.updateDependencyForm.value, { params })
        .subscribe({
          next: (res) => {
            console.log('Update success:', res);
            this.dialogRef.close(this.updateDependencyForm.value);
          },
          error: (err) => {
            this.dialogRef.close(false);
            console.error('Update error:', err);
          }
        });
    }
  }

}
