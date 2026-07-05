import { TestBed, ComponentFixture } from '@angular/core/testing';

import { TodoFormComponent } from './todo-form.component';

describe('TodoFormComponent', () => {
  let fixture: ComponentFixture<TodoFormComponent>;
  let component: TodoFormComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TodoFormComponent] });
    fixture = TestBed.createComponent(TodoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emite o título (com trim) ao enviar', () => {
    let emitted: string | undefined;
    component.add.subscribe((value) => (emitted = value));

    component.title.set('  Comprar pão  ');
    component.submit(new Event('submit'));

    expect(emitted).toBe('Comprar pão');
  });

  it('não emite quando o título é vazio ou só espaços', () => {
    const spy = jasmine.createSpy('add');
    component.add.subscribe(spy);

    component.title.set('   ');
    component.submit(new Event('submit'));

    expect(spy).not.toHaveBeenCalled();
  });

  it('limpa o título após emitir', () => {
    component.title.set('Nova');
    component.submit(new Event('submit'));

    expect(component.title()).toBe('');
  });

  it('atualiza o título ao digitar no input', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Digitado';
    input.dispatchEvent(new Event('input'));

    expect(component.title()).toBe('Digitado');
  });
});
