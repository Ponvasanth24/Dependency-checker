import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { Component } from '@angular/core';

export const routes: Routes = [
    {
      path: '',
      component: DashboardComponent,
      children: [
        {
          path: 'dependencies',
          loadComponent: () => import('./dependencies/dependencies.component').then(m => m.DependenciesComponent)
        },
        {
          path: 'vulnerabilityList',
          loadComponent: () => import('./vulnerabilitylist/vulnerabilitylist.component').then(m => m.VulnerabilitylistComponent),
          runGuardsAndResolvers: 'always'
        }
        // {
        //   path: '',
        //   redirectTo: 'dependencies',
        //   pathMatch: 'full'
        // }
      ]
    },{
          path: 'vulnerability',
          loadComponent: () => import('./vulnerability/vulnerability.component').then(m => m.VulnerabilityComponent)
        }
  ];
