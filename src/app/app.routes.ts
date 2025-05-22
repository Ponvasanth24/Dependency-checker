import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { Component } from '@angular/core';

export const routes: Routes = [
    {
      path: '',
      component: DashboardComponent,
      children: [
        {
          path:'',
          loadComponent: () => import('./dashboardcontent/dashboardcontent.component').then(m => m.DashboardcontentComponent)
        },
        {
          path: 'dependencies',
          loadComponent: () => import('./dependencies/dependencies.component').then(m => m.DependenciesComponent)
        },
        {
          path: 'vulnerabilityList',
          loadComponent: () => import('./vulnerabilitylist/vulnerabilitylist.component').then(m => m.VulnerabilitylistComponent)
        },
        {
          path: 'cpeSearchResults',
          loadComponent: () => import('./cpesearch/cpesearch.component').then(m => m.CpesearchComponent)
        }
      ]
      },{
          path: 'vulnerability/:id',
          loadComponent: () => import('./vulnerability/vulnerability.component').then(m => m.VulnerabilityComponent)
      },
      {
        path: 'vulnerabilitySync',
        loadComponent: () => import('./vulnerabilitysyncdashboard/vulnerabilitysyncdashboard.component').then(m => m.VulnerabilitysyncdashboardComponent),
        children:[{
          path:'computer',
          loadComponent:()=> import('./computer/computer.component').then(m => m.ComputerComponent)
        }]
      }
  ];
