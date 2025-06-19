import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VulnerabilityService } from '../../../shared/VulnerabilityService';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-scan-file',
  imports: [CommonModule, FormsModule],
  templateUrl: './scan-file.component.html',
  styleUrl: './scan-file.component.css'
})
export class ScanFileComponent implements OnInit{
  portNumber: number = 8080;

  constructor(private vulnService: VulnerabilityService) {}
      
  ngOnInit(): void {
    this.vulnService.setIsStickyNavbar(true);
  }

  startScan() {
    
  }
}
