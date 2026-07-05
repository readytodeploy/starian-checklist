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

  it('desabilita o botão Adicionar enquanto o título está vazio', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Algo';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(button.disabled).toBe(false);
  });

  it('mostra mensagem de obrigatório ao tentar enviar vazio', () => {
    component.submit(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Informe um título');
  });

  it('não corta o texto: sem atributo maxlength no input', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('maxlength')).toBeNull();
  });

  it('avisa e bloqueia o botão quando passa de 255 caracteres', () => {
    component.title.set('a'.repeat(256));
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('limite');
  });

  it('não emite quando o título passa de 255 caracteres', () => {
    const spy = jasmine.createSpy('add');
    component.add.subscribe(spy);

    component.title.set('a'.repeat(256));
    component.submit(new Event('submit'));

    expect(spy).not.toHaveBeenCalled();
  });

  it('mostra o motivo do bloqueio num tooltip', () => {
    const tooltip = () => fixture.nativeElement.querySelector('.tooltip') as HTMLElement | null;

    // Vazio: tooltip com o motivo "obrigatório".
    expect(tooltip()?.textContent).toContain('Informe um título');

    // Acima do limite: tooltip com o motivo de excesso.
    component.title.set('a'.repeat(256));
    fixture.detectChanges();
    expect(tooltip()?.textContent).toContain('passou de 255');

    // Válido: sem tooltip.
    component.title.set('Comprar pão');
    fixture.detectChanges();
    expect(tooltip()).toBeNull();
  });
});
