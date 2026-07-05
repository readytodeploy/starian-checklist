import { TestBed, ComponentFixture } from '@angular/core/testing';

import { TodoListComponent } from './todo-list.component';
import { Todo } from '../../models/todo.model';

describe('TodoListComponent', () => {
  let fixture: ComponentFixture<TodoListComponent>;

  const setTodos = (todos: Todo[]) => {
    fixture.componentRef.setInput('todos', todos);
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TodoListComponent] });
    fixture = TestBed.createComponent(TodoListComponent);
  });

  it('renderiza um item por tarefa', () => {
    setTodos([
      { id: 1, title: 'A', completed: false },
      { id: 2, title: 'B', completed: true },
    ]);

    expect(fixture.nativeElement.querySelectorAll('app-todo-item').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('A');
    expect(fixture.nativeElement.textContent).toContain('B');
  });

  it('exibe o estado vazio quando não há tarefas', () => {
    setTodos([]);

    expect(fixture.nativeElement.querySelectorAll('app-todo-item').length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Nenhuma tarefa');
  });

  it('propaga o remove emitido por um item filho', () => {
    setTodos([{ id: 7, title: 'A', completed: false }]);
    let removedId: number | undefined;
    fixture.componentInstance.remove.subscribe((id) => (removedId = id));

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(removedId).toBe(7);
  });
});
