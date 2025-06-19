import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { vulnSyncEnvironments } from '../../environments/vulnSyncEnvironments';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-view-application-dialog',
  standalone: true,
  templateUrl: './view-application.component.html',
  styleUrl: './application.component.css',
  imports: [
    CommonModule
  ]
})
export class ViewApplicationDialogComponent {
  applicationData: any= [];
  constructor(
    public dialogRef: MatDialogRef<ViewApplicationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private http: HttpClient) {};

  ngOnInit(): void {
     const applicationUuid = this.data.applicationUuid;
     const params = {applicationUuid}
     this.http.get(`${vulnSyncEnvironments.applicationCommonUrl}/${applicationUuid}`)
      .subscribe({
        next: (response) => {
        console.log('fetch success:', response);
        this.applicationData = response || {}; 
        console.log(this.applicationData)
    //     this.applicationData.forEach((application: any) => {
    //     application.dependencies = Array.isArray(application.dependencies) ? application.dependencies : [];
    //     application.dependencies.forEach((dependency: any) => {
    //     dependency.vulnerabilities = Array.isArray(dependency.vulnerabilities) ? dependency.vulnerabilities : [];
    // });
    // });
        },
        error: (err) => {
          console.error('fetch error:', err);
          this.dialogRef.close(false);
        }
      });
  }  
}


