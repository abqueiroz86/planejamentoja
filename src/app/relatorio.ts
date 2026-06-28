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

interface ChartData {
  label: string;
  value: number;
  percentage: number;
  color: string;
  angle: number;
}

@Component({
  standalone: true,
  selector: 'app-relatorio',
  templateUrl: './relatorio.html',
  styleUrl: './relatorio.css',
  imports: [CommonModule, MenuComponent],
})
export class RelatorioComponent implements OnInit {
  private router = inject(Router);

  protected readonly title = signal('Planejamento Já!');
  protected readonly statusMessage = signal('');
  protected readonly email = signal('');
  protected readonly fluxo = signal<FluxoEntry[]>([]);
  protected readonly filterEntradaSaida = signal('');
  protected readonly filterMesAno = signal('');
  protected readonly filterDescricao = signal('');
  protected readonly highlightedLegend = signal<string | null>(null);
  protected readonly activeTab = signal<'description' | 'cashflow' | 'balance' | 'category'>('description');

  ngOnInit() {
    if (typeof sessionStorage !== 'undefined') {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) {
        this.router.navigate(['/']);
        return;
      }
      this.email.set(userEmail);
      this.loadRelatorio();
    }
  }

  protected chartData = computed(() => {
    const data = this.fluxo();
    const grouped: Record<string, number> = {};

    data.forEach((item) => {
      const key = item.descricao.toUpperCase();
      grouped[key] = (grouped[key] || 0) + item.valor;
    });

    const total = Object.values(grouped).reduce((sum, val) => sum + val, 0);
    const colors = this.generateColors(Object.keys(grouped).length);

    let currentAngle = 0;
    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .map((entry, index) => {
        const [label, value] = entry;
        const percentage = total > 0 ? (value / total) * 100 : 0;
        const sliceAngle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;
        currentAngle = endAngle;

        return {
          label,
          value,
          percentage,
          color: colors[index],
          startAngle,
          endAngle,
          sliceAngle,
        };
      });
  });

  protected totalValue = computed(() => {
    return this.fluxo().reduce((sum, item) => sum + item.valor, 0);
  });

  protected monthlyCashFlow = computed(() => {
    const data = this.fluxo();
    const grouped: Record<string, { income: number; expense: number }> = {};

    data.forEach((item) => {
      const date = new Date(item.data);
      if (Number.isNaN(date.getTime())) return;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;

      if (!grouped[key]) {
        grouped[key] = { income: 0, expense: 0 };
      }

      if (item.entrada_saida === 0) {
        grouped[key].income += item.valor;
      } else {
        grouped[key].expense += item.valor;
      }
    });

    const sortedMonths = Object.keys(grouped).sort();
    const last6Months = sortedMonths.slice(-6);

    const maxVal = Math.max(
      ...last6Months.map((m) => Math.max(grouped[m].income, grouped[m].expense)),
      1000
    );

    return last6Months.map((monthKey) => {
      const [year, month] = monthKey.split('-');
      const label = `${month}/${year.slice(2)}`;
      const income = grouped[monthKey].income;
      const expense = grouped[monthKey].expense;

      return {
        monthKey,
        label,
        income,
        expense,
        incomeHeightPercent: (income / maxVal) * 100,
        expenseHeightPercent: (expense / maxVal) * 100,
      };
    });
  });

  protected balanceEvolution = computed(() => {
    const data = this.fluxo();
    const netChangeByMonth: Record<string, number> = {};

    data.forEach((item) => {
      const date = new Date(item.data);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const change = item.entrada_saida === 0 ? item.valor : -item.valor;
      netChangeByMonth[key] = (netChangeByMonth[key] || 0) + change;
    });

    const allMonths = Object.keys(netChangeByMonth).sort();
    let runningBalance = 0;
    
    const balanceHistory = allMonths.map((monthKey) => {
      runningBalance += netChangeByMonth[monthKey];
      return {
        monthKey,
        balance: runningBalance,
      };
    });

    const displayHistory = balanceHistory.slice(-6);
    if (displayHistory.length === 0) return [];

    const balances = displayHistory.map((h) => h.balance);
    let maxBal = Math.max(...balances);
    let minBal = Math.min(...balances);

    if (maxBal === minBal) {
      maxBal += 1000;
      minBal -= 1000;
    } else {
      const diff = maxBal - minBal;
      maxBal += diff * 0.1;
      minBal -= diff * 0.1;
    }

    const range = maxBal - minBal;

    return displayHistory.map((h, i) => {
      const [year, month] = h.monthKey.split('-');
      const label = `${month}/${year.slice(2)}`;
      const heightRange = 160; 
      const y = 230 - ((h.balance - minBal) / range) * heightRange;
      const x = 80 + i * 85;

      return {
        label,
        balance: h.balance,
        x,
        y,
      };
    });
  });

  protected get linePath(): string {
    const points = this.balanceEvolution();
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  protected get areaPath(): string {
    const points = this.balanceEvolution();
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const line = points.map((p) => `L ${p.x} ${p.y}`).join(' ');
    return `M ${first.x} 230 L ${first.x} ${first.y} ${line} L ${last.x} 230 Z`;
  }

  protected categoryData = computed(() => {
    const data = this.fluxo();
    let essenciais = 0;
    let variaveis = 0;
    let investimentos = 0;

    data.forEach((item) => {
      if (item.entrada_saida === 1) {
        const desc = item.descricao.toLowerCase();
        if (
          desc.includes('fiis') ||
          desc.includes('ações') ||
          desc.includes('investimento') ||
          desc.includes('tesouro') ||
          desc.includes('poupança') ||
          desc.includes('cdb') ||
          desc.includes('dividendos')
        ) {
          investimentos += item.valor;
        } else if (
          desc.includes('mercado') ||
          desc.includes('supermercado') ||
          desc.includes('farmácia') ||
          desc.includes('contas') ||
          desc.includes('energia') ||
          desc.includes('luz') ||
          desc.includes('água') ||
          desc.includes('internet') ||
          desc.includes('academia') ||
          desc.includes('aluguel') ||
          desc.includes('condomínio') ||
          desc.includes('combustível') ||
          desc.includes('posto')
        ) {
          essenciais += item.valor;
        } else {
          variaveis += item.valor;
        }
      }
    });

    const total = essenciais + variaveis + investimentos;
    const categories = [
      { label: 'Despesas Essenciais', value: essenciais, color: '#0284c7' },
      { label: 'Despesas Variáveis', value: variaveis, color: '#e11d48' },
      { label: 'Investimentos', value: investimentos, color: '#10b981' },
    ];

    let currentAngle = 0;
    return categories.map((cat) => {
      const percentage = total > 0 ? (cat.value / total) * 100 : 0;
      const sliceAngle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      return {
        ...cat,
        percentage,
        startAngle,
        endAngle,
        sliceAngle,
      };
    });
  });

  protected totalOutflow = computed(() => {
    return this.categoryData().reduce((sum, cat) => sum + cat.value, 0);
  });

  protected async loadRelatorio() {
    const params = new URLSearchParams();
    if (this.filterEntradaSaida()) {
      params.set('entrada_saida', this.filterEntradaSaida());
    }
    if (this.filterMesAno()) {
      params.set('mes_ano', this.filterMesAno());
    }
    if (this.filterDescricao()) {
      params.set('descricao', this.filterDescricao());
    }

    try {
      const response = await fetch(`/api/fluxo?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('userEmail');
          }
          this.router.navigate(['/']);
          return;
        }
        this.statusMessage.set(data?.error ?? 'Falha ao carregar o relatório.');
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
    await this.loadRelatorio();
  }

  protected logout() {
    this.email.set('');
    this.router.navigate(['/']);
  }

  protected goToExtrato() {
    this.router.navigate(['/']);
  }
  protected generateColors(count: number): string[] {
    const baseColors = [
      '#68BA7F',
      '#253D2C',
      '#4f6a55',
      '#1f7e45',
      '#b02e2e',
      '#ff6b6b',
      '#ffd93d',
      '#6bcf7f',
      '#4d96ff',
      '#ff6b9d',
    ];

    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    const colors = [...baseColors];
    for (let i = baseColors.length; i < count; i++) {
      const hue = (i * 360) / count;
      colors.push(`hsl(${hue}, 60%, 50%)`);
    }
    return colors;
  }

  protected getPieSlice(
    index: number
  ): { startAngle: number; endAngle: number; path: string } {
    const data = this.chartData()[index];
    if (!data) return { startAngle: 0, endAngle: 0, path: '' };

    const chartData = data as any;
    const radius = 80;
    const cx = 100;
    const cy = 100;

    const path = this.getArcPath(
      cx,
      cy,
      radius,
      chartData.startAngle,
      chartData.endAngle
    );

    return {
      startAngle: chartData.startAngle,
      endAngle: chartData.endAngle,
      path,
    };
  }

  protected getArcPath(
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ): string {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const angleSize = endAngle - startAngle;
    const largeArc = angleSize > 180 ? 1 : 0;

    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  protected getLabelPosition(startAngle: number, endAngle: number): { x: number; y: number } {
    const midAngle = (startAngle + endAngle) / 2;
    const midRad = (midAngle * Math.PI) / 180;
    const radius = 55;
    const cx = 100;
    const cy = 100;

    return {
      x: cx + radius * Math.cos(midRad),
      y: cy + radius * Math.sin(midRad),
    };
  }

  protected formatTipo(value: number) {
    return value === 0 ? 'Entrada' : 'Saída';
  }

  protected formatValor(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  protected toggleLegendHighlight(label: string) {
    if (this.highlightedLegend() === label) {
      this.highlightedLegend.set(null);
    } else {
      this.highlightedLegend.set(label);
    }
  }

  protected isLegendHighlighted(label: string): boolean {
    return this.highlightedLegend() === label;
  }

  protected isSliceHighlighted(label: string): boolean {
    const highlighted = this.highlightedLegend();
    return highlighted === null || highlighted === label;
  }
}