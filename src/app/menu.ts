import { Component, signal, inject } from '@angular/core';
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

              <!-- Relatórios Dropdown -->
              <div class="relative">
                <button
                  (click)="toggleSubmenu()"
                  class="px-4 py-2 text-gray-700 hover:text-emerald-600 font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
                >
                  Relatórios
                  <svg class="w-4 h-4 transition-transform" [class.rotate-180]="submenuOpen()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                  </svg>
                </button>

                <!-- Submenu -->
                <div
                  *ngIf="submenuOpen()"
                  class="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10"
                >
                  <button
                    (click)="goToMovimentacoes()"
                    class="block w-full text-left px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                  >
                    Resumo por descrição
                  </button>
                  <!-- <button
                    (click)="toggleSubmenu(); closeMobileMenu()"
                    class="block w-full text-left px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                  >
                    Gerar Novo
                  </button>
                  <div class="border-t border-gray-200 my-2"></div>
                  <button
                    (click)="toggleSubmenu(); closeMobileMenu()"
                    class="block w-full text-left px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-sm"
                  >
                    Configurações do Relatório
                  </button> -->
                </div>
              </div>
            </div>
          </div>

          <!-- Right Section: Logout and Mobile Menu Button -->
          <div class="flex items-center gap-4">
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
          <div class="px-4 py-2">
            <button
              (click)="toggleSubmenu()"
              class="w-full text-left px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors font-medium rounded-lg flex items-center justify-between"
            >
              Relatórios
              <svg class="w-4 h-4 transition-transform" [class.rotate-180]="submenuOpen()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </button>
            <div *ngIf="submenuOpen()" class="mt-2 ml-4 space-y-1 border-l-2 border-emerald-200 pl-4">
              <button
                (click)="toggleSubmenu(); closeMobileMenu()"
                class="block w-full text-left px-3 py-1.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                Visualizar Relatório
              </button>
              <button
                (click)="toggleSubmenu(); closeMobileMenu()"
                class="block w-full text-left px-3 py-1.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                Gerar Novo
              </button>
              <button
                (click)="toggleSubmenu(); closeMobileMenu()"
                class="block w-full text-left px-3 py-1.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                Configurações do Relatório
              </button>
            </div>
          </div>
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
export class MenuComponent {
  private router = inject(Router);

  protected readonly submenuOpen = signal(false);
  protected readonly mobileMenuOpen = signal(false);

  protected toggleSubmenu() {
    this.submenuOpen.set(!this.submenuOpen());
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
    this.router.navigate(['/']);
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
