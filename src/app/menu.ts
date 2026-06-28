import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-menu',
  template: `
    <!-- Navigation Bar -->
    <nav class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Left Section: Logo and Menu -->
          <div class="flex items-center gap-8">
            <!-- Logo/Brand -->
            <div class="flex-shrink-0">
              <span class="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                Planejamento Já!
              </span>
            </div>

            <!-- Desktop Menu -->
            <div class="hidden md:flex items-center gap-1">
              <button
                (click)="goHome()"
                class="px-4 py-2 text-gray-700 hover:text-emerald-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Home
              </button>

              <button
                (click)="goToExtrato()"
                class="px-4 py-2 text-gray-700 hover:text-emerald-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Últimas Movimentações
              </button>

              <button
                (click)="goToMovimentacoes()"
                class="px-4 py-2 text-gray-700 hover:text-emerald-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Relatórios
              </button>
            </div>
          </div>

          <!-- Right Section: Logout and Mobile Menu Button -->
          <div class="flex items-center gap-4">
            <!-- Privacy Button (Eye) -->
            <button
              (click)="togglePrivacy()"
              class="p-2 text-gray-500 hover:text-emerald-600 rounded-lg hover:bg-gray-100 transition-all duration-200"
              title="Ocultar/Mostrar Valores"
              aria-label="Ocultar ou mostrar valores"
            >
              <!-- Eye open SVG if hideValues() is false -->
              <svg *ngIf="!hideValues()" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <!-- Eye closed SVG if hideValues() is true -->
              <svg *ngIf="hideValues()" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.822 7.822L21 21m-2.228-2.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            </button>

            <!-- Logout Button -->
            <button
              (click)="logout()"
              class="hidden md:inline-flex px-4 py-2 text-white bg-red-600 hover:bg-red-700 font-medium rounded-full transition-colors"
            >
              Sair
            </button>

            <!-- Mobile Menu Button -->
            <button
              (click)="toggleMobileMenu()"
              class="md:hidden inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                class="w-6 h-6 text-gray-700 transition-transform"
                [class.rotate-180]="mobileMenuOpen()"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div *ngIf="mobileMenuOpen()" class="md:hidden border-t border-gray-200 py-2">
          <button
            (click)="goHome()"
            class="block w-full text-left px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors font-medium"
          >
            Home
          </button>
          <button
            (click)="goToExtrato()"
            class="block w-full text-left px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors font-medium"
          >
            Últimas Movimentações
          </button>
          <button
            (click)="goToMovimentacoes()"
            class="block w-full text-left px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors font-medium"
          >
            Relatórios
          </button>
          <div class="border-t border-gray-200 mt-2 pt-2 px-4">
            <button
              (click)="logout(); closeMobileMenu()"
              class="w-full px-4 py-2 text-white bg-red-600 hover:bg-red-700 font-medium rounded-full transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  `,
  imports: [CommonModule],
})
export class MenuComponent implements OnInit {
  private router = inject(Router);

  protected readonly mobileMenuOpen = signal(false);
  protected readonly hideValues = signal(false);

  ngOnInit() {
    if (typeof sessionStorage !== 'undefined') {
      this.hideValues.set(sessionStorage.getItem('hideValues') === 'true');
    }
  }

  protected togglePrivacy() {
    const val = !this.hideValues();
    this.hideValues.set(val);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('hideValues', String(val));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('privacyToggled'));
    }
  }

  protected toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  protected closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  protected logout() {
    sessionStorage.removeItem('userEmail');
    this.router.navigate(['/']);
  }

  protected goHome() {
    this.closeMobileMenu();
    this.router.navigate(['/dashboard']);
  }

  protected goToExtrato() {
    this.closeMobileMenu();
    this.router.navigate(['/extrato']);
  }

  protected goToMovimentacoes() {
    this.closeMobileMenu();
    this.router.navigate(['/relatorio']);
  }
}
