import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
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
import { MatIcon } from '@angular/material/icon';
import { ComputerData } from '../../vulnSyncModels/ComputerData';
import { VulnerabilitySyncService } from '../../shared/VulnerabilitySyncService';

interface ApplicationData {
  id: number;
  uuid: string;
  name: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  active: boolean;
  vulnerabilities: any[];
  [key: string]: any;
}
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
    MatButtonModule, MatCardModule, MatDividerModule, MatDatepickerModule, MatNativeDateModule, MatIcon
  ],
  providers: [
    provideNativeDateAdapter()
  ]
})
export class UpdateApplicationDialogComponent {
  updateApplicationForm!: FormGroup;
  computer!: any;
  applications!: any;

  constructor(
    public dialogRef: MatDialogRef<UpdateApplicationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder, private http: HttpClient, private vulnSyncService: VulnerabilitySyncService
  ) {
    this.updateApplicationForm = this.fb.group({
      softwareName: [data?.application.softwareName, Validators.required],
      softwareVersion: [data?.application.softwareVersion],
      vendorName: [data?.application.vendorName],
      installedDate: [data?.application.installedDate],
    });
    this.fetchComputerData();
    console.log(this.data)
  }

  fetchComputerData(): void {
    this.http.get<any>(`${vulnSyncEnvironments.computerCommonUrl}/${this.data.computer.uuid}` )
      .subscribe({
        next: (response) => {
          console.log(response);
          this.computer = response.computer;
          this.applications = response.applications;
          // this.dialogRef.close(this.updateApplicationForm.value);
        },
        error: (error) => {
          console.error(error);
        }
      });
  }

  onSubmit(): void {
  if (this.updateApplicationForm.valid) {
    this.vulnSyncService.setLoading(true);
    document.querySelector('.app-update-form')?.classList.add('d-none');
    const updatedValues = this.updateApplicationForm.getRawValue();
    console.log(this.computer)
   if (updatedValues.installedDate && typeof updatedValues.installedDate === 'object' && updatedValues.installedDate.toISOString) {
    updatedValues.installedDate = updatedValues.installedDate.toLocaleString('sv-SE').replace(' ', 'T');
  }
    if(this.computer.lastUpdateCheck && this.computer.lastUpdateCheck?.indexOf('Z') === -1) {
       const lastUpdateCheck = `${this.computer.lastUpdateCheck}Z`;
       this.computer.lastUpdateCheck = lastUpdateCheck;
    }
       this.computer.timestamp = this.vulnSyncService.toFullIsoStringWithOffset(this.computer.timestamp);
    const { deleted,uuid, id,createdAt, updatedAt, active, ...computerData } = this.computer;
    const addUpdatedValues = this.applications.map((app: any, index:number)=> {
         if(app.id === this.data.application.id){
            app = updatedValues;
         }
         return app;
    })
    console.log(addUpdatedValues)
    const refiningInstalledSoftware = (addUpdatedValues as ApplicationData[]).map(({id, uuid, createdAt, deleted, active, updatedAt, vulnerabilities, ...rest}) => rest);
    const installedSoftwares = [...refiningInstalledSoftware];
    const updatedForm = { ...computerData, installedSoftwares};
    console.log(updatedForm)
    this.http.post<any>(`${vulnSyncEnvironments.computerCommonUrl}`, updatedForm)
      .subscribe({
        next: (response) => {
          console.log('Update success:', response);
          if(response.statusCode === 2033) {
            this.dialogRef.close(201);
          } else {
            this.dialogRef.close(200);
          }
          this.vulnSyncService.setLoading(false);
        },
        error: (error) => {
           console.error('Update error:', error);
          this.vulnSyncService.setLoading(false); 
          if(error.error.errorCode === 2109) {
          this.dialogRef.close(4001);
          console.error('Update error:', error);
          } else{
            this.dialogRef.close(206);
          }
        }
      });
  }
}

}
