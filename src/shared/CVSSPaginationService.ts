import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";


@Injectable({ providedIn: 'root' })
export class CVSSPaginationService {
   private depPageSize:number = 10;
//    depPageSize$ = this.depPageSize.asObservable();
   private depInitialIndex:number = 0;
//    depInitialIndex$ = this.depInitialIndex.asObservable();

   private cpePageSize:number = 10;
//    cpePageSize$ = this.cpePageSize.asObservable();
   private cpeInitialIndex:number = 0;
//    cpeInitialIndex$ = this.cpeInitialIndex.asObservable();

   private vulPageSize:number = 10;
//    vulPageSize$ = this.vulPageSize.asObservable();
   private vulInitialIndex:number = 0;
//    vulInitialIndex$ = this.vulInitialIndex.asObservable();

   setDepPageSize(size:number) {
    console.log(size)
     this.depPageSize = size;
   }
   setCpePageSize(size:number) {
     this.cpePageSize = size;
   }
   setVulPageSize(size:number) {
     this.vulPageSize = size;
   }
   setDepInitialIndex(index:number) {
     this.depInitialIndex = index;
   }
   setCpeInitialIndex(index:number) {
     this.cpeInitialIndex = index;
   }
   setVulInitialIndex(index:number) {
     this.vulInitialIndex = index;
   }
   getDepPageSize(): number {
    return this.depPageSize;
  }

  getCpePageSize(): number {
    return this.cpePageSize;
  }

  getVulPageSize(): number {
    return this.vulPageSize;
  }

  getDepInitialIndex(): number {
    return this.depInitialIndex;
  }

  getCpeInitialIndex(): number {
    return this.cpeInitialIndex;
  }
  getVulInitialIndex(): number {
    return this.vulInitialIndex;
  }
}