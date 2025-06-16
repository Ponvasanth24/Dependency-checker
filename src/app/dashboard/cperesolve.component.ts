import { Component, Inject } from "@angular/core";
import {MatDialog ,MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";

@Component({
    selector: 'app-cperesolve',
    standalone: true,
    templateUrl: './cperesolve.component.html',
    styleUrls: ['./dashboard.component.css'],
    imports: [],
    encapsulation: ViewEncapsulation.None
})

export class CpeResolveComponent {
    cpe: any[] = [];
    resolvedCpe: string = '';
    constructor(public dialogRef: MatDialogRef<CpeResolveComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any, private dialog: MatDialog, private router: Router) {
        this.cpe = data.cpe;
    }

    resolveCpe(): void {
        if (this.cpe) {
            
        } else {
            this.resolvedCpe = '';
        }
    }
}