import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";

@Component({
  standalone: true,
  selector: "app-login",
  styleUrl: './login.css',
  template: `
<main class="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-900/10">
  <section class="py-8 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center" *ngIf="!loggedIn()">
    <div class="mx-auto w-full max-w-md">
      <!-- Card Container -->
      <div class="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <!-- Header -->
        <div class="mb-8 text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            Planejamento Já!
          </div>
          <h1 id="login-title" class="text-3xl font-bold text-gray-900 mb-2">
            Acesso ao Painel
          </h1>
          <p class="text-gray-600 text-sm">
            Digite suas credenciais para continuar
          </p>
        </div>

        <!-- Form -->
        <form class="space-y-4" (submit)="login($event, emailInput.value, passwordInput.value)" novalidate>
          <div class="space-y-2">
            <label for="email" class="block text-sm font-semibold text-gray-700">
              Email
            </label>
            <input
              id="email"
              #emailInput
              type="email"
              placeholder="seu@email.com"
              autocomplete="email"
              required
              class="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div class="space-y-2">
            <label for="password" class="block text-sm font-semibold text-gray-700">
              Senha
            </label>
            <input
              id="password"
              #passwordInput
              type="password"
              placeholder="Sua senha"
              autocomplete="current-password"
              required
              class="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            class="w-full px-4 py-2.5 text-white font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors duration-200 mt-6"
          >
            Entrar
          </button>
        </form>

        <!-- Status Message -->
        <div *ngIf="statusMessage()" class="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm font-medium">
          {{ statusMessage() }}
        </div>

        <!-- Footer -->
        <p class="mt-6 text-center text-xs text-gray-600">
          Aproveite o acesso seguro ao seu ambiente de planejamento
        </p>
      </div>
    </div>
  </section>
</main>
  `,
  imports: [CommonModule],
})

export class LoginComponent implements OnInit {
  private router = inject(Router);

  protected readonly title = signal('Planejamento Já!');
  protected readonly statusMessage = signal('');
  protected readonly loggedIn = signal(false);
  protected readonly email = signal('');
  
  ngOnInit() {
    if (typeof sessionStorage !== 'undefined') {
      const userEmail = sessionStorage.getItem('userEmail');
      if (userEmail) {
        this.email.set(userEmail);
        this.loggedIn.set(true);
        this.router.navigate(['/dashboard']);
      }
    }
  }
  

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
      this.router.navigate(['/dashboard']);

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