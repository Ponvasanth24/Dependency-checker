import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-unresolvedcpe',
  imports: [CommonModule, MatTableModule, MatIconModule, MatLabel, MatSelect, FormsModule, MatOptionModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './unresolvedcpe.component.html',
  styleUrl: './unresolvedcpe.component.css'
})
export class UnresolvedcpeComponent implements OnInit{
     storedApplicationData: any[] = [];
     pagedApplicationData!: MatTableDataSource<any>;
     pageSize: number = 5;
     pageIndex: number = 0;
     initialIndex: number = 0;
     currentPageSize: number = this.pageSize;
     totalPages: number = 0;
     isLoading: boolean = false;
     pageSizes: Array<number> = [];
     start: number = 0;
     end: number = 0;
     displayedColumns: string[] = ['name', 'version', 'vendor', 'installedDate', 'createdAt','status' ,'action'];
     sortActive = '';
     sortDirection: 'asc' | 'desc' = 'asc';

     constructor(private cd: ChangeDetectorRef, private http: HttpClient){}

     ngOnInit(): void {
       this.viewUnresolvedCpe();
     }

    onPageSizeChange(event: MatSelectChange): void {
    this.pageSize = event.value;
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

  this.pagedApplicationData = new MatTableDataSource(sortedData.slice(this.start, this.end));
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
      console.log("cl")
      this.http.get<any>(vulnSyncEnvironments.viewUnresolvedPageUrl).subscribe({
        next:(response)=>{
             console.log(response);
             this.storedApplicationData = response || [];
             this.updatePagedData(this.pageIndex);
        },
        error:(error)=>{
             console.log(error);
        }
      })
    }
}
