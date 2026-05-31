import { Component, signal, inject } from '@angular/core';
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";

@Component({
  standalone: true,
  selector: "app-login",
  styleUrl: './login.css',
  template: `
  <main class="login-page" *ngIf="!loggedIn()">
  <section class="login-card" aria-labelledby="login-title">
    <div class="brand">
      <span class="eyebrow">Planejamento Já!</span>
      <h1 id="login-title">Acesso ao painel de planejamento</h1>
      <p class="subtitle">Tela de login moderna e séria para entrar no seu ambiente de metas, tarefas e agenda.</p>
    </div>

    <form class="login-form" (submit)="login($event, emailInput.value, passwordInput.value)" novalidate>
      <div>
        <label for="email">Email</label>
        <input id="email" #emailInput type="email" placeholder="seu@email.com" autocomplete="email" required />
      </div>

      <div>
        <label for="password">Senha</label>
        <input id="password" #passwordInput type="password" placeholder="Senha" autocomplete="current-password" required />
      </div>

      <button type="submit">Entrar</button>
    </form>

    <div class="status-message">{{ statusMessage() }}</div>

    <p class="footer-note">Aproveite o acesso rápido e seguro com a identidade visual do Planejamento Já!.</p>
  </section>
</main>
  `,
  imports: [CommonModule],
})

export class LoginComponent {
  private router = inject(Router);

  protected readonly title = signal('Planejamento Já!');
  protected readonly statusMessage = signal('');
  protected readonly loggedIn = signal(false);
  protected readonly email = signal('');
  

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
      sessionStorage.setItem('userEmail', data.email);
    //   await this.loadFluxo();
      this.router.navigate(['/extrato']);

    } catch (error) {
      console.error(error);
      this.statusMessage.set('Erro ao conectar com o servidor.');
    }
  }

  

  protected logout() {
    this.loggedIn.set(false);
    this.email.set('');
    this.statusMessage.set('');
    sessionStorage.removeItem('userEmail');
  }

  protected goToRelatorio() {
    this.router.navigate(['/relatorio']);
  }

  
}