import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { vulnSyncEnvironments } from '../../environments/vulnSyncEnvironments';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-view-computer-dialog',
  standalone: true,
  templateUrl: './view-computer.component.html',
  styleUrl: './computer.component.css',
  imports: [
    CommonModule
  ]
})
export class ViewComputerDialogComponent {
  computerData: any= [];
  constructor(
    public dialogRef: MatDialogRef<ViewComputerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private http: HttpClient) {};

  ngOnInit(): void {
     const computerUuid = this.data.computerUuid;
     const params = {computerUuid}
     this.http.get(vulnSyncEnvironments.getComputersByUuid, { params })
      .subscribe({
        next: (response) => {
        this.computerData = [response]; 
        console.log(this.computerData)
        this.computerData.forEach((computer: any) => {
        computer.applications = Array.isArray(computer.applications) ? computer.applications : [];
        computer.applications.forEach((application: any) => {
        application.dependencies = Array.isArray(application.dependencies) ? application.dependencies : [];
        application.dependencies.forEach((dependency: any) => {
        dependency.vulnerabilities = Array.isArray(dependency.vulnerabilities) ? dependency.vulnerabilities : [];
      });
    });
    });
      },
        error: (err) => {
          console.error('fetch error:', err);
          this.dialogRef.close(false);
        }
      });
  }  
}


