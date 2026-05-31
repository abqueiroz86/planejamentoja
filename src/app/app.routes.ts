import { Routes } from '@angular/router';
import { RelatorioComponent } from './relatorio';
import { ExtratoComponent } from './extrato';
import { LoginComponent } from './login';

export const routes: Routes = [
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
