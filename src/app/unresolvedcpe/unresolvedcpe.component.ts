import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { storedApplications } from '../../vulnSyncModels/ComputerData';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatLabel, MatOption, MatSelect, MatSelectChange } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { vulnSyncEnvironments } from '../../environments/vulnSyncEnvironments';
import { HttpClient } from '@angular/common/http';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VulnerabilitysyncdashboardComponent } from '../vulnerabilitysyncdashboard/vulnerabilitysyncdashboard.component';
import { ActivatedRoute } from '@angular/router';
import { VulnerabilitySyncService } from '../../shared/VulnerabilitySyncService';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-unresolvedcpe',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatLabel, MatSelect, FormsModule, MatOptionModule,
    MatProgressSpinnerModule, MatTooltipModule, MatDialogModule
  ],
  templateUrl: './unresolvedcpe.component.html',
  styleUrl: './unresolvedcpe.component.css'
})
export class UnresolvedcpeComponent implements OnInit{
     storedApplicationData: any[] = [];
     expandedElement: any | null = null;
     likelyCpeNames: any[] = [];
     pagedApplicationData!: any[];
     pageSize: number = 5;
     pageIndex: number = 0;
     initialIndex: number = 0;
     currentPageSize: number = this.pageSize;
     totalPages: number = 0;
     isLoading: boolean = false;
     pageSizes: Array<number> = [];
     start: number = 0;
     end: number = 0;
     cpeName: string = "";
     computerUuid: string | null = null;
     displayedColumns: string[] = ['name', 'version', 'vendor', 'installedDate', 'createdAt','status' ,'action'];
     expandedColumns: string[] = [...this.displayedColumns, 'expandedDetail'];
     sortActive = '';
     sortDirection: 'asc' | 'desc' = 'asc';
     @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;
     dialogRef!: MatDialogRef<any> 
    
     likelyCpeRegex = /^cpe:\d+\.\d+:[aho\*]:[^:]+:[^:]+:[^:]+(?::[^:]*){0,7}$/
     constructor(private cd: ChangeDetectorRef, private http: HttpClient, private vulnSyncDash: VulnerabilitysyncdashboardComponent,
         private router: ActivatedRoute, private vulnSyncService: VulnerabilitySyncService, private dialog: MatDialog
     ){}

     ngOnInit(): void {
       this.vulnSyncService.setLoading(true);
       this.router.paramMap.subscribe((params) => {
          console.log(params.get('computerUuid'))
          this.computerUuid = params.get('computerUuid');
          this.viewUnresolvedCpe();
       })
     }

    onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;  
    this.pageSize = Number(target.value);
    this.pageIndex = 0;
    this.updatePagedData(this.initialIndex);
  }

  updatePagedData(initialIndex: number): void {
  this.pageIndex = initialIndex;
  const totalItems = this.storedApplicationData?.length || 0;
  this.totalPages = Math.ceil(totalItems / this.pageSize);
  this.start = initialIndex * this.pageSize;
  this.end = this.start + this.pageSize;

  this.pageSizes = totalItems >= 100 ? [5, 10, 25, 50, 100] :
    totalItems >= 50 ? [10, 25, 50] :
    totalItems >= 25 ? [10, 25] :
    totalItems >= 10 ? [10] : [5];

  let sortedData = [...this.storedApplicationData];

  if (this.sortActive) {
    sortedData.sort((a, b) => {
      let aValue = (a as any)[this.sortActive];
      let bValue = (b as any)[this.sortActive];

      if (this.sortActive === 'installedDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  this.pagedApplicationData = sortedData.slice(this.start, this.end);
  console.log(sortedData)
}
    nextPage(): void {
    if (this.pageIndex < this.totalPages - 1) {
      this.pageIndex++;
      this.updatePagedData(this.pageIndex);
      this.cd.detectChanges();
    }
  }

  previousPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.updatePagedData(this.pageIndex);
      this.cd.detectChanges();
    }
  }

  viewUnresolvedCpe() {
     let url = vulnSyncEnvironments.viewUnresolvedPageUrl;
     console.log(this.computerUuid)
     if(this.computerUuid) {
       url += `/${this.computerUuid}`;
       console.log(url)
     }
      this.http.get<any>(url).subscribe({
        next:(response)=>{
             console.log(response);
             this.storedApplicationData = response.map((app: any)=> { return {...app, cpeResolved: false, cpeHint: "", collapse: false, likelyCpeData:[]}}) || [];
             this.updatePagedData(this.pageIndex);
             this.vulnSyncService.setLoading(false);
        },
        error:(error)=>{
             console.log(error);
             this.vulnSyncService.setLoading(false);
        }
      });
  }

showLikelyCpeNames(vendor: string, product: string, version: string, application: any): void {
    if(application.collapse) {
      application.collapse = false;
      return;
    } else {
       application.collapse = true;
    }
    const params = { vendor: vendor, product: product, version: "" };
    this.http.get<any[]>(vulnSyncEnvironments.getLikelyCpeNames, { params }).subscribe({
      next: (response) => {
        console.log(response)
        application.likelyCpeData = response;
      },
      error: (err) => {
        console.error('Error fetching likely CPE names:', err);
      }
    });
}

async addDependencyHint(cpeName: string, application: any){
     this.cpeName = cpeName;
     this.dialogRef = this.dialog.open(this.confirmDialog);
     const confirm = await firstValueFrom(this.dialogRef.afterClosed());
     if(!confirm) return;
     if(!this.likelyCpeRegex.test(cpeName)){
        this.vulnSyncDash.showToast("CPE Name Not Valid",'error');
        return;
     }
     this.vulnSyncService.setLoading(true);
     const params = {cpeName: cpeName}
     const applicationModal = {applicationUuid: application.uuid, applicationName: application.softwareName, applicationVersion: application.softwareVersion, applicationVendor: application.vendorName, isExists:false};
     console.log(applicationModal)
     if(!application.cpeResolved){
     this.http.post<any[]>(vulnSyncEnvironments.addCpeHintUrl, applicationModal,{params}).subscribe({
      next: (response) => {
        console.log(response);
        application.cpeResolved = true;
        this.vulnSyncService.setLoading(false);
        this.vulnSyncDash.showToast("Hint Added Successfully",'success');
      },
      error: (err) => {
        console.error('Error add hint:', err);
        this.vulnSyncService.setLoading(false);
        this.vulnSyncDash.showToast("Hint Added failed",'error');
      }
    }) 
   }
   }
}
