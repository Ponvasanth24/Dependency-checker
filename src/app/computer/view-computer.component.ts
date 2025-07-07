import { AfterViewInit, Component, ElementRef, Inject, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
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
export class ViewComputerDialogComponent implements OnInit,AfterViewInit {
  computerData: any= [];
  isLoading: boolean = false;
  vulnerabilityData: Vulnerabilities[] = []; 
  cpeName: string = "";
  @ViewChildren('descElem') descElements!: QueryList<ElementRef>;
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

  ngAfterViewInit() {
  if(this.vulnerabilityData.length > 0) {
  setTimeout(() => {
    this.descElements.forEach((elemRef, index) => {
      const el = elemRef.nativeElement;
      const isOverflowing = el.scrollHeight > el.clientHeight;
      this.vulnerabilityData[index].isOverflowing = isOverflowing;
    });
  });
}
}

  openViewVulnerabilityDialog(applicationUuid: string) {
      this.http.get(`${vulnSyncEnvironments.getApplicationVulnerabilities}${applicationUuid}/vulnerabilities`)
      .subscribe({
        next: (response) => {
          console.log(response)
        this.vulnerabilityData = response as Vulnerabilities[] || [];
        this.cpeName = this.vulnerabilityData[0].cpeName || "";
        this.vulnerabilityData = this.vulnerabilityData.map(v => ({...v, isOverflowing: false, expanded: false})) || [];
        console.log(this.vulnerabilityData)
        this.isLoading = false;
      },
        error: (err) => {
          this.isLoading = false;
          console.error('fetch error:', err);
          this.dialogRef.close(err.error.errorCode);
        }
      });
      const dialogRef = this.dialog.open(this.vulnerabilityTable, {data: this.vulnerabilityData, width:'95vw', maxHeight: '90vh'});
      dialogRef.afterClosed().subscribe(()=>{
        this.cpeName = "";
      });
  }
  toggleDescription(index: number): void {
  this.vulnerabilityData[index].expanded = !this.vulnerabilityData[index].expanded;
}

}


