import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-todo-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './todo-form.component.html',
  styleUrl: './todo-form.component.scss',
})
export class TodoFormComponent {
  readonly add = output<string>();
  readonly title = signal('');

  submit(event: Event): void {
    event.preventDefault();
    const value = this.title().trim();
    if (!value) {
      return;
    }
    this.add.emit(value);
    this.title.set('');
  }
}
