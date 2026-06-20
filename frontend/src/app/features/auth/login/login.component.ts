import { Component, signal, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-header">
          <mat-icon class="login-logo">local_shipping</mat-icon>
          <h1>LogiDash</h1>
          <p>Sistema de gestión logística</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" />
            <mat-icon matSuffix>email</mat-icon>
            @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
              <mat-error>El email es requerido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Contraseña</mat-label>
            <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" />
            <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
              <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
              <mat-error>La contraseña es requerida</mat-error>
            }
          </mat-form-field>

          @if (errorMsg()) {
            <div class="error-banner">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMsg() }}</span>
            </div>
          }

          <button
            mat-raised-button
            color="primary"
            type="submit"
            class="submit-btn"
            [disabled]="loading()"
          >
            @if (loading()) {
              <mat-spinner diameter="20" />
            } @else {
              Ingresar
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--sidebar-bg);
    }
    .login-card {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 48px 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .login-header .login-logo { font-size: 48px; width: 48px; height: 48px; color: var(--sidebar-accent); }
    .login-header h1 { font-size: 24px; font-weight: 700; color: var(--sidebar-bg); margin: 8px 0 4px; }
    .login-header p { color: #718096; font-size: 14px; }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .login-form mat-form-field { width: 100%; }
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fff5f5;
      border: 1px solid #fed7d7;
      border-radius: 6px;
      padding: 10px 14px;
      color: #c53030;
      font-size: 13px;
    }
    .error-banner mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .submit-btn {
      height: 48px;
      font-size: 15px;
      font-weight: 600;
      margin-top: 8px;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  hidePassword = signal(true);
  loading = signal(false);
  errorMsg = signal('');

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.form.value.email!, this.form.value.password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.errorMsg.set('Email o contraseña incorrectos');
        this.loading.set(false);
      }
    });
  }
}
