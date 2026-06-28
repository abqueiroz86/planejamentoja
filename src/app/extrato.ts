import { Component, signal, inject, OnInit } from '@angular/core';
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
  selector: 'app-extrato',
  templateUrl: './extrato.html',
  styleUrl: './extrato.css',
  imports: [CommonModule, MenuComponent],
})
export class ExtratoComponent implements OnInit {
  private router = inject(Router);

  protected readonly statusMessage = signal('');
  protected readonly fluxo = signal<FluxoEntry[]>([]);
  protected readonly filterEntradaSaida = signal('');
  protected readonly filterMesAno = signal('');
  protected readonly filterDescricao = signal('');

  // Modal CRUD State
  protected readonly isModalOpen = signal(false);
  protected readonly modalMode = signal<'add' | 'edit'>('add');
  protected readonly selectedFluxoId = signal<number | null>(null);

  // Form Fields
  protected readonly formTipo = signal<number>(0);
  protected readonly formData = signal<string>('');
  protected readonly formValor = signal<number | null>(null);
  protected readonly formDescricao = signal<string>('');

  protected readonly hideValues = signal(false);

  ngOnInit() {
    if (typeof sessionStorage !== 'undefined') {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) {
        this.router.navigate(['/']);
        return;
      }
      this.hideValues.set(sessionStorage.getItem('hideValues') === 'true');
      this.loadFluxo();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('privacyToggled', () => {
        this.hideValues.set(sessionStorage.getItem('hideValues') === 'true');
      });
    }
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
      mes_ano: this.filterMesAno(),
      descricao: this.filterDescricao(),
    });
    this.statusMessage.set('');

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

      console.log('Extrato response:', data);
      if (!response.ok) {
        if (response.status === 401) {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('userEmail');
          }
          this.router.navigate(['/']);
          return;
        }
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

  // Modal actions
  protected openAddModal() {
    this.formTipo.set(0);
    this.formData.set(new Date().toISOString().split('T')[0]);
    this.formValor.set(null);
    this.formDescricao.set('');
    this.modalMode.set('add');
    this.selectedFluxoId.set(null);
    this.isModalOpen.set(true);
  }

  protected openEditModal(item: FluxoEntry) {
    this.formTipo.set(item.entrada_saida);
    
    // extrai apenas YYYY-MM-DD
    const isoDate = new Date(item.data).toISOString().split('T')[0];
    this.formData.set(isoDate);
    
    this.formValor.set(item.valor);
    this.formDescricao.set(item.descricao);
    this.modalMode.set('edit');
    this.selectedFluxoId.set(item.fluxo_id);
    this.isModalOpen.set(true);
  }

  protected closeModal() {
    this.isModalOpen.set(false);
  }

  protected async saveTransaction() {
    const valor = this.formValor();
    const data = this.formData();
    const descricao = this.formDescricao();
    const tipo = this.formTipo();

    if (valor === null || valor <= 0 || !data || !descricao.trim()) {
      this.statusMessage.set('Preencha todos os campos corretamente com valores válidos.');
      return;
    }

    const payload = {
      entrada_saida: tipo,
      data,
      valor,
      descricao: descricao.trim(),
    };

    try {
      this.statusMessage.set('');
      let response: Response;

      if (this.modalMode() === 'add') {
        response = await fetch('/api/fluxo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/fluxo/${this.selectedFluxoId()}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const resData = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('userEmail');
          }
          this.router.navigate(['/']);
          return;
        }
        this.statusMessage.set(resData?.error ?? 'Erro ao salvar o lançamento.');
        return;
      }

      this.closeModal();
      await this.loadFluxo();
    } catch (error) {
      console.error(error);
      this.statusMessage.set('Erro de conexão ao salvar.');
    }
  }

  protected async deleteTransaction(id: number) {
    if (!confirm('Deseja realmente excluir este lançamento?')) {
      return;
    }

    try {
      this.statusMessage.set('');
      const response = await fetch(`/api/fluxo/${id}`, {
        method: 'DELETE',
      });

      const resData = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('userEmail');
          }
          this.router.navigate(['/']);
          return;
        }
        this.statusMessage.set(resData?.error ?? 'Erro ao excluir o lançamento.');
        return;
      }

      await this.loadFluxo();
    } catch (error) {
      console.error(error);
      this.statusMessage.set('Erro de conexão ao excluir.');
    }
  }
}
