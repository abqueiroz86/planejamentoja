import { Routes } from '@angular/router';
import { RelatorioComponent } from './relatorio';
import { ExtratoComponent } from './extrato';

export const routes: Routes = [
  {
    path: 'relatorio',
    component: RelatorioComponent,
  },
  {
    path: '',
    component: ExtratoComponent,
  },
];
