import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/users';

  getAll() {
    return this.http.get<User[]>(this.apiUrl);
  }

  getById(id: number) {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateUserRequest) {
    return this.http.post<User>(this.apiUrl, data);
  }

  update(id: number, data: UpdateUserRequest) {
    return this.http.put<User>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
