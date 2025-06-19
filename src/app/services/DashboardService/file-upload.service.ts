import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  private readonly BASE_URL = 'http://localhost:8080';

  constructor() {}

  uploadPomFile(file: File, onMessage: (msg: string) => void, onError?: () => void): void {
    
  }

  uploadPackageFile(
    jsonFile?: File,
    lockFile?: File,
    onMessage?: (msg: string) => void,
    onError?: () => void
  ): void {
    
  }

  private startSSE(
    url: string,
    body: FormData,
    onMessage?: (msg: string) => void,
    onError?: () => void
  ): void {
    console.log(onMessage)
  }

  
}
