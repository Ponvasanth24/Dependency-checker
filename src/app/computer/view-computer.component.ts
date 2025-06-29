import { AfterViewInit, Component, ElementRef, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { vulnSyncEnvironments } from '../../environments/vulnSyncEnvironments';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Renderer2 } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Vulnerabilities } from '../../vulnSyncModels/ComputerData';
import { MatIcon } from '@angular/material/icon';
MatDialogContent
@Component({
  selector: 'app-view-computer-dialog',
  standalone: true,
  templateUrl: './view-computer.component.html',
  styleUrl: './computer.component.css',
  imports: [
    CommonModule, MatProgressSpinnerModule, MatTooltipModule, MatIcon, MatDialogContent
  ]
})
export class ViewComputerDialogComponent implements OnInit {
  computerData: any= [];
  isLoading: boolean = false;
  vulnerabilityData: Vulnerabilities[] = []; 
  @ViewChild('vulnerabilityTable', { read: TemplateRef }) vulnerabilityTable!: TemplateRef<any>;
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
      this.http.get(`${vulnSyncEnvironments.getApplicationVulnerabilities}${applicationUuid}`)
      .subscribe({
        next: (response) => {
        this.vulnerabilityData = response as Vulnerabilities[] || {}; 
        console.log(this.vulnerabilityData)
    this.isLoading = false;
      },
        error: (err) => {
          this.isLoading = false;
          console.error('fetch error:', err);
          this.dialogRef.close(err.error.errorCode);
        }
      });
      this.dialog.open(this.vulnerabilityTable, {data: this.vulnerabilityData, width:'90vw', maxHeight: '90vh'});
  }
}


