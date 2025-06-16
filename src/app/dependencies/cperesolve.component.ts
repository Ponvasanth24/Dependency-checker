import { AfterViewInit, Component, ElementRef, Inject, OnInit, TemplateRef, ViewChild, ViewChildren } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ViewEncapsulation } from "@angular/core";
import { CommonModule, JsonPipe } from "@angular/common";
import { VulnerabilityService } from "../../shared/VulnerabilityService";
import { MatSelectChange, MatSelectModule } from "@angular/material/select";
import { ChangeDetectorRef } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";
import { HttpParams, HttpClient, HttpErrorResponse } from "@angular/common/http";
import { LikelyCPE } from "../../CVSS_Models/CvssModels";
import { environment } from "../../environments/environments";
import { MatDialogModule } from '@angular/material/dialog';

@Component({
    selector: 'app-cperesolve',
    standalone: true,
    templateUrl: './cperesolve.component.html',
    styleUrls: ['./dependencies.component.css'],
    imports: [CommonModule, MatSelectModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, FormsModule, MatIconModule, MatDialogModule],
    encapsulation: ViewEncapsulation.None
})

export class CpeResolveComponent implements OnInit, AfterViewInit {
    dependencies: any[] = [];
    pagedDependencies: any[] = []
    resolvedCpe: string = '';
    darkMode: boolean = false;
    pageIndex:number = 0;
    pageSize:number = 5;
    initialIndex:number = 0;
    currentPageSize:number = this.pageSize;
    totalPages:number = 0;
    pageSizes:Array<number> = [5];
    start:number = 0;
    end:number = 0;
    baseUrl: string = '';
    portNumber: number = 8080;
    saveDependencyHintEndpoint: string = '';

    @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;

    constructor(public dialogRef: MatDialogRef<CpeResolveComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any, private vulnService: VulnerabilityService,
            private cd: ChangeDetectorRef, private dialog: MatDialog, private http: HttpClient) {
        this.dependencies = data.dependencies || [];
        console.log(data)
        this.updatePagedData(this.initialIndex);
        this.baseUrl = `${environment.baseLocaUrl}${this.portNumber}`;
        this.saveDependencyHintEndpoint = `${this.baseUrl}${environment.saveDependencyHint}`;
          }

    ngOnInit(): void {
      this.vulnService.darkMode$.subscribe((mode: boolean) => {
      this.darkMode = mode;
    });
    this.vulnService.portNumber$.subscribe((portNumber:number)=>{
       this.portNumber = portNumber;
    });
     const deps = sessionStorage.getItem('dependencies');
        const depsFromSession = deps ? JSON.parse(deps) : [];
        let dependenciesFromService:any[] = [];
        this.vulnService.dependencies$.subscribe((dependencies:any[]) => {
        dependenciesFromService = dependencies;
      });
      let dependencies = depsFromSession.length > 0 ? depsFromSession : dependenciesFromService.length > 0 ? dependenciesFromService : [];
      let depWithResolvedKey = dependencies.map((dep: any, index: number)=> {
               if(!('cpeResolved' in dep)) {
                dep = {...dep, cpeResolved: false}
               } else {
                dep = {...dep}
               }
               return dep;
      })  
      sessionStorage.setItem('dependencies', JSON.stringify(depWithResolvedKey));
      console.log(depWithResolvedKey);
    }

    ngAfterViewInit(): void {
    }

     nextPage(): void {
    if(this.pageIndex >= 0 && this.pageIndex <= this.totalPages && this.pageIndex !== this.totalPages - 1) {
    this.pageIndex++;
    this.initialIndex = this.pageIndex;
    this.start = this.pageIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pagedDependencies = this.dependencies.slice(this.start, this.end);
    this.cd.detectChanges();
    }
   }
   previousPage(): void {
    if(this.pageIndex > 0) {
      this.pageIndex--;
      this.initialIndex = this.pageIndex;
      this.start = this.pageIndex * this.pageSize;
      this.end = this.start + this.pageSize;
      this.pagedDependencies = this.dependencies.slice(this.start, this.end);
      this.cd.detectChanges();
    }
   }
  
   updatePagedData(initialIndex: number): void {
    let pages = Math.ceil(this.dependencies.length / this.pageSize);
    this.totalPages = pages;
    this.start = initialIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pagedDependencies = this.dependencies.slice(this.start, this.end);
   }
   onPageSizeChange(event: MatSelectChange): void {
    this.pageSize = event.value;
    this.pageIndex = 0;
    this.updatePagedData(this.pageIndex);
   }

  async addDependencyHint(cpeName: string, dependency: any): Promise<void> {
    console.log('Adding dependency hint for CPE:', dependency);
    this.dialogRef = this.dialog.open(this.confirmDialog);
      const confirmed = await firstValueFrom(this.dialogRef.afterClosed());
      if (!confirmed) return;
    const params = new HttpParams().set('cpeName', cpeName);
    this.http.post<any>(
      this.saveDependencyHintEndpoint,
      dependency,       
      { params: params }     
    ).subscribe({
      next: (response) => {
      const deps = sessionStorage.getItem('dependencies');
      const depsFromSession = deps ? JSON.parse(deps) : [];
      let depWithResolvedKey = depsFromSession.map((dep: any, index: number)=> {
          if(dep.dependencyName === dependency.dependencyName) {
            console.log(dep)
            dep.cpeResolved = true;
          }
          return dep;
      });
      let resolvedCpe = this.dependencies.map((dep: any, index: number)=> {
          if(dep.dependencyName === dependency.dependencyName) {
            console.log(dep)
            dep.cpeResolved = true;
          }
          return dep;
      });
      sessionStorage.setItem('dependencies', JSON.stringify(depWithResolvedKey));
      this.dependencies = resolvedCpe;
      this.updatePagedData(this.initialIndex);
      this.cd.detectChanges();
      console.log(depWithResolvedKey)
      console.log('Dependency hint added successfully:', response);
      },
      error: (err) => {
        console.error('Subscription error (already handled by catchError):', err);
      }
    });
  }

  showManualInput(i: number): void {
    console.log('Showing manual input for CPE at index:', i);
    const manualCpeParent = document.createElement('div');
    const manualInput = document.createElement('input');
    const submitButton = document.createElement('button');
    manualCpeParent.id = `parent_${i}`;
    manualCpeParent.className = 'manual-cpe d-flex justify-content-between';
    manualInput.type = 'text';
    manualInput.placeholder = 'Enter CPE Manually';
    manualInput.className = 'form-control';
    submitButton.innerText = 'Submit';
    submitButton.onclick = () => this.addDependencyHint(manualInput.value.trim(), this.pagedDependencies[i]);
    submitButton.className = 'btn btn-danger ms-2';

    const cpeTable = document.getElementById('cpe_div' + i);
    console.log(cpeTable?.classList)
    cpeTable?.classList.remove('start-50');
    cpeTable?.classList.add('w-75');
    if (cpeTable) {
      manualCpeParent.appendChild(manualInput);
      manualCpeParent.appendChild(submitButton);

      cpeTable.appendChild(manualCpeParent);
      document.querySelector('.manual-cpe')?.classList.add('manual-cpe-box');
    }
  }

  hideManualInput(i: number): void {
    const cpeTable = document.getElementById('cpe_div' + i);
    const manualCpeParent = document.getElementById(`parent_${i}`);
    if (cpeTable && manualCpeParent) {
      cpeTable?.classList.add('start-50');
      cpeTable?.classList.remove('w-75');
      cpeTable.removeChild(manualCpeParent);
    }
  }
}