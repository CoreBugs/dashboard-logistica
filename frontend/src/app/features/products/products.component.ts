import { Component, inject, signal, computed, OnInit, Inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { ProductService } from '../../core/services/product.service';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { Product, CreateProductRequest, UpdateProductRequest } from '../../core/models/product.model';

// ─────────────────────────────────────────────
// Dialog de crear / editar producto
// ─────────────────────────────────────────────
@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar producto' : 'Nuevo producto' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" id="product-form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>El nombre es requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>SKU</mat-label>
          <input matInput formControlName="sku" />
          @if (form.get('sku')?.hasError('required') && form.get('sku')?.touched) {
            <mat-error>El SKU es requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Precio</mat-label>
          <span matTextPrefix>$&nbsp;</span>
          <input matInput type="number" formControlName="price" min="0" />
          @if (form.get('price')?.hasError('required') && form.get('price')?.touched) {
            <mat-error>El precio es requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Stock</mat-label>
          <input matInput type="number" formControlName="stock" min="0" />
          @if (form.get('stock')?.hasError('required') && form.get('stock')?.touched) {
            <mat-error>El stock es requerido</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        form="product-form"
        (click)="submit()"
        [disabled]="saving()"
      >
        @if (saving()) { <mat-spinner diameter="18" /> }
        @else { {{ data ? 'Guardar cambios' : 'Crear producto' }} }
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
export class ProductDialogComponent {
  private readonly fb = inject(FormBuilder);
  saving = signal(false);
  form!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Product | null
  ) {
    this.form = this.fb.nonNullable.group({
      name:  [data?.name  ?? '', Validators.required],
      sku:   [data?.sku   ?? '', Validators.required],
      price: [data?.price ?? 0, [Validators.required, Validators.min(0)]],
      stock: [data?.stock ?? 0, [Validators.required, Validators.min(0)]],
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
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Eliminar producto</h2>
    <mat-dialog-content>
      <p>¿Estás seguro de que querés eliminar <strong>{{ data.name }}</strong>?</p>
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
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { name: string }
  ) {}
}

// ─────────────────────────────────────────────
// Products feature component
// ─────────────────────────────────────────────
@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatSortModule,
    MatPaginatorModule,
    MetricCardComponent,
  ],
  template: `
    <div class="products-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Productos</h1>
          <span class="page-subtitle">Gestión del catálogo de productos</span>
        </div>
        <button mat-raised-button color="primary" id="btn-nuevo-producto" (click)="openCreate()">
          <mat-icon>add</mat-icon>
          Nuevo producto
        </button>
      </div>

      <!-- KPI row -->
      <div class="kpi-row">
        <app-metric-card title="Total productos" [value]="totalProducts()" icon="inventory_2" color="blue" />
        <app-metric-card title="Sin stock"       [value]="noStock()"      icon="remove_shopping_cart" color="red" />
        <app-metric-card title="Stock bajo"      [value]="lowStock()"     icon="warning" color="orange" subtitle="≤ 5 unidades" />
        <app-metric-card title="Valor inventario" [value]="inventoryValue()" icon="payments" color="green" [subtitle]="inventoryValueFull()" />
      </div>

      <!-- Search + Table -->
      <div class="card">
        <div class="table-toolbar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar por nombre o SKU</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [value]="searchTerm()"
                   (input)="onSearch($any($event.target).value)" />
          </mat-form-field>
          <span class="results-count">{{ sortedProducts().length }} resultado(s)</span>
        </div>

        @if (loading()) {
          <div class="loading-center">
            <mat-spinner diameter="40" />
          </div>
        } @else if (sortedProducts().length === 0) {
          <div class="empty-state">
            <mat-icon>inventory_2</mat-icon>
            <p>{{ searchTerm() ? 'Sin resultados para "' + searchTerm() + '"' : 'No hay productos cargados' }}</p>
          </div>
        } @else {
          <table mat-table [dataSource]="pagedProducts()" matSort
                 (matSortChange)="sort($event)" class="products-table">

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Nombre</th>
              <td mat-cell *matCellDef="let p">
                <span class="product-name">{{ p.name }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="sku">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>SKU</th>
              <td mat-cell *matCellDef="let p">
                <span class="sku-badge">{{ p.sku }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="stock">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Stock</th>
              <td mat-cell *matCellDef="let p">
                <span class="stock-badge" [attr.data-level]="stockLevel(p.stock)">
                  {{ p.stock }} u.
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Precio</th>
              <td mat-cell *matCellDef="let p">{{ p.price | currency:'ARS':'symbol':'1.2-2' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p" class="actions-cell">
                <button mat-icon-button matTooltip="Editar" (click)="openEdit(p)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Eliminar" class="delete-btn" (click)="openDelete(p)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;" class="product-row"></tr>
          </table>

          <mat-paginator
            [length]="sortedProducts().length"
            [pageSize]="pageSize()"
            [pageIndex]="pageIndex()"
            [pageSizeOptions]="[10, 50, 100]"
            (page)="onPage($event)"
            showFirstLastButtons
          />
        }
      </div>
    </div>
  `,
  styles: [`
    .products-page { display: flex; flex-direction: column; gap: 24px; }

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

    .products-table { width: 100%; }
    .products-table th { font-size: 12px; color: #718096; font-weight: 600; }

    .product-name { font-weight: 500; color: #1a1f36; }

    .sku-badge {
      background: #edf2f7; color: #4a5568;
      padding: 2px 8px; border-radius: 4px;
      font-size: 12px; font-family: monospace;
    }

    .stock-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .stock-badge[data-level="ok"]  { background: rgba(56,178,114,0.12); color: #276749; }
    .stock-badge[data-level="low"] { background: rgba(246,173,85,0.12); color: #c97a0a; }
    .stock-badge[data-level="out"] { background: rgba(229,62,62,0.12);  color: #c53030; }

    .actions-cell { text-align: right; white-space: nowrap; }
    .delete-btn { color: #e53e3e; }

    .product-row:hover { background: #f7fafc; }

    mat-paginator {
      border-top: 1px solid #e2e8f0;
      margin-top: 4px;
    }
  `]
})
export class ProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  columns = ['name', 'sku', 'stock', 'price', 'actions'];

  loading = signal(true);
  products = signal<Product[]>([]);
  searchTerm    = signal('');
  sortColumn    = signal<keyof Product | ''>('');
  sortDirection = signal<'asc' | 'desc' | ''>('');
  pageSize      = signal(10);
  pageIndex     = signal(0);

  /** Filter + sort (sin paginar) — usado para el total del paginator */
  sortedProducts = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const col  = this.sortColumn();
    const dir  = this.sortDirection();

    let list = term
      ? this.products().filter(
          p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
        )
      : [...this.products()];

    if (col && dir) {
      list = [...list].sort((a, b) => {
        const va = a[col as keyof Product];
        const vb = b[col as keyof Product];
        const cmp = typeof va === 'string'
          ? (va as string).localeCompare(vb as string, 'es', { sensitivity: 'base' })
          : (va as number) - (vb as number);
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  });

  /** Slice paginado — lo que va a la tabla */
  pagedProducts = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.sortedProducts().slice(start, start + this.pageSize());
  });

  totalProducts  = computed(() => this.products().length);
  noStock        = computed(() => this.products().filter(p => p.stock === 0).length);
  lowStock       = computed(() => this.products().filter(p => p.stock > 0 && p.stock <= 5).length);
  inventoryValue = computed(() => {
    const total = this.products().reduce((acc, p) => acc + p.price * p.stock, 0);
    if (total >= 1_000_000) return `$ ${(total / 1_000_000).toFixed(1)}M`;
    if (total >= 1_000)     return `$ ${(total / 1_000).toFixed(0)}k`;
    return `$ ${total.toFixed(0)}`;
  });

  inventoryValueFull = computed(() => {
    const total = this.products().reduce((acc, p) => acc + p.price * p.stock, 0);
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(total);
  });

  onSearch(term: string) {
    this.searchTerm.set(term);
    this.pageIndex.set(0);   // volver a página 1 al buscar
  }

  sort(event: Sort) {
    this.sortColumn.set(event.active as keyof Product);
    this.sortDirection.set(event.direction as 'asc' | 'desc' | '');
    this.pageIndex.set(0);   // volver a página 1 al ordenar
  }

  onPage(event: PageEvent) {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  stockLevel(stock: number): 'ok' | 'low' | 'out' {
    if (stock === 0) return 'out';
    if (stock <= 5)  return 'low';
    return 'ok';
  }

  ngOnInit() {
    this.loadProducts();
  }

  private loadProducts() {
    this.loading.set(true);
    this.productService.getAll().subscribe({
      next: data => { this.products.set(data); this.loading.set(false); },
      error: ()   => { this.loading.set(false); this.notify('Error al cargar productos', true); }
    });
  }

  openCreate() {
    const ref = this.dialog.open(ProductDialogComponent, { data: null, width: '420px' });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const req: CreateProductRequest = result;
      this.productService.create(req).subscribe({
        next: p  => { this.products.update(list => [p, ...list]); this.notify('Producto creado'); },
        error: () => this.notify('Error al crear el producto', true)
      });
    });
  }

  openEdit(product: Product) {
    const ref = this.dialog.open(ProductDialogComponent, { data: product, width: '420px' });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const req: UpdateProductRequest = result;
      this.productService.update(product.id, req).subscribe({
        next: updated => {
          this.products.update(list => list.map(p => p.id === updated.id ? updated : p));
          this.notify('Producto actualizado');
        },
        error: () => this.notify('Error al actualizar el producto', true)
      });
    });
  }

  openDelete(product: Product) {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { name: product.name }, width: '380px' });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.productService.delete(product.id).subscribe({
        next: ()  => { this.products.update(list => list.filter(p => p.id !== product.id)); this.notify('Producto eliminado'); },
        error: () => this.notify('Error al eliminar el producto', true)
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
