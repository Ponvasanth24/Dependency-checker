import { AfterViewInit, Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { vulnSyncEnvironments } from '../../environments/vulnSyncEnvironments';
import { Renderer2 } from '@angular/core';

@Component({
  selector: 'app-computer',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule],
  templateUrl: './computer.component.html',
  styleUrl: './computer.component.css'
})
export class ComputerComponent implements OnInit, OnDestroy{
  computerForm!: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';
  successInterval:any = 0;
  proggWidth = 100;
  @ViewChild('successToast') successToast!: ElementRef;
  @ViewChild('errorToast') errorToast!: ElementRef;  
  @ViewChild('succToastProgress') succToastProgress!: ElementRef; 
  private bootstrap = (window as any).bootstrap;
  constructor (private fb: FormBuilder, private http: HttpClient, private renderer: Renderer2) {
    this.computerForm = this.fb.group({
      ipAddress: ['', [Validators.required, Validators.pattern(/^(25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)){3}$/)]],
      hostName: ['', [Validators.required]],
      osName: ['', [Validators.required]],
      osVersion: ['', [Validators.required]],
      location: ['', [Validators.required]]
    })
  };

  setToastProgress(): void {
      this.successInterval = setInterval(()=>{
      this.proggWidth -= .2; 
      if(this.proggWidth <= 0){
        clearInterval(this.successInterval);
        this.proggWidth = 100;
      } 
      this.renderer.setStyle(this.succToastProgress.nativeElement, 'width', `${this.proggWidth}%`);
      }, 11);
  }

  ngOnInit(): void {
      this.http.get<any>(vulnSyncEnvironments.computerCommonUrl).subscribe({
        next:(response)=>{
          console.log(response)
        },
        error:(error)=>{
          console.log(error)
        }
      })
  }

  ngOnDestroy(): void {
      clearInterval(this.successInterval)
  }

  addComputerData() {
    this.successMessage = "Computer data added successfully";
     this.http.post<any>(vulnSyncEnvironments.computerCommonUrl, this.computerForm.value).subscribe({
      next:(response)=>{
          console.log(response);
          this.successMessage = "Computer data addedd successfully";
          if(this.successToast) {
            const toast = new this.bootstrap.Toast(this.successToast.nativeElement, {
            delay: 5000, autohide: true});
            toast.show();
            this.setToastProgress();
            this.computerForm.reset();
          } else {
            window.alert(this.successMessage);
          }
      },
      error:(error)=>{
          console.log(error);
      }
    }) 
  }
}
