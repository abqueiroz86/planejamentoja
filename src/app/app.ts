import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FluxoEntry {
  fluxo_id: number;
  entrada_saida: number;
  data: string;
  valor: number;
  descricao: string;
}

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [CommonModule],
})
export class App {
  protected readonly title = signal('Planejamento Já!');
  protected readonly statusMessage = signal('');
  protected readonly loggedIn = signal(false);
  protected readonly email = signal('');
  protected readonly fluxo = signal<FluxoEntry[]>([]);
  protected readonly filterEntradaSaida = signal('');
  protected readonly filterData = signal('');
  protected readonly filterDescricao = signal('');

  protected async login(event: Event, email: string, password: string) {
    event.preventDefault();
    this.statusMessage.set('');

    if (!email || !password) {
      this.statusMessage.set('Preencha email e senha.');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.statusMessage.set(data?.error ?? 'Falha ao autenticar.');
        return;
      }

      this.email.set(data.email);
      this.loggedIn.set(true);
      await this.loadFluxo();
    } catch (error) {
      console.error(error);
      this.statusMessage.set('Erro ao conectar com o servidor.');
    }
  }

  protected async loadFluxo() {
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

      if (!response.ok) {
        this.statusMessage.set(data?.error ?? 'Falha ao carregar o extrato.');
        return;
      }

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

  protected logout() {
    this.loggedIn.set(false);
    this.email.set('');
    this.fluxo.set([]);
    this.filterEntradaSaida.set('');
    this.filterData.set('');
    this.filterDescricao.set('');
    this.statusMessage.set('');
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

  protected formatValor(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
