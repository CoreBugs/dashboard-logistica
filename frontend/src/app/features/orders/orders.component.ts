import { Component, inject, signal, computed, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { DataTableComponent, DataTableCellDirective, TableColumn, TableAction } from '../../shared/components/data-table/data-table.component';
import { Order, OrderStatus, CreateOrderRequest, UpdateOrderStatusRequest } from '../../core/models/order.model';
import { Product } from '../../core/models/product.model';

interface OrderRow extends Order {
  productName: string;
}

// ─────────────────────────────────────────────
// Dialog de nueva orden
// ─────────────────────────────────────────────
@Component({
  selector: 'app-order-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Nueva orden</h2>
    <mat-dialog-content>
      <form [formGroup]="form" id="order-form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Producto</mat-label>
          <mat-select formControlName="product_id">
            @for (p of data.products; track p.id) {
              <mat-option [value]="p.id">{{ p.name }} (stock: {{ p.stock }})</mat-option>
            }
          </mat-select>
          @if (form.get('product_id')?.hasError('required') && form.get('product_id')?.touched) {
            <mat-error>El producto es requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Cantidad</mat-label>
          <input matInput type="number" formControlName="quantity" min="1" />
          @if (form.get('quantity')?.hasError('required') && form.get('quantity')?.touched) {
            <mat-error>La cantidad es requerida</mat-error>
          }
          @if (form.get('quantity')?.hasError('min') && form.get('quantity')?.touched) {
            <mat-error>La cantidad debe ser mayor a 0</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        form="order-form"
        (click)="submit()"
        [disabled]="saving()"
      >
        @if (saving()) { <mat-spinner diameter="18" /> }
        @else { Crear orden }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form {
      display: flex; flex-direction: column; gap: 4px;
      padding-top: 8px; min-width: 340px;
    }
    .dialog-form mat-form-field { width: 100%; }
    mat-dialog-actions { padding: 16px 24px; gap: 8px; }
  `]
})
export class OrderDialogComponent {
  private readonly fb = inject(FormBuilder);
  saving = signal(false);
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<OrderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { products: Product[] }
  ) {
    this.form = this.fb.nonNullable.group({
      product_id: [null as number | null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.dialogRef.close(this.form.value);
  }
}

// ─────────────────────────────────────────────
// Dialog de cambiar estado
// ─────────────────────────────────────────────
@Component({
  selector: 'app-order-status-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Cambiar estado</h2>
    <mat-dialog-content>
      <form [formGroup]="form" id="status-form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select formControlName="status">
            <mat-option value="pendiente">Pendiente</mat-option>
            <mat-option value="en viaje">En viaje</mat-option>
            <mat-option value="entregado">Entregado</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        form="status-form"
        (click)="submit()"
        [disabled]="saving()"
      >
        @if (saving()) { <mat-spinner diameter="18" /> }
        @else { Guardar }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form {
      display: flex; flex-direction: column; gap: 4px;
      padding-top: 8px; min-width: 320px;
    }
    .dialog-form mat-form-field { width: 100%; }
    mat-dialog-actions { padding: 16px 24px; gap: 8px; }
  `]
})
export class OrderStatusDialogComponent {
  private readonly fb = inject(FormBuilder);
  saving = signal(false);
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<OrderStatusDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { status: OrderStatus }
  ) {
    this.form = this.fb.nonNullable.group({
      status: [data.status, Validators.required],
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.dialogRef.close(this.form.value);
  }
}

// ─────────────────────────────────────────────
// Dialog de confirmación de borrado
// ─────────────────────────────────────────────
@Component({
  selector: 'app-order-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Eliminar orden</h2>
    <mat-dialog-content>
      <p>¿Estás seguro de que querés eliminar la orden <strong>#{{ data.id }}</strong>?</p>
      <p class="warn-text">Esta acción no se puede deshacer.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Eliminar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .warn-text { color: #e53e3e; font-size: 13px; margin-top: 4px; }
    mat-dialog-actions { gap: 8px; }
  `]
})
export class OrderConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<OrderConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number }
  ) {}
}

// ─────────────────────────────────────────────
// Orders feature component
// ─────────────────────────────────────────────
@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MetricCardComponent,
    DataTableComponent,
    DataTableCellDirective,
  ],
  template: `
    <div class="orders-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Órdenes</h1>
          <span class="page-subtitle">Gestión de órdenes de venta</span>
        </div>
        <button mat-raised-button color="primary" id="btn-nueva-orden" (click)="openCreate()">
          <mat-icon>add</mat-icon>
          Nueva orden
        </button>
      </div>

      <!-- KPI row -->
      <div class="kpi-row">
        <app-metric-card title="Total órdenes" [value]="totalOrders()"  icon="receipt_long"   color="blue" />
        <app-metric-card title="Pendientes"    [value]="pendingCount()" icon="schedule"        color="orange" />
        <app-metric-card title="En viaje"      [value]="shippingCount()" icon="local_shipping" color="purple" />
        <app-metric-card title="Entregadas"    [value]="deliveredCount()" icon="check_circle"  color="green" />
      </div>

      <!-- Search + Table -->
      <div class="card">
        <div class="table-toolbar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar por # de orden o producto</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [value]="searchTerm()"
                   (input)="onSearch($any($event.target).value)" />
          </mat-form-field>
          <span class="results-count">{{ filteredOrders().length }} resultado(s)</span>
        </div>

        <app-data-table
          [data]="filteredOrders()"
          [columns]="columns"
          [loading]="loading()"
          [actions]="rowActions"
          emptyMessage="No hay órdenes cargadas"
          emptyIcon="receipt_long"
          (actionClick)="onActionClick($event)"
        >
          <ng-template appDataTableCell="id" let-o>#{{ o.id }}</ng-template>
          <ng-template appDataTableCell="productName" let-o>{{ o.productName }}</ng-template>
        </app-data-table>
      </div>
    </div>
  `,
  styles: [`
    .orders-page { display: flex; flex-direction: column; gap: 24px; }

    .page-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 16px;
    }
    .page-title  { font-size: 22px; font-weight: 700; color: #1a1f36; margin: 0; }
    .page-subtitle { font-size: 13px; color: #718096; }

    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .card {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .table-toolbar {
      display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .search-field { flex: 1; min-width: 240px; }
    .results-count { font-size: 13px; color: #718096; white-space: nowrap; }

    .loading-center { display: flex; justify-content: center; padding: 48px; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 48px; color: #a0aec0; text-align: center;
    }
    .empty-state mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .empty-state p { margin: 0; font-size: 14px; }

    :host ::ng-deep .badge[data-status="pendiente"] { background: var(--status-pendiente-bg); color: var(--status-pendiente-fg); }
    :host ::ng-deep .badge[data-status="en viaje"]  { background: var(--status-en-viaje-bg);  color: var(--status-en-viaje-fg); }
    :host ::ng-deep .badge[data-status="entregado"] { background: var(--status-entregado-bg); color: var(--status-entregado-fg); }
  `]
})
export class OrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly productService = inject(ProductService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  columns: TableColumn<OrderRow>[] = [
    { key: 'id',          header: '#',         type: 'custom',   sortable: true },
    { key: 'productName', header: 'Producto',  type: 'custom',   sortable: true },
    { key: 'quantity',    header: 'Cantidad',  type: 'text',     sortable: true },
    { key: 'total_price', header: 'Total ($)', type: 'currency', sortable: true },
    { key: 'status',      header: 'Estado',    type: 'badge',    sortable: true },
    { key: 'created_at',  header: 'Fecha',     type: 'date',     sortable: true },
  ];

  rowActions: TableAction[] = [
    { icon: 'sync',   label: 'Cambiar estado', action: 'status' },
    { icon: 'delete', label: 'Eliminar',       action: 'delete' },
  ];

  loading = signal(true);
  error = signal<string | null>(null);
  orders = signal<Order[]>([]);
  products = signal<Product[]>([]);
  searchTerm = signal('');

  filteredOrders = computed<OrderRow[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const rows = this.orders().map(o => ({ ...o, productName: this.productName(o.product_id) }));
    if (!term) return rows;
    return rows.filter(o =>
      String(o.id).includes(term) ||
      o.productName.toLowerCase().includes(term)
    );
  });

  totalOrders     = computed(() => this.orders().length);
  pendingCount    = computed(() => this.orders().filter(o => o.status === 'pendiente').length);
  shippingCount   = computed(() => this.orders().filter(o => o.status === 'en viaje').length);
  deliveredCount  = computed(() => this.orders().filter(o => o.status === 'entregado').length);

  ngOnInit() {
    this.loadProducts();
    this.loadOrders();
  }

  private loadOrders() {
    this.loading.set(true);
    this.orderService.getAll().subscribe({
      next: data => { this.orders.set(data); this.loading.set(false); },
      error: ()   => { this.loading.set(false); this.notify('Error al cargar órdenes', true); }
    });
  }

  private loadProducts() {
    this.productService.getAll().subscribe({
      next: data => this.products.set(data),
      error: () => {}
    });
  }

  productName(productId: number): string {
    const product = this.products().find(p => p.id === productId);
    return product ? product.name : `Producto #${productId}`;
  }

  onSearch(term: string) {
    this.searchTerm.set(term);
  }

  onActionClick(event: { action: string; row: OrderRow }) {
    if (event.action === 'status') this.openStatusChange(event.row);
    if (event.action === 'delete') this.openDelete(event.row);
  }

  openCreate() {
    const ref = this.dialog.open(OrderDialogComponent, { data: { products: this.products() }, width: '420px' });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const req: CreateOrderRequest = result;
      this.orderService.create(req).subscribe({
        next: o  => { this.orders.update(list => [o, ...list]); this.notify('Orden creada'); },
        error: () => this.notify('Error al crear la orden (stock insuficiente)', true)
      });
    });
  }

  openStatusChange(order: OrderRow) {
    const ref = this.dialog.open(OrderStatusDialogComponent, { data: { status: order.status }, width: '380px' });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const req: UpdateOrderStatusRequest = result;
      this.orderService.updateStatus(order.id, req).subscribe({
        next: updated => {
          this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
          this.notify('Estado actualizado');
        },
        error: () => this.notify('Error al actualizar el estado', true)
      });
    });
  }

  openDelete(order: OrderRow) {
    const ref = this.dialog.open(OrderConfirmDialogComponent, { data: { id: order.id }, width: '380px' });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.orderService.delete(order.id).subscribe({
        next: ()  => { this.orders.update(list => list.filter(o => o.id !== order.id)); this.notify('Orden eliminada'); },
        error: () => this.notify('Error al eliminar la orden', true)
      });
    });
  }

  private notify(msg: string, isError = false) {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 3500,
      panelClass: isError ? ['snack-error'] : ['snack-success'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }
}
