import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { vulnSyncEnvironments } from '../../environments/vulnSyncEnvironments';
import { HttpClient } from '@angular/common/http';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Application, storedComputer,  } from '../../vulnSyncModels/ComputerData';
import { VulnerabilitySyncService } from '../../shared/VulnerabilitySyncService';

interface ApplicationData {
  id: number;
  uuid: string;
  name: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  active: boolean;
  select?: boolean;
  vulnerabilities: any[];
  [key: string]: any;
}
@Component({
  selector: 'app-view-application-dialog',
  standalone: true,
  templateUrl: './view-application.component.html',
  styleUrl: './application.component.css',
  imports: [
    CommonModule, MatIcon, FormsModule, MatCheckboxModule,MatTooltipModule
  ],
  encapsulation: ViewEncapsulation.None
})
export class ViewApplicationDialogComponent {
  computer!: storedComputer;
  uninstalledApplicationsData: any= [];
  applicationsData : any | undefined
  applicationStatus: boolean = false;
  applicationDate: string = '';
  selectAllUninstalledApp: boolean = false;
  uninstalledAppselect: boolean = false;
  title: string = '';
  constructor(
    public dialogRef: MatDialogRef<ViewApplicationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private http: HttpClient, private vulnSyncService: VulnerabilitySyncService) {};

  ngOnInit(): void {
     this.computer = this.data.computer;
     console.log(this.computer)
     const computerUuid = this.computer.uuid;
     const params = {status: this.data.status};
     this.applicationStatus = this.data.status;
     this.title = this.applicationStatus ? 'Uninstalled Softwares' : 'Installed Software';
     this.applicationDate = this.applicationStatus ? 'Uninstalled Date' : 'Installed Date';
     this.http.get(`${vulnSyncEnvironments.computerCommonUrl}/${ computerUuid }/applications`, { params })
      .subscribe({
        next: (response) => {
        console.log('fetch success:', response);
        this.uninstalledApplicationsData = (response as any[] || []).map((app?:any)=> {
                app.select = false;
                return app;
        });
        console.log(this.uninstalledApplicationsData)
        },
        error: (err) => {
          console.error('fetch error:', err);
          this.dialogRef.close(false);
        }
      });
        this.applicationsData = this.data.applications;
  }  

  selectAll() {
      this.selectAllUninstalledApp = !this.selectAllUninstalledApp;
      this.uninstalledApplicationsData = this.uninstalledApplicationsData.map((app:any)=> {
                app.select = this.selectAllUninstalledApp;
                return app;
        });
  }
  get isAnyAppSelected(): boolean {
      return this.selectAllUninstalledApp || this.uninstalledApplicationsData.some((app:any) => app.select);
  }
  get isAllAppSelected(): boolean {
      return this.uninstalledApplicationsData.every((app: any)=> app.select);
  }
  reInstallApplications() {
    if(this.computer.timestamp.indexOf('Z') === -1 || this.computer.lastUpdateCheck.indexOf('Z') === -1) {
       const lastUpdateCheck = this.computer.lastUpdateCheck.concat('Z');
       const timestamp = this.computer.timestamp.concat('Z');
       this.computer.timestamp = timestamp;
       this.computer.lastUpdateCheck = lastUpdateCheck;
    }
    const { deleted,uuid, id,createdAt, updatedAt, active, ...computerData } = this.computer;
    const updatedValues = this.uninstalledApplicationsData.filter((app: any, index:number)=> {
         if(app.select) {
            app.deleted = false;
            return app;
         }  
    });
    console.log(updatedValues)
    const map = new Map<string, any>();
    let combineApplications = [...this.applicationsData, ...updatedValues];
    console.log(combineApplications);

    combineApplications.forEach((app: any)=>{
      map.set(app.uuid, app);
    });
    console.log(Array.from(map.values()))
    let refiningUninstalledSoftware = (Array.from(map.values()).filter((app: any)=> {
        return app.deleted == false;
    }) as ApplicationData[]).map(({id, uuid, createdAt, deleted, active, select, updatedAt, vulnerabilities, ...rest}) => rest);
    refiningUninstalledSoftware = [...refiningUninstalledSoftware];
    const installedSoftware = [...refiningUninstalledSoftware];
    const updatedForm = { ...computerData, installedSoftware};
    console.log(updatedForm);
    this.http.post<any>(`${vulnSyncEnvironments.computerCommonUrl}`, updatedForm)
      .subscribe({
        next: (response) => {
          console.log('add installed list success:', response);
          if(response.statusCode === 2033) {
            this.dialogRef.close(201);
          } else {
            this.dialogRef.close(200);
          }
          this.vulnSyncService.setLoading(false);
        },
        error: (error) => {
           console.error('save error:', error);
          this.vulnSyncService.setLoading(false); 
          if(error.error.errorCode === 2109) {
          this.dialogRef.close(4001);
          console.error('save error:', error);
          }
        }
      });
  }
}


