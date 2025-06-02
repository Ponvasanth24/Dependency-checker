import { Component, Inject, HostBinding } from '@angular/core';
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
  // @HostBinding('@scaleDialog') scale = true;
  @HostBinding('style.transformOrigin') transformOrigin: string = 'center center';
  originStyle = {};
  animate = false;
  updateComputerForm!: FormGroup;
  constructor(
    public dialogRef: MatDialogRef<UpdateComputerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder, private http: HttpClient
  ) {
    this.updateComputerForm = this.fb.group({
      ipAddress: ['', Validators.required],
      hostName: ['', Validators.required],
      osName: ['', Validators.required],
      osVersion: ['', Validators.required],
      location: ['', Validators.required]
    });
  }
ngOnInit(): void {
  if (this.data && this.data.computer) {
      this.updateComputerForm.patchValue({
        ipAddress: this.data.computer.ipAddress,
        hostName: this.data.computer.hostName,
        osName: this.data.computer.osName,
        osVersion: this.data.computer.osVersion,
        location: this.data.computer.location
      });
  }  
    const origin = this.data.origin;
    this.originStyle = {
      top: `${origin.top}px`,
      left: `${origin.left}px`,
      width: `${origin.width}px`,
      height: `${origin.height}px`
    };
    setTimeout(() => {
      this.animate = true;
    });
  }

  close(): void {
    this.animate = false;
    this.startCloseAnimation();
    // Wait for the animation to finish before closing
    setTimeout(() => this.dialogRef.close(), 300);
  
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
closeDialog(): void {
    // this.scale = false;
    setTimeout(() => this.dialogRef.close(), 200);
  }
  startCloseAnimation(): void {
  // this.scale = false;
  this.animate = false;
  setTimeout(() => this.dialogRef.close(), 200); // match animation duration
}
}


