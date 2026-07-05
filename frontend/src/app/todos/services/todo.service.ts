import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Todo } from '../models/todo.model';

/**
 * Camada de dados das tarefas. Encapsula o HTTP e desenvelopa o `{ data }`
 * do backend (API Resource) para `Todo`/`Todo[]`.
 */
@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/tarefas`;

  getAll(): Observable<Todo[]> {
    return this.http.get<{ data: Todo[] }>(this.url).pipe(map((response) => response.data));
  }

  add(title: string): Observable<Todo> {
    return this.http
      .post<{ data: Todo }>(this.url, { title })
      .pipe(map((response) => response.data));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
