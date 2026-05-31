import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuComponent } from './menu';

interface FluxoEntry {
  fluxo_id: number;
  entrada_saida: number;
  data: string;
  valor: number;
  descricao: string;
}

@Component({
  standalone: true,
  selector: 'app-extrato',
  templateUrl: './extrato.html',
  styleUrl: './extrato.css',
  imports: [CommonModule, MenuComponent],
})
export class ExtratoComponent {
  protected readonly statusMessage = signal('');
  protected readonly fluxo = signal<FluxoEntry[]>([]);
  protected readonly filterEntradaSaida = signal('');
  protected readonly filterData = signal('');
  protected readonly filterDescricao = signal('');

  constructor() {
    this.loadFluxo();
  }

  protected formatTipo(value: number) {
    return value === 0 ? 'Entrada' : 'Saída';
  }

  protected formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  protected async loadFluxo() {
    console.log('Loading fluxo with filters:', {
      entrada_saida: this.filterEntradaSaida(),
      data: this.filterData(),
      descricao: this.filterDescricao(),
    });
    this.statusMessage.set('');

    const params = new URLSearchParams();
    if (this.filterEntradaSaida()) {
      params.set('entrada_saida', this.filterEntradaSaida());
    }
    if (this.filterData()) {
      params.set('data', this.filterData());
    }
    if (this.filterDescricao()) {
      params.set('descricao', this.filterDescricao());
    }

    try {
      const response = await fetch(`/api/fluxo?${params.toString()}`);
      const data = await response.json();

      console.log('Extrato response:', data);
      if (!response.ok) {
        this.statusMessage.set(data?.error ?? 'Falha ao carregar o extrato.');
        return;
      }

      console.log('Fluxo data:', data);
      this.fluxo.set(data.fluxo ?? []);
      this.statusMessage.set('');
    } catch (error) {
      console.error(error);
      this.statusMessage.set('Erro ao conectar com o servidor.');
    }
  }

  protected async applyFilters() {
    await this.loadFluxo();
  }

  protected formatValor(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
