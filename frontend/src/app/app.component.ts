import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { Todo } from './todos/models/todo.model';
import { TodoService } from './todos/services/todo.service';
import { TodoFormComponent } from './todos/components/todo-form/todo-form.component';
import { TodoListComponent } from './todos/components/todo-list/todo-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TodoFormComponent, TodoListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly todoService = inject(TodoService);

  readonly title = 'Todo List';
  readonly todos = signal<Todo[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.todoService.getAll().subscribe({
      next: (todos) => {
        this.todos.set(todos);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar as tarefas.');
        this.loading.set(false);
      },
    });
  }

  onAdd(title: string): void {
    this.error.set(null);
    this.todoService.add(title).subscribe({
      next: (todo) => this.todos.update((list) => [...list, todo]),
      error: () => this.error.set('Não foi possível adicionar a tarefa.'),
    });
  }

  onRemove(id: number): void {
    this.error.set(null);
    this.todoService.remove(id).subscribe({
      next: () => this.todos.update((list) => list.filter((todo) => todo.id !== id)),
      error: () => this.error.set('Não foi possível remover a tarefa.'),
    });
  }
}
