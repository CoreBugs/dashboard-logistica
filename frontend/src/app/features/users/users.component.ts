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

import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { DataTableComponent, DataTableCellDirective, TableColumn, TableAction } from '../../shared/components/data-table/data-table.component';
import { User, UserRole, CreateUserRequest, UpdateUserRequest } from '../../core/models/user.model';

// ─────────────────────────────────────────────
// Dialog de crear / editar usuario
// ─────────────────────────────────────────────
@Component({
  selector: 'app-user-dialog',
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
    <h2 mat-dialog-title>{{ data ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" id="user-form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>El nombre es requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
          @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
            <mat-error>El email es requerido</mat-error>
          }
          @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
            <mat-error>El email no es válido</mat-error>
          }
        </mat-form-field>

        @if (!data) {
          <mat-form-field appearance="outline">
            <mat-label>Contraseña</mat-label>
            <input matInput type="password" formControlName="password" />
            @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
              <mat-error>La contraseña es requerida</mat-error>
            }
            @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
              <mat-error>La contraseña debe tener al menos 6 caracteres</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="role">
            <mat-option value="admin">Admin</mat-option>
            <mat-option value="repartidor">Repartidor</mat-option>
          </mat-select>
          @if (form.get('role')?.hasError('required') && form.get('role')?.touched) {
            <mat-error>El rol es requerido</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        form="user-form"
        (click)="submit()"
        [disabled]="saving()"
      >
        @if (saving()) { <mat-spinner diameter="18" /> }
        @else { {{ data ? 'Guardar cambios' : 'Crear usuario' }} }
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
export class UserDialogComponent {
  private readonly fb = inject(FormBuilder);
  saving = signal(false);
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User | null
  ) {
    this.form = this.fb.nonNullable.group({
      name:  [data?.name  ?? '', Validators.required],
      email: [data?.email ?? '', [Validators.required, Validators.email]],
      ...(data ? {} : { password: ['', [Validators.required, Validators.minLength(6)]] }),
      role:  [data?.role  ?? 'repartidor' as UserRole, Validators.required],
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
  selector: 'app-user-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Eliminar usuario</h2>
    <mat-dialog-content>
      <p>¿Estás seguro de que querés eliminar a <strong>{{ data.name }}</strong>?</p>
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
export class UserConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<UserConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { name: string }
  ) {}
}

// ─────────────────────────────────────────────
// Users feature component
// ─────────────────────────────────────────────
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DataTableComponent,
    DataTableCellDirective,
  ],
  template: `
    <div class="users-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Usuarios</h1>
          <span class="page-subtitle">Gestión de usuarios del sistema</span>
        </div>
        <button mat-raised-button color="primary" id="btn-nuevo-usuario" (click)="openCreate()">
          <mat-icon>add</mat-icon>
          Nuevo usuario
        </button>
      </div>

      <!-- Search + Table -->
      <div class="card">
        <div class="table-toolbar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar por nombre o email</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [value]="searchTerm()"
                   (input)="onSearch($any($event.target).value)" />
          </mat-form-field>
          <span class="results-count">{{ filteredUsers().length }} resultado(s)</span>
        </div>

        <app-data-table
          [data]="filteredUsers()"
          [columns]="columns"
          [loading]="loading()"
          [actions]="rowActions"
          [isActionDisabled]="isActionDisabled"
          emptyMessage="No hay usuarios cargados"
          emptyIcon="group"
          (actionClick)="onActionClick($event)"
        >
          <ng-template appDataTableCell="id" let-u>#{{ u.id }}</ng-template>
        </app-data-table>
      </div>
    </div>
  `,
  styles: [`
    .users-page { display: flex; flex-direction: column; gap: 24px; }

    .page-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 16px;
    }
    .page-title  { font-size: 22px; font-weight: 700; color: #1a1f36; margin: 0; }
    .page-subtitle { font-size: 13px; color: #718096; }

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

    :host ::ng-deep .badge[data-status="admin"]      { background: var(--role-admin-bg);      color: var(--role-admin-fg); }
    :host ::ng-deep .badge[data-status="repartidor"] { background: var(--role-repartidor-bg);  color: var(--role-repartidor-fg); }
  `]
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  columns: TableColumn<User>[] = [
    { key: 'id',         header: '#',                type: 'custom', sortable: true },
    { key: 'name',       header: 'Nombre',           type: 'text',   sortable: true },
    { key: 'email',      header: 'Email',            type: 'text',   sortable: true },
    { key: 'role',       header: 'Rol',              type: 'badge',  sortable: true },
    { key: 'created_at', header: 'Fecha de creación', type: 'date',   sortable: true },
  ];

  rowActions: TableAction[] = [
    { icon: 'edit',   label: 'Editar',   action: 'edit' },
    { icon: 'delete', label: 'Eliminar', action: 'delete' },
  ];

  loading = signal(true);
  users = signal<User[]>([]);
  searchTerm = signal('');

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.users();
    return this.users().filter(
      u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    );
  });

  isSelf(user: User): boolean {
    return this.auth.currentUser()?.id === user.id;
  }

  isActionDisabled = (action: string, user: User): boolean => {
    return action === 'delete' && this.isSelf(user);
  };

  onSearch(term: string) {
    this.searchTerm.set(term);
  }

  onActionClick(event: { action: string; row: User }) {
    if (event.action === 'edit') this.openEdit(event.row);
    if (event.action === 'delete') this.openDelete(event.row);
  }

  ngOnInit() {
    this.loadUsers();
  }

  private loadUsers() {
    this.loading.set(true);
    this.userService.getAll().subscribe({
      next: data => { this.users.set(data); this.loading.set(false); },
      error: ()   => { this.loading.set(false); this.notify('Error al cargar usuarios', true); }
    });
  }

  openCreate() {
    const ref = this.dialog.open(UserDialogComponent, { data: null, width: '420px' });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const req: CreateUserRequest = result;
      this.userService.create(req).subscribe({
        next: u  => { this.users.update(list => [u, ...list]); this.notify('Usuario creado'); },
        error: () => this.notify('Error al crear el usuario', true)
      });
    });
  }

  openEdit(user: User) {
    const ref = this.dialog.open(UserDialogComponent, { data: user, width: '420px' });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const req: UpdateUserRequest = result;
      this.userService.update(user.id, req).subscribe({
        next: updated => {
          this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
          this.notify('Usuario actualizado');
        },
        error: () => this.notify('Error al actualizar el usuario', true)
      });
    });
  }

  openDelete(user: User) {
    if (this.isSelf(user)) return;
    const ref = this.dialog.open(UserConfirmDialogComponent, { data: { name: user.name }, width: '380px' });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.userService.delete(user.id).subscribe({
        next: ()  => { this.users.update(list => list.filter(u => u.id !== user.id)); this.notify('Usuario eliminado'); },
        error: () => this.notify('Error al eliminar el usuario', true)
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
