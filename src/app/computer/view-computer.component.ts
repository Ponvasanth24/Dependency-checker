import { AfterViewInit, Component, ElementRef, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { vulnSyncEnvironments } from '../../environments/vulnSyncEnvironments';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Renderer2 } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-view-computer-dialog',
  standalone: true,
  templateUrl: './view-computer.component.html',
  styleUrl: './computer.component.css',
  imports: [
    CommonModule, MatProgressSpinnerModule, MatTooltipModule
  ]
})
export class ViewComputerDialogComponent implements OnInit {
  computerData: any= [];
  isLoading: boolean = false;
   @ViewChild('vulnerabilityData', { read: TemplateRef }) vulnerabilityData!: TemplateRef<any>;
  constructor(
    public dialogRef: MatDialogRef<ViewComputerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private http: HttpClient, private renderer: Renderer2, 
    private dialog: MatDialog) {};
 
  ngOnInit(): void {
     this.isLoading = true;
     const computerUuid = this.data.computerUuid;
     const params = {computerUuid}
     this.http.get(`${vulnSyncEnvironments.computerCommonUrl}/${computerUuid}`)
      .subscribe({
        next: (response) => {
        this.computerData = response || {}; 
        console.log(this.computerData)
      //   this.computerData.forEach((computer: any) => {
      //   computer.applications = Array.isArray(computer.applications) ? computer.applications : [];
      //   computer.applications.forEach((application: any) => {
      //   application.dependencies = Array.isArray(application.dependencies) ? application.dependencies : [];
      //   application.dependencies.forEach((dependency: any) => {
      //   dependency.vulnerabilities = Array.isArray(dependency.vulnerabilities) ? dependency.vulnerabilities : [];
      // });
      // });
      // });
    this.isLoading = false;
      },
        error: (err) => {
          this.isLoading = false;
          console.error('fetch error:', err);
          this.dialogRef.close(err.error.errorCode);
        }
      });
  } 

  openViewApplicationDialog(applicationUuid: string) {
      this.dialog.open(this.vulnerabilityData, {data: {}, width:'90vw', maxHeight: '90vh'},

      );
  }
}


