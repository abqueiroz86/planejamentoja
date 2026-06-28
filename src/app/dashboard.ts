import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  imports: [CommonModule, MenuComponent],
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);

  protected readonly email = signal('');
  protected readonly statusMessage = signal('');
  protected readonly fluxo = signal<FluxoEntry[]>([]);
  protected readonly hideValues = signal(false);

  ngOnInit() {
    if (typeof sessionStorage !== 'undefined') {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) {
        this.router.navigate(['/']);
        return;
      }
      this.email.set(userEmail);
      this.hideValues.set(sessionStorage.getItem('hideValues') === 'true');
      this.loadDashboardData();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('privacyToggled', () => {
        this.hideValues.set(sessionStorage.getItem('hideValues') === 'true');
      });
    }
  }

  protected async loadDashboardData() {
    try {
      this.statusMessage.set('');
      const response = await fetch('/api/fluxo');
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('userEmail');
          }
          this.router.navigate(['/']);
          return;
        }
        this.statusMessage.set(data?.error ?? 'Falha ao carregar os dados.');
        return;
      }

      this.fluxo.set(data.fluxo ?? []);
    } catch (error) {
      console.error(error);
      this.statusMessage.set('Erro ao conectar com o servidor.');
    }
  }

  // Resumo financeiro calculado
  protected totals = computed(() => {
    let entradas = 0;
    let saidas = 0;

    this.fluxo().forEach((item) => {
      if (item.entrada_saida === 0) {
        entradas += item.valor;
      } else {
        saidas += item.valor;
      }
    });

    const saldo = entradas - saidas;
    const taxaPoupanca = entradas > 0 ? (saldo / entradas) * 100 : 0;

    return {
      entradas,
      saidas,
      saldo,
      taxaPoupanca,
    };
  });

  // 5 transações mais recentes
  protected recentTransactions = computed(() => {
    return this.fluxo().slice(0, 5);
  });

  // Gastos agrupados por descrição para exibir como barras de progresso
  protected topExpenses = computed(() => {
    const expensesGrouped: Record<string, number> = {};
    let totalExpenses = 0;

    this.fluxo().forEach((item) => {
      if (item.entrada_saida === 1) {
        const desc = item.descricao.toUpperCase();
        expensesGrouped[desc] = (expensesGrouped[desc] || 0) + item.valor;
        totalExpenses += item.valor;
      }
    });

    return Object.entries(expensesGrouped)
      .map(([label, value]) => ({
        label,
        value,
        percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5 despesas
  });

  protected formatValor(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  protected displayValor(value: number) {
    if (this.hideValues()) {
      return 'R$ •••••';
    }
    return this.formatValor(value);
  }

  protected displayValorComSinal(item: FluxoEntry) {
    if (this.hideValues()) {
      return 'R$ •••••';
    }
    const sinal = item.entrada_saida === 0 ? '+' : '-';
    return `${sinal} ${this.formatValor(item.valor)}`;
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

  protected goToExtrato() {
    this.router.navigate(['/extrato']);
  }
}
