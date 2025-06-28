import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { vulnSyncEnvironments } from '../../environments/vulnSyncEnvironments';
import { HttpClient } from '@angular/common/http';
import { MatIcon } from '@angular/material/icon';
@Component({
  selector: 'app-view-application-dialog',
  standalone: true,
  templateUrl: './view-application.component.html',
  styleUrl: './application.component.css',
  imports: [
    CommonModule, MatIcon
  ]
})
export class ViewApplicationDialogComponent {
  applicationsData: any= [];
  applicationStatus: boolean = false;
  applicationDate: string = '';
  title: string = '';
  constructor(
    public dialogRef: MatDialogRef<ViewApplicationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private http: HttpClient) {};

  ngOnInit(): void {
     const computerUuid = this.data.computerUuid;
     const params = {status: this.data.status};
     this.applicationStatus = this.data.status;
     this.title = this.applicationStatus ? 'Uninstalled Softwares' : 'Installed Software';
     this.applicationDate = this.applicationStatus ? 'Uninstalled Date' : 'Installed Date';
     this.http.get(`${vulnSyncEnvironments.computerCommonUrl}/${ computerUuid }/applications`, { params })
      .subscribe({
        next: (response) => {
        console.log('fetch success:', response);
        this.applicationsData = response || {}; 
        console.log(this.applicationsData)
        },
        error: (err) => {
          console.error('fetch error:', err);
          this.dialogRef.close(false);
        }
      });
  }  
}


