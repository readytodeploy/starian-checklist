import { TestBed, ComponentFixture } from '@angular/core/testing';

import { TodoItemComponent } from './todo-item.component';
import { Todo } from '../../models/todo.model';

describe('TodoItemComponent', () => {
  let fixture: ComponentFixture<TodoItemComponent>;

  const setTodo = (todo: Todo) => {
    fixture.componentRef.setInput('todo', todo);
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TodoItemComponent] });
    fixture = TestBed.createComponent(TodoItemComponent);
  });

  it('exibe o título da tarefa', () => {
    setTodo({ id: 1, title: 'Comprar pão', completed: false });
    expect(fixture.nativeElement.textContent).toContain('Comprar pão');
  });

  it('aplica a classe "completed" quando concluída', () => {
    setTodo({ id: 1, title: 'A', completed: true });
    const span = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(span.classList).toContain('completed');
  });

  it('não aplica "completed" quando não concluída', () => {
    setTodo({ id: 1, title: 'A', completed: false });
    const span = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(span.classList).not.toContain('completed');
  });

  it('emite remove com o id ao clicar em Remover', () => {
    setTodo({ id: 42, title: 'A', completed: false });
    let removedId: number | undefined;
    fixture.componentInstance.remove.subscribe((id) => (removedId = id));

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(removedId).toBe(42);
  });
});
