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
  installedApplicationsData: any= [];
  applicationsData : any | undefined
  applicationStatus: boolean = false;
  applicationDate: string = '';
  selectAllUninstalledApp: boolean = false;
  selectAllInstalledApp: boolean = false;
  uninstalledAppselect: boolean = false;
  installedAppselect: boolean = false;
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
        if(this.applicationStatus) {
        this.uninstalledApplicationsData = (response as any[] || []).map((app?:any)=> {
                app.select = false;
                return app;
        });
        } else{
        this.installedApplicationsData = (response as any[] || []).map((app?:any)=> {
                app.select = false;
                return app;
        });  
        }
        console.log(this.uninstalledApplicationsData)
        },
        error: (err) => {
          console.error('fetch error:', err);
          this.dialogRef.close(false);
        }
      });
        this.applicationsData = this.data.applications;
  }  

  selectAllUninstallApp() {
      this.selectAllUninstalledApp = !this.selectAllUninstalledApp;
      this.uninstalledApplicationsData = this.uninstalledApplicationsData.map((app:any)=> {
                app.select = this.selectAllUninstalledApp;
                return app;
        });
  }
  get isAnyAppSelected(): boolean {
    if(this.applicationStatus){
      return this.selectAllUninstalledApp || this.uninstalledApplicationsData.some((app:any) => app.select);
    } else{
      return this.selectAllInstalledApp || this.installedApplicationsData.some((app:any) => app.select);
    }
  }
  get isAllAppSelected(): boolean {
    if(this.applicationStatus) {
      return this.uninstalledApplicationsData.every((app: any)=> app.select);
    } else {
      return this.installedApplicationsData.every((app: any)=> app.select);
    }
  }
  selectAllInstallApp() {
      this.selectAllInstalledApp = !this.selectAllInstalledApp;
      this.installedApplicationsData = this.installedApplicationsData.map((app:any)=> {
                app.select = this.selectAllInstalledApp;
                return app;
        });
  }
  uninstallApplications() {
    if(this.computer.lastUpdateCheck && this.computer.lastUpdateCheck?.indexOf('Z') === -1) {
       const lastUpdateCheck = `${this.computer.lastUpdateCheck}Z`;
       this.computer.lastUpdateCheck = lastUpdateCheck;
    }
       const timestamp = this.toFullIsoStringWithOffset(this.computer.timestamp);
       this.computer.timestamp = timestamp;
    const { deleted,uuid, id,createdAt, updatedAt, active, ...computerData } = this.computer;
    const updatedValues = this.installedApplicationsData.filter((app: any, index:number)=> {
         if(app.select) {
            app.deleted = true;
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
    let refiningUninstalledSoftwares = (Array.from(map.values()).filter((app: any)=> {
        return app.deleted == false;
    }) as ApplicationData[]).map(({id, uuid, createdAt, deleted, active, select, updatedAt, vulnerabilities, ...rest}) => rest);
    refiningUninstalledSoftwares = [...refiningUninstalledSoftwares];
    const installedSoftwares = [...refiningUninstalledSoftwares];
    const updatedForm = { ...computerData, installedSoftwares};
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
          else {
             this.dialogRef.close(5008);
          }
        }
      });
  }
  installApplications() {
    if(this.computer.lastUpdateCheck && this.computer.lastUpdateCheck?.indexOf('Z') === -1) {
       const lastUpdateCheck = `${this.computer.lastUpdateCheck}Z`;
       this.computer.lastUpdateCheck = lastUpdateCheck;
    }
       const timestamp = this.toFullIsoStringWithOffset(this.computer.timestamp);
       this.computer.timestamp = timestamp;
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
    let refiningUninstalledSoftwares = (Array.from(map.values()).filter((app: any)=> {
        return app.deleted == false;
    }) as ApplicationData[]).map(({id, uuid, createdAt, deleted, active, select, updatedAt, vulnerabilities, ...rest}) => rest);
    refiningUninstalledSoftwares = [...refiningUninstalledSoftwares];
    const installedSoftwares = [...refiningUninstalledSoftwares];
    const updatedForm = { ...computerData, installedSoftwares};
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
          else {
             this.dialogRef.close(5008);
          }
        }
      });
  }
  toFullIsoStringWithOffset(dateStr: string): string {
  const date = new Date(dateStr);

  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);

  const pad = (num: number, size: number = 2) => num.toString().padStart(size, '0');

  const year = istDate.getFullYear();
  const month = pad(istDate.getMonth() + 1);
  const day = pad(istDate.getDate());
  const hour = pad(istDate.getHours());
  const minute = pad(istDate.getMinutes());
  const second = pad(istDate.getSeconds());
  const nanoSeconds = '4424717';

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${nanoSeconds}+05:30`;
}

}


