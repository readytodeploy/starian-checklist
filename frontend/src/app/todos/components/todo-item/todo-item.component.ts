import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Todo } from '../../models/todo.model';

@Component({
  selector: 'app-todo-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './todo-item.component.html',
  styleUrl: './todo-item.component.scss',
})
export class TodoItemComponent {
  readonly todo = input.required<Todo>();
  readonly remove = output<number>();
}
