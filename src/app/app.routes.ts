import { Routes } from '@angular/router';
import { RelatorioComponent } from './relatorio';
import { ExtratoComponent } from './extrato';
import { LoginComponent } from './login';
import { DashboardComponent } from './dashboard';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'relatorio',
    component: RelatorioComponent,
  },
  {
    path: 'extrato',
    component: ExtratoComponent,
  },
  {
    path: '',
    component: LoginComponent,
  },
];
