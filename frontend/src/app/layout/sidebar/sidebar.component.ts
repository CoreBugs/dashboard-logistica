import { Component, inject, signal, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatRippleModule, MatTooltipModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">

      <!-- Header: logo -->
      <div class="sidebar-header">
        <mat-icon class="logo-icon">local_shipping</mat-icon>
        @if (!collapsed()) {
          <span class="logo-text">LogiDash</span>
        }
      </div>

      <!-- Nav items -->
      <nav class="sidebar-nav">
        @for (item of navItems; track item.route) {
          @if (!item.adminOnly || isAdmin()) {
            <a
              class="nav-item"
              matRipple
              [routerLink]="item.route"
              routerLinkActive="active"
              [matTooltip]="collapsed() ? item.label : ''"
              matTooltipPosition="right"
            >
              <mat-icon>{{ item.icon }}</mat-icon>
              @if (!collapsed()) {
                <span>{{ item.label }}</span>
              }
            </a>
          }
        }
      </nav>

      <!-- Spacer -->
      <div class="sidebar-spacer"></div>

      <!-- Toggle button -->
      <button
        class="toggle-btn"
        matRipple
        (click)="toggle()"
        [matTooltip]="collapsed() ? 'Expandir menú' : ''"
        matTooltipPosition="right"
        aria-label="Toggle sidebar"
      >
        <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        @if (!collapsed()) {
          <span>Contraer</span>
        }
      </button>

    </aside>
  `,
  styles: [`
    :host {
      display: flex;
      height: 100%;
    }

    .sidebar {
      width: var(--sidebar-width);
      background: var(--sidebar-bg);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      height: 100%;
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }

    .sidebar.collapsed {
      width: 68px;
    }

    /* ── Header ── */
    .sidebar-header {
      height: var(--navbar-height);
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 24px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
      overflow: hidden;
      white-space: nowrap;
    }
    .sidebar.collapsed .sidebar-header {
      padding: 0;
      justify-content: center;
    }
    .logo-icon {
      color: var(--sidebar-accent);
      font-size: 26px;
      width: 26px;
      height: 26px;
      flex-shrink: 0;
    }
    .logo-text {
      color: #fff;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.5px;
      opacity: 1;
      transition: opacity 0.15s;
      white-space: nowrap;
    }

    /* ── Nav ── */
    .sidebar-nav {
      padding: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex-shrink: 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 22px;
      color: var(--sidebar-text);
      text-decoration: none;
      transition: background 0.18s, color 0.18s;
      cursor: pointer;
      border-radius: 0;
      white-space: nowrap;
      overflow: hidden;
    }
    .sidebar.collapsed .nav-item {
      padding: 11px 0;
      justify-content: center;
    }
    .nav-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    .nav-item span {
      font-size: 14px;
      font-weight: 500;
      opacity: 1;
      transition: opacity 0.15s;
    }
    .nav-item:hover {
      background: rgba(255,255,255,0.06);
      color: #fff;
    }
    .nav-item.active {
      background: rgba(79,142,247,0.15);
      color: var(--sidebar-text-active);
      border-left: 3px solid var(--sidebar-accent);
      padding-left: 19px;
    }
    .sidebar.collapsed .nav-item.active {
      border-left: none;
      padding-left: 0;
      border-right: 3px solid var(--sidebar-accent);
    }
    .nav-item.active mat-icon { color: var(--sidebar-accent); }

    /* ── Spacer ── */
    .sidebar-spacer { flex: 1; }

    /* ── Toggle button ── */
    .toggle-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 14px 22px;
      background: transparent;
      border: none;
      border-top: 1px solid rgba(255,255,255,0.08);
      color: var(--sidebar-text);
      cursor: pointer;
      transition: background 0.18s, color 0.18s;
      white-space: nowrap;
      overflow: hidden;
      flex-shrink: 0;
    }
    .sidebar.collapsed .toggle-btn {
      padding: 14px 0;
      justify-content: center;
    }
    .toggle-btn:hover {
      background: rgba(255,255,255,0.06);
      color: #fff;
    }
    .toggle-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    .toggle-btn span {
      font-size: 13px;
      font-weight: 500;
    }
  `]
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  collapsed = signal(false);
  collapsedChange = output<boolean>();

  isAdmin = () => this.auth.currentUser()?.role === 'admin';

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard',      route: '/dashboard' },
    { label: 'Productos', icon: 'inventory_2',    route: '/products'  },
    { label: 'Órdenes',   icon: 'receipt_long',   route: '/orders'    },
    { label: 'Usuarios',  icon: 'group',          route: '/users', adminOnly: true },
  ];

  toggle() {
    this.collapsed.update(v => !v);
    this.collapsedChange.emit(this.collapsed());
  }
}

