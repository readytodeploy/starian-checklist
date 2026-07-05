import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Todo } from './models/todo.model';
import { TodoService } from './services/todo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly todoService = inject(TodoService);

  title = 'Todo List';
  todos: Todo[] = [];
  newTodo = { title: '' };

  ngOnInit(): void {
    this.todoService.getAll().subscribe({
      next: (todos) => (this.todos = todos),
      // NOTA: fallback "fake" e mutação otimista permanecem até a Fase 9.
      error: (erro) => {
        console.error('Erro ao carregar tarefas:', erro);
        this.todos = [
          { id: 1, title: 'Tarefa offline 1', completed: false },
          { id: 2, title: 'Tarefa offline 2', completed: true },
        ];
      },
    });
  }

  addTodo(): void {
    const title = this.newTodo.title.trim();
    if (!title) return;

    this.todoService.add(title).subscribe({
      next: (todo) => {
        this.todos.push(todo);
        this.newTodo = { title: '' };
      },
      error: (erro) => {
        console.error('Erro ao adicionar tarefa:', erro);
        this.todos.push({ id: Math.floor(Math.random() * 1000), title, completed: false });
        this.newTodo = { title: '' };
      },
    });
  }

  removeTodo(id: number): void {
    this.todoService.remove(id).subscribe({
      next: () => (this.todos = this.todos.filter((todo) => todo.id !== id)),
      error: (erro) => {
        console.error('Erro ao remover tarefa:', erro);
        this.todos = this.todos.filter((todo) => todo.id !== id);
      },
    });
  }
}
