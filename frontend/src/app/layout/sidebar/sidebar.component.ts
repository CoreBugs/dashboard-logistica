import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatRippleModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <mat-icon class="logo-icon">local_shipping</mat-icon>
        <span class="logo-text">LogiDash</span>
      </div>
      <nav class="sidebar-nav">
        @for (item of navItems; track item.route) {
          <a
            class="nav-item"
            matRipple
            [routerLink]="item.route"
            routerLinkActive="active"
          >
            <mat-icon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      background: var(--sidebar-bg);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar-header {
      height: var(--navbar-height);
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 24px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .sidebar-header .logo-icon { color: var(--sidebar-accent); font-size: 28px; }
    .sidebar-header .logo-text { color: #fff; font-size: 18px; font-weight: 600; letter-spacing: 0.5px; }
    .sidebar-nav {
      padding: 16px 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 24px;
      color: var(--sidebar-text);
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
    }
    .nav-item mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .nav-item span { font-size: 14px; font-weight: 500; }
    .nav-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
    .nav-item.active {
      background: rgba(79,142,247,0.15);
      color: var(--sidebar-text-active);
      border-left: 3px solid var(--sidebar-accent);
      padding-left: 21px;
    }
    .nav-item.active mat-icon { color: var(--sidebar-accent); }
  `]
})
export class SidebarComponent {
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Productos', icon: 'inventory_2', route: '/products' },
    { label: 'Órdenes', icon: 'receipt_long', route: '/orders' },
    { label: 'Usuarios', icon: 'group', route: '/users' },
  ];
}
