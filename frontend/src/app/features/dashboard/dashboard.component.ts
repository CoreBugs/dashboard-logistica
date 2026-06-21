import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { DashboardService, DashboardSummary } from '../../core/services/dashboard.service';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    BaseChartDirective,
    MetricCardComponent,
  ],
  template: `
    <div class="dashboard-page">
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <span class="page-subtitle">Resumen general del sistema logístico</span>
      </div>

      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="48" />
        </div>
      } @else if (error()) {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <p>No se pudieron cargar los datos. Verificá que el backend esté activo.</p>
        </div>
      } @else {
        <!-- KPI Cards -->
        <div class="kpi-grid">
          <app-metric-card
            title="Total órdenes"
            [value]="summary()!.totalOrders"
            icon="receipt_long"
            color="blue"
          />
          <app-metric-card
            title="Pendientes"
            [value]="summary()!.pendiente"
            icon="hourglass_empty"
            color="orange"
          />
          <app-metric-card
            title="En viaje"
            [value]="summary()!.enViaje"
            icon="local_shipping"
            color="purple"
          />
          <app-metric-card
            title="Entregadas"
            [value]="summary()!.entregado"
            icon="check_circle"
            color="green"
          />
          <app-metric-card
            title="Productos"
            [value]="summary()!.totalProducts"
            icon="inventory_2"
            color="blue"
          />
          <app-metric-card
            title="Stock bajo"
            [value]="summary()!.lowStockProducts"
            icon="warning"
            color="red"
            subtitle="≤ 5 unidades"
          />
          <app-metric-card
            title="Facturación total"
            [value]="totalRevenueFormatted()"
            icon="payments"
            color="green"
          />
          <app-metric-card
            title="Facturado entregado"
            [value]="deliveredRevenueFormatted()"
            icon="local_shipping"
            color="purple"
            [subtitle]="'vs ' + pendingRevenueFormatted() + ' sin entregar'"
          />
        </div>

        <!-- Chart + Recent Orders -->
        <div class="bottom-grid">
          <!-- Bar Chart -->
          <div class="card chart-card">
            <h2 class="card-title">Órdenes por estado</h2>
            <div class="chart-wrapper">
              <canvas baseChart
                [data]="chartData()"
                [options]="chartOptions"
                type="bar"
              ></canvas>
            </div>
          </div>

          <!-- Recent Orders Table -->
          <div class="card table-card">
            <h2 class="card-title">Últimas órdenes</h2>
            @if (summary()!.recentOrders.length === 0) {
              <div class="empty-state">
                <mat-icon>inbox</mat-icon>
                <p>No hay órdenes aún</p>
              </div>
            } @else {
              <table mat-table [dataSource]="summary()!.recentOrders" class="recent-table">
                <ng-container matColumnDef="id">
                  <th mat-header-cell *matHeaderCellDef>#</th>
                  <td mat-cell *matCellDef="let o">{{ o.id }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let o">
                    <span class="status-badge" [attr.data-status]="o.status">{{ o.status }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="total_price">
                  <th mat-header-cell *matHeaderCellDef>Total</th>
                  <td mat-cell *matCellDef="let o">{{ o.total_price | currency:'ARS':'symbol':'1.2-2' }}</td>
                </ng-container>
                <ng-container matColumnDef="created_at">
                  <th mat-header-cell *matHeaderCellDef>Fecha</th>
                  <td mat-cell *matCellDef="let o">{{ o.created_at | date:'dd/MM/yy HH:mm' }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="recentCols"></tr>
                <tr mat-row *matRowDef="let row; columns: recentCols;"></tr>
              </table>
            }
          </div>
        </div>

        <!-- Orders-based widgets -->
        <div class="widgets-grid">
          <!-- Pie Chart: distribución por estado -->
          <div class="card chart-card">
            <h2 class="card-title">Distribución de órdenes por estado</h2>
            <div class="chart-wrapper">
              <canvas baseChart
                [data]="statusPieData()"
                [options]="pieChartOptions"
                type="pie"
              ></canvas>
            </div>
          </div>

          <!-- Line Chart: órdenes por día -->
          <div class="card chart-card">
            <h2 class="card-title">Órdenes creadas por día</h2>
            <div class="chart-wrapper">
              <canvas baseChart
                [data]="ordersByDayData()"
                [options]="lineChartOptions"
                type="line"
              ></canvas>
            </div>
          </div>

          <!-- Bar Chart: top 5 productos -->
          <div class="card chart-card">
            <h2 class="card-title">Top 5 productos más pedidos</h2>
            <div class="chart-wrapper">
              <canvas baseChart
                [data]="topProductsData()"
                [options]="topProductsOptions"
                type="bar"
              ></canvas>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-page { display: flex; flex-direction: column; gap: 24px; }

    .page-header { display: flex; flex-direction: column; gap: 4px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1a1f36; margin: 0; }
    .page-subtitle { font-size: 13px; color: #718096; }

    .loading-center { display: flex; justify-content: center; padding: 80px 0; }

    .error-state {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 60px; color: #e53e3e; text-align: center;
    }
    .error-state mat-icon { font-size: 40px; width: 40px; height: 40px; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .bottom-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .widgets-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .card {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .card-title {
      font-size: 15px; font-weight: 600; color: #1a1f36;
      margin: 0 0 16px 0;
    }

    .chart-wrapper { position: relative; height: 220px; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 40px; color: #a0aec0;
    }
    .empty-state mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .empty-state p { margin: 0; font-size: 14px; }

    .recent-table { width: 100%; }
    .recent-table th { font-size: 12px; color: #718096; font-weight: 600; }
    .recent-table td { font-size: 13px; }

    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: capitalize;
    }
    .status-badge[data-status="pendiente"]  { background: rgba(246,173,85,0.15); color: #c97a0a; }
    .status-badge[data-status="en viaje"]   { background: rgba(128,90,213,0.15); color: #6b46c1; }
    .status-badge[data-status="entregado"]  { background: rgba(56,178,114,0.15); color: #276749; }

    @media (max-width: 1100px) {
      .widgets-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 900px) {
      .bottom-grid { grid-template-columns: 1fr; }
      .widgets-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  loading = signal(true);
  error = signal(false);
  summary = signal<DashboardSummary | null>(null);

  recentCols = ['id', 'status', 'total_price', 'created_at'];

  chartData = computed<ChartData<'bar'>>(() => {
    const s = this.summary();
    return {
      labels: ['Pendientes', 'En viaje', 'Entregadas'],
      datasets: [
        {
          label: 'Órdenes',
          data: s ? [s.pendiente, s.enViaje, s.entregado] : [0, 0, 0],
          backgroundColor: ['rgba(246,173,85,0.8)', 'rgba(128,90,213,0.8)', 'rgba(56,178,114,0.8)'],
          borderColor:     ['#f6ad55', '#805ad5', '#38b272'],
          borderWidth: 1,
          borderRadius: 6,
        }
      ]
    };
  });

  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } }
    }
  };

  private readonly statusColors = this.readStatusColors();

  private readStatusColors() {
    const styles = getComputedStyle(document.documentElement);
    return {
      pendiente: styles.getPropertyValue('--status-pendiente-fg').trim() || '#f6ad55',
      enViaje:   styles.getPropertyValue('--status-en-viaje-fg').trim()  || '#805ad5',
      entregado: styles.getPropertyValue('--status-entregado-fg').trim() || '#38b272',
    };
  }

  totalRevenue = computed(() => this.summary()?.orders.reduce((acc, o) => acc + o.total_price, 0) ?? 0);
  deliveredRevenue = computed(() =>
    this.summary()?.orders.filter(o => o.status === 'entregado').reduce((acc, o) => acc + o.total_price, 0) ?? 0
  );
  pendingRevenue = computed(() => this.totalRevenue() - this.deliveredRevenue());

  totalRevenueFormatted     = computed(() => this.formatCurrency(this.totalRevenue()));
  deliveredRevenueFormatted = computed(() => this.formatCurrency(this.deliveredRevenue()));
  pendingRevenueFormatted   = computed(() => this.formatCurrency(this.pendingRevenue()));

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
  }

  statusPieData = computed<ChartData<'pie'>>(() => {
    const s = this.summary();
    return {
      labels: ['Pendiente', 'En viaje', 'Entregado'],
      datasets: [
        {
          data: s ? [s.pendiente, s.enViaje, s.entregado] : [0, 0, 0],
          backgroundColor: [this.statusColors.pendiente, this.statusColors.enViaje, this.statusColors.entregado],
          borderWidth: 0,
        }
      ]
    };
  });

  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  ordersByDayData = computed<ChartData<'line'>>(() => {
    const orders = this.summary()?.orders ?? [];
    const counts = new Map<string, number>();
    for (const o of orders) {
      const day = new Date(o.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    const sortedDays = [...counts.keys()].sort((a, b) => {
      const [da, ma] = a.split('/').map(Number);
      const [db, mb] = b.split('/').map(Number);
      return ma - mb || da - db;
    });
    return {
      labels: sortedDays,
      datasets: [
        {
          label: 'Órdenes',
          data: sortedDays.map(d => counts.get(d) ?? 0),
          borderColor: '#4f8ef7',
          backgroundColor: 'rgba(79,142,247,0.15)',
          tension: 0.3,
          fill: true,
        }
      ]
    };
  });

  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } }
    }
  };

  topProductsData = computed<ChartData<'bar'>>(() => {
    const orders = this.summary()?.orders ?? [];
    const products = this.summary()?.products ?? [];
    const quantityByProduct = new Map<number, number>();
    for (const o of orders) {
      quantityByProduct.set(o.product_id, (quantityByProduct.get(o.product_id) ?? 0) + o.quantity);
    }
    const top5 = [...quantityByProduct.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const productName = (id: number) => products.find(p => p.id === id)?.name ?? `Producto #${id}`;
    return {
      labels: top5.map(([id]) => productName(id)),
      datasets: [
        {
          label: 'Unidades pedidas',
          data: top5.map(([, qty]) => qty),
          backgroundColor: 'rgba(79,142,247,0.8)',
          borderColor: '#4f8ef7',
          borderWidth: 1,
          borderRadius: 6,
        }
      ]
    };
  });

  topProductsOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
      y: { grid: { display: false } }
    }
  };

  ngOnInit() {
    this.dashboardService.getSummary().subscribe({
      next: data => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }
}
