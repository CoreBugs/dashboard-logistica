import { Component, Directive, input, output, computed, signal, TemplateRef, ContentChildren, QueryList } from '@angular/core';
import { CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

export type TableColumnType = 'text' | 'date' | 'currency' | 'badge' | 'custom';

export interface TableColumn<T> {
  key: keyof T & string;
  header: string;
  type: TableColumnType;
  sortable?: boolean;
}

export interface TableAction {
  icon: string;
  label: string;
  action: string;
}

/** Permite proveer un template custom para una columna: <ng-template appDataTableCell="key">...</ng-template> */
@Directive({
  selector: '[appDataTableCell]',
  standalone: true,
})
export class DataTableCellDirective<T = any> {
  appDataTableCell = input.required<string>();
  constructor(public templateRef: TemplateRef<{ $implicit: T }>) {}
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CurrencyPipe,
    NgTemplateOutlet,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatPaginatorModule,
  ],
  template: `
    @if (loading()) {
      <div class="loading-center">
        <mat-spinner diameter="40" />
      </div>
    } @else if (data().length === 0) {
      <div class="empty-state">
        <mat-icon>{{ emptyIcon() }}</mat-icon>
        <p>{{ emptyMessage() }}</p>
      </div>
    } @else {
      <table mat-table [dataSource]="pagedData()" matSort (matSortChange)="onSort($event)" class="data-table">
        @for (col of columns(); track col.key) {
          <ng-container [matColumnDef]="col.key">
            <th mat-header-cell *matHeaderCellDef [mat-sort-header]="col.sortable ? col.key : ''" [disabled]="!col.sortable">
              {{ col.header }}
            </th>
            <td mat-cell *matCellDef="let row">
              @switch (col.type) {
                @case ('currency') {
                  {{ asNumber(row[col.key]) | currency:'ARS':'symbol':'1.2-2' }}
                }
                @case ('date') {
                  {{ formatDate(row[col.key]) }}
                }
                @case ('badge') {
                  <span class="badge" [attr.data-status]="row[col.key]">{{ row[col.key] }}</span>
                }
                @case ('custom') {
                  <ng-container [ngTemplateOutlet]="cellTemplate(col.key)" [ngTemplateOutletContext]="{ $implicit: row }" />
                }
                @default {
                  {{ row[col.key] }}
                }
              }
            </td>
          </ng-container>
        }

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let row" class="actions-cell">
            @for (a of actions(); track a.action) {
              <button mat-icon-button [matTooltip]="a.label" (click)="actionClick.emit({ action: a.action, row })">
                <mat-icon>{{ a.icon }}</mat-icon>
              </button>
            }
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columnKeys()"></tr>
        <tr mat-row *matRowDef="let row; columns: columnKeys();" class="data-row"></tr>
      </table>

      <mat-paginator
        [length]="data().length"
        [pageSize]="pageSize()"
        [pageIndex]="pageIndex()"
        [pageSizeOptions]="pageSizeOptions()"
        (page)="onPage($event)"
        showFirstLastButtons
      />
    }
  `,
  styles: [`
    :host { display: block; }

    .loading-center { display: flex; justify-content: center; padding: 48px; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 48px; color: #a0aec0; text-align: center;
    }
    .empty-state mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .empty-state p { margin: 0; font-size: 14px; }

    .data-table { width: 100%; }
    .data-table th { font-size: 12px; color: #718096; font-weight: 600; }

    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: capitalize;
    }

    .actions-cell { text-align: right; white-space: nowrap; }

    .data-row:hover { background: #f7fafc; }

    mat-paginator {
      border-top: 1px solid #e2e8f0;
      margin-top: 4px;
    }
  `]
})
export class DataTableComponent<T extends Record<string, any>> {
  data = input.required<T[]>();
  columns = input.required<TableColumn<T>[]>();
  loading = input(false);
  pageSizeOptions = input<number[]>([5, 10, 25, 50]);
  actions = input<TableAction[]>([]);
  emptyMessage = input('No hay datos cargados');
  emptyIcon = input('inbox');

  @ContentChildren(DataTableCellDirective) cellTemplates!: QueryList<DataTableCellDirective<T>>;

  actionClick = output<{ action: string; row: T }>();

  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc' | ''>('');
  pageSize = signal(10);
  pageIndex = signal(0);

  columnKeys = computed(() => [...this.columns().map(c => c.key), 'actions']);

  sortedData = computed(() => {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    let list = [...this.data()];

    if (col && dir) {
      list.sort((a, b) => {
        const va = a[col];
        const vb = b[col];
        const cmp = typeof va === 'string'
          ? va.localeCompare(vb, 'es', { sensitivity: 'base' })
          : va - vb;
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  });

  pagedData = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.sortedData().slice(start, start + this.pageSize());
  });

  cellTemplate(key: string): TemplateRef<{ $implicit: T }> | null {
    const found = this.cellTemplates?.find(t => t.appDataTableCell() === key);
    return found?.templateRef ?? null;
  }

  asNumber(value: any): number {
    return value;
  }

  formatDate(value: any): string {
    return new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  onSort(event: Sort) {
    this.sortColumn.set(event.active);
    this.sortDirection.set(event.direction);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent) {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }
}
