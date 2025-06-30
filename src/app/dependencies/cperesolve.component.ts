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
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Router } from "@angular/router";
import { AppRoutes } from "../../shared/AppRoutes";
@Component({
    selector: 'app-cperesolve',
    standalone: true,
    templateUrl: './cperesolve.component.html',
    styleUrls: ['./dependencies.component.css'],
    imports: [CommonModule, MatSelectModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, FormsModule, MatIconModule, MatDialogModule, MatTooltipModule],
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
    cpeRegex = /^cpe:\d+\.\d+:[aho\*]:[^:]+:[^:]+:[^:]*(:(\*|[^:]*)){6,9}$/;
    cpeNameError = false;
    
    @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;

    constructor(public dialogRef: MatDialogRef<CpeResolveComponent>, public cpeResolveRef: MatDialogRef<CpeResolveComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any, private vulnService: VulnerabilityService,
        private cd: ChangeDetectorRef, private dialog: MatDialog, private http: HttpClient, private snackBar: MatSnackBar,
      private router: Router) {
        this.dependencies = data.dependencies || [];
        this.updatePagedData(this.initialIndex);
        }

    ngOnInit(): void {
      this.vulnService.darkMode$.subscribe((mode: boolean) => {
      this.darkMode = mode;
    });
    this.vulnService.portNumber$.subscribe((port:number)=>{
       this.portNumber = port;
       console.log(port);
       this.saveDependencyHintEndpoint = environment.saveDependencyHint;
    });
    console.log(this.saveDependencyHintEndpoint)
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
      this.vulnService.setIsStickyNavbar(true);
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
    if(!this.cpeRegex.test(cpeName)){
       this.showFeedback('Cpe Name Not valid.');
       return;
    }
    console.log(this.saveDependencyHintEndpoint)
    const params = new HttpParams().set('cpeName', cpeName);
    this.http.post<any>(
      environment.saveDependencyHint,
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
      let resolvedCount = 0;
      let resolvedCpe = this.dependencies.map((dep: any, index: number)=> {
          if(dep.dependencyName === dependency.dependencyName) {
            console.log(dep)
            dep.cpeResolved = true;
            this.showFeedback('Cpe Name Resolved successfully!');
          }
          if(dep.cpeResolved) {
            resolvedCount += 1;
          }
          return dep;
      });
      console.log(resolvedCount, this.dependencies.length)
      sessionStorage.setItem('dependencies', JSON.stringify(depWithResolvedKey));
      this.dependencies = resolvedCpe;
      if(this.dependencies.length === resolvedCount) {
        this.vulnService.setIsStickyNavbar(false);
        this.cpeResolveRef.close();
        return;
      }
      this.updatePagedData(this.initialIndex);
      this.cd.detectChanges();
      console.log(depWithResolvedKey)
      console.log('Dependency hint added successfully:', response);
      },
      error: (err) => {
        this.showFeedback('Error occured. Hint not added');
        console.error('Subscription error (already handled by catchError):', err);
      }
    });
  }

  showManualInput(i: number): void {
    const cpeElem = document.getElementById('cpe_div' + i);
    if(cpeElem?.children.length !== 0) {
         return;
    }
    console.log('Showing manual input for CPE at index:', i);
    const manualCpeParent = document.createElement('div');
    const manualInput = document.createElement('input');
    const submitButton = document.createElement('button');
    const closeButton = document.createElement('button');
    const cpeError = document.createElement('span');
    manualCpeParent.id = `parent_${i}`;
    manualCpeParent.className = 'manual-cpe d-flex justify-content-between';
    manualInput.type = 'text';
    manualInput.placeholder = 'Enter CPE Manually';
    manualInput.className = 'form-control';
    manualInput.onkeyup = () => this.isValidCpe(manualInput.value, i);
    submitButton.innerText = 'Add';
    submitButton.onclick = () => this.addDependencyHint(manualInput.value.trim(), this.pagedDependencies[i]);
    submitButton.className = 'btn btn-danger ms-2';
    closeButton.id = `closeBtn_${i}`;
    closeButton.className = 'btn btn-close bg-light float-end mb-1';
    closeButton.onclick = () => this.hideManualInput(i);
    cpeError.className = 'cpe-error text-danger d-none';
    cpeError.innerText = 'Please enter valid CPE Name';
    cpeError.id = `cpeError_${i}`
    const cpeTable = document.getElementById('cpe_div' + i);
    console.log(cpeTable?.classList)
    cpeTable?.classList.remove('start-50');
    cpeTable?.classList.add('w-75');
    if (cpeTable?.children.length! === 0) {
      cpeTable?.appendChild(closeButton);
      manualCpeParent.appendChild(manualInput);
      manualCpeParent.appendChild(submitButton);
      cpeTable?.appendChild(manualCpeParent);
      cpeTable?.appendChild(cpeError);
      document.querySelector('.manual-cpe')?.classList.add('manual-cpe-box');
    }
    
  }

  hideManualInput(i: number): void {
    const cpeTable = document.getElementById('cpe_div' + i);
    const manualCpeParent = document.getElementById(`parent_${i}`);
    const closeBtn = document.getElementById(`closeBtn_${i}`);
    const cpeError = document.getElementById(`cpeError_${i}`);
    if (cpeTable && manualCpeParent && closeBtn) {
      cpeTable?.classList.add('start-50');
      cpeTable?.classList.remove('w-75');
      cpeTable.removeChild(closeBtn);
      cpeTable.removeChild(manualCpeParent);
      cpeTable.removeChild(cpeError!);
    }
  }

  isValidCpe(cpeName: any, index: number) {
    const cpeError = document?.getElementById(`cpeError_${index}`);
    if(!this.cpeRegex.test(cpeName)) {
      this.cpeNameError = true;
      cpeError?.classList.remove('d-none');
      cpeError?.classList.add('d-block');
    } else {
      this.cpeNameError = false;
      cpeError?.classList.add('d-none');
      cpeError?.classList.remove('d-block');
    }
  }

  private showFeedback(message: string): void {
  this.snackBar.open(message, 'Dismiss', {
    duration: 5000
  });
}

searchCpeName(cpeName: string, index: number) {
    this.vulnService.setLoading(true);
    this.http.get<any>(`${environment.baseLocaUrl}${this.portNumber}${environment.searchByCpeName}${cpeName}`).subscribe({
       next:(response)=> {
        this.vulnService.setDarkMode(this.darkMode);
        this.vulnService.setVulnerabilityData(response);
        this.vulnService.setTempVulnerability(false);
        this.cpeResolveRef.close();
        this.router.navigate([AppRoutes.VULNERABILITY_LIST]);
        this.vulnService.setLoading(false);
       },error: (error) => {
        this.snackBar.open('Unexpected Error Occured', 'Dismiss', { duration: 5000});
        this.vulnService.setLoading(false);
        console.error("Error fetching data:", error);
       }    
    
  });
  sessionStorage.setItem('selectedCpeIndex', index.toString());
}
}