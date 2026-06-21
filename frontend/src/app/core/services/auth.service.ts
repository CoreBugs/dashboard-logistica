import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of, tap } from 'rxjs';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080';

  private _token = signal<string | null>(null);
  private _user = signal<LoginResponse['user'] | null>(null);

  isAuthenticated = computed(() => !!this._token());
  currentUser = computed(() => this._user());
  token = computed(() => this._token());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap(res => {
          this._token.set(res.token);
          this._user.set(res.user);
        })
      );
  }

  refresh() {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/refresh`, null, { withCredentials: true })
      .pipe(
        tap(res => {
          this._token.set(res.token);
          this._user.set(res.user);
        }),
        catchError(() => {
          this._token.set(null);
          this._user.set(null);
          return of(null);
        })
      );
  }

  logout() {
    this.http.post(`${this.apiUrl}/auth/logout`, null, { withCredentials: true }).subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout()
    });
  }

  private finishLogout() {
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }
}
