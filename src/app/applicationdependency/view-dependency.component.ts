import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { vulnSyncEnvironments } from '../../environments/vulnSyncEnvironments';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-view-application-dialog',
  standalone: true,
  templateUrl: './view-dependency.component.html',
  styleUrl: './applicationdependency.component.css',
  imports: [
    CommonModule
  ]
})
export class ViewDependencyDialogComponent {
  dependencyData: any = [];
  constructor(
    public dialogRef: MatDialogRef<ViewDependencyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private http: HttpClient) { };

  ngOnInit(): void {
    const dependencyUuid = this.data.dependencyUuid;
    const params = { dependencyUuid }
    this.http.get(vulnSyncEnvironments.getDependencyByUuid, { params })
      .subscribe({
        next: (response) => {
          console.log('fetch success:', response);
          this.dependencyData = [response];
          console.log(this.dependencyData)
          this.dependencyData.forEach((dependency: any) => {
            dependency.vulnerabilities = Array.isArray(dependency.vulnerabilities) ? dependency.vulnerabilities : [];
          });
        },
        error: (err) => {
          console.error('fetch error:', err);
          this.dialogRef.close(false);
        }
      });
  }
}


