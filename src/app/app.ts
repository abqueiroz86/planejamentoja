import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Planejamento Já!');
  protected readonly statusMessage = signal('');

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

      this.statusMessage.set(`Bem-vindo ${data.email}`);
    } catch (error) {
      console.error(error);
      this.statusMessage.set('Erro ao conectar com o servidor.');
    }
  }
}
