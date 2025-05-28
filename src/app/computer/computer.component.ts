import { TemplateRef, Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, Inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { vulnSyncEnvironments } from '../../environments/vulnSyncEnvironments';
import { Renderer2 } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { ChangeDetectorRef } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar} from '@angular/material/snack-bar';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';


@Component({
  selector: 'app-computer',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatSelectModule,
    FormsModule, MatIconModule, MatDialogModule, MatTableModule
  ],
  templateUrl: './computer.component.html',
  styleUrl: './computer.component.css'
})
export class ComputerComponent implements OnInit, OnDestroy{
  computerForm!: FormGroup;
  updateComputerForm!: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';
  successInterval:any = 0;
  proggWidth = 100;
  storedComputerData:any = [];
  pageIndex:number = 0;
  pageSize:number = 10;
  initialIndex:number = 0;
  currentPageSize:number = this.pageSize;
  totalPages:number = 0;
  pageSizes:Array<number> = [];
  start:number = 0;
  end:number = 0;
  pagedComputerData: any[] = [];
  selectedComputerId: number | null = null;
  @ViewChild('successToast') successToast!: ElementRef;
  @ViewChild('errorToast') errorToast!: ElementRef;  
  @ViewChild('succToastProgress') succToastProgress!: ElementRef; 
  @ViewChild('updateDialog') updateDialog!: TemplateRef<any>;
  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;
  dialogRef!: MatDialogRef<any>;
  displayedColumns: string[] = [
  'ipAddress',
  'hostname',
  'osName',
  'osVersion',
  'location',
  'createdAt',
  'updatedAt',
  'status',
  'action'
];

  private bootstrap = (window as any).bootstrap;
  snackBar: MatSnackBar;
  constructor (private fb: FormBuilder, private http: HttpClient, private renderer: Renderer2, private cd: ChangeDetectorRef, private destroyRef: DestroyRef,
    private dialog: MatDialog, snackBar: MatSnackBar, private router: Router,
  ) {
    this.snackBar = snackBar;
    this.computerForm = this.fb.group({
      ipAddress: ['', [Validators.required, Validators.pattern(/^(25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)){3}$/)]],
      hostName: ['', [Validators.required]],
      osName: ['', [Validators.required]],
      osVersion: ['', [Validators.required]],
      location: ['', [Validators.required]]
    });
    this.updateComputerForm = this.fb.group({
      ipAddress: ['', [Validators.required, Validators.pattern(/^(25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)){3}$/)]],
      hostName: ['', [Validators.required]],
      osName: ['', [Validators.required]],
      osVersion: ['', [Validators.required]],
      location: ['', [Validators.required]]
    })
  };

  ngOnInit(): void {
      this.fetchComputerData();
  }
  fetchComputerData() {
      this.http.get<any>(vulnSyncEnvironments.computerCommonUrl).subscribe({
        next:(response)=>{
          this.storedComputerData = response;
          this.updatePagedData(this.initialIndex);
        },
        error:(error)=>{
          console.log(error)
        }
      });
  }

  ngOnDestroy(): void {
      clearInterval(this.successInterval)
  }

  addComputerData() {
    if (this.computerForm.invalid) {
      this.showToast("Make sure all fields are completed correctly", 'error');
      return;
    }
     this.http.post<any>(vulnSyncEnvironments.computerCommonUrl, this.computerForm.value).subscribe({
      next:(response)=>{
          console.log(response);
          let successMessage = "Computer data added successfully";
          this.computerForm.reset();
          this.showToast(successMessage, 'success');
          this.fetchComputerData();
      },
      error:(error)=>{
        let errorMessage = "Make sure all fields are filled correctly";
        this.showToast(errorMessage, 'error');
        console.log(error);
      }
    }); 
  }
  showToast(message: string, type: 'success' | 'error'): void {
    if (type === 'success') {
      this.successMessage = message;
      if(this.successToast) {
        const toast = new this.bootstrap.Toast(this.successToast.nativeElement, {
          delay: 4000, autohide: true});
        toast.show();
      } else {
        window.alert(this.successMessage);
      }
    } else if (type === 'error') {
      this.errorMessage = message;
      if(this.errorToast) {
        const toast = new this.bootstrap.Toast(this.errorToast.nativeElement, {
          delay: 4000, autohide: true});
        toast.show();
      } else {
        window.alert(this.errorMessage);
      }
    }
    
  }
  nextPage(): void {
    if(this.pageIndex >= 0 && this.pageIndex <= this.totalPages && this.pageIndex !== this.totalPages - 1) {
    this.pageIndex++;
    this.start = this.pageIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pagedComputerData = this.storedComputerData.slice(this.start, this.end);
    console.log(this.pagedComputerData, this.start, this.end);
    this.cd.detectChanges();
    }
   }
   previousPage(): void {
    if(this.pageIndex > 0) {
      this.pageIndex--;
      this.start = this.pageIndex * this.pageSize;
      this.end = this.start + this.pageSize;
      this.pagedComputerData = this.storedComputerData.slice(this.start, this.end);
      this.cd.detectChanges();
    }
   }
  onPageSizeChange(event: MatSelectChange): void {
     this.pageSize = event.value;
     this.pageIndex = 0;
     this.updatePagedData(this.initialIndex);
  }
  updatePagedData(initialIndex: number): void {
    let totalItems = this.storedComputerData.length;
    let pages = Math.ceil(totalItems / this.pageSize);
    this.totalPages = pages;
    this.start = initialIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pageSizes = totalItems >= 100 ? [10, 25, 50, 100] : totalItems <= 100 && totalItems >= 50 ? [10, 25, 50] : 
    totalItems <= 50 && totalItems >= 25 ? [10, 25] : totalItems <= 25 && totalItems >= 10 ? [10] : [5];
    this.pagedComputerData = this.storedComputerData.slice(this.start, this.end);
   }

  openUpdateDialog(computer: any): void {
    this.selectedComputerId = computer.id; 
    this.updateComputerForm.patchValue(computer); 
    this.dialog.open(this.updateDialog, {
      width: '700px',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-dialog-backdrop',
      disableClose: false,  
      data: { dialogRef: this.updateDialog }
    });
  }

  updateComputerData(dialogRef: any): void {
    if (!this.updateComputerForm.valid || !this.selectedComputerId) return;
    const params = { computerId: this.selectedComputerId };
    this.http.put(`${vulnSyncEnvironments.computerCommonUrl}`, this.updateComputerForm.value, { params })
      .subscribe({
        next: (res) => {
          console.log('Update success:', res);
          dialogRef.close();
          let successMessage = "Computer data updated successfully";
          this.showToast(successMessage, 'success');
          this.fetchComputerData();
        },
        error: (err) => {
          let errorMessage = "Make sure all fields are filled correctly";
          this.showToast(errorMessage, 'error');
          console.error('Update error:', err);    
        }
      });
  }
  async deleteComputerData(computerId: number): Promise<void> {
    this.dialogRef = this.dialog.open(this.confirmDialog);
    const confirmed = await firstValueFrom(this.dialogRef.afterClosed());
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.delete(`${vulnSyncEnvironments.computerCommonUrl}`, {
          params: { computerId: computerId.toString() }
        })
      ).then((res) => {
        this.fetchComputerData();
        let successMessage = "Computer data deleted successfully";
        this.showToast(successMessage, 'success');
      });
      console.log('Computer data deleted.');
    } catch (error) {
      console.error('Error deleting computer data:', error);
    }
  }
  addApplication(computerId: number): void {
  this.router.navigate(['/vulnerabilitySync/application', computerId]);
  }

}
