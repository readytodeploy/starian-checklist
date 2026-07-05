import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

/**
 * Rede de seguranca do fluxo da Todo.
 *
 * Grupo A (regressao): fixa o happy path que NAO deve mudar. Interage pelo
 * DOM/HTTP (agnostico a implementacao), entao sobrevive a extracao de componentes
 * (Fase 9). Desde a Fase 8 o contrato e /api/tarefas com envelope { data }.
 *
 * Grupo B (alvo): comportamentos de erro que o codigo legado ainda NAO cumpre
 * (fallback fake e mutacao otimista). Ficam `pending()` ate a Fase 9.
 */
describe('AppComponent — rede de seguranca do fluxo', () => {
  let fixture: ComponentFixture<AppComponent>;
  let httpMock: HttpTestingController;

  const isTarefas = (r: HttpRequest<unknown>) => /tarefas/.test(r.url);
  const el = () => fixture.nativeElement as HTMLElement;
  const input = () => el().querySelector('input') as HTMLInputElement;
  const button = (text: string) =>
    Array.from(el().querySelectorAll('button')).find((b) => b.textContent?.includes(text)) as HTMLButtonElement;

  const type = (value: string) => {
    input().value = value;
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(AppComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ---------- Grupo A: regressao (verde) ----------

  it('lista e exibe as tarefas ao iniciar', () => {
    fixture.detectChanges(); // dispara a carga

    const req = httpMock.expectOne(isTarefas);
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [
        { id: 1, title: 'Comprar pão', completed: false },
        { id: 2, title: 'Estudar Angular', completed: true },
      ],
    });
    fixture.detectChanges();

    expect(el().textContent).toContain('Comprar pão');
    expect(el().textContent).toContain('Estudar Angular');
  });

  it('o contrato usa o prefixo /api', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(isTarefas);
    expect(req.request.url).toMatch(/\/api\/tarefas/);
    req.flush({ data: [] });
  });

  it('exibe estado vazio quando não há tarefas', () => {
    fixture.detectChanges();
    httpMock.expectOne(isTarefas).flush({ data: [] });
    fixture.detectChanges();

    expect(el().textContent).toContain('Nenhuma tarefa');
  });

  it('cria uma tarefa e a exibe', () => {
    fixture.detectChanges();
    httpMock.expectOne(isTarefas).flush({ data: [] }); // GET inicial vazio

    type('Estudar Angular');
    button('Adicionar').click();

    const post = httpMock.expectOne((r) => r.method === 'POST');
    expect(post.request.body).toEqual({ title: 'Estudar Angular' });
    post.flush({ data: { id: 2, title: 'Estudar Angular', completed: false } });
    fixture.detectChanges();

    expect(el().textContent).toContain('Estudar Angular');
  });

  it('não cria tarefa com título vazio ou só espaços', () => {
    fixture.detectChanges();
    httpMock.expectOne(isTarefas).flush({ data: [] });

    type('    ');
    button('Adicionar').click();

    httpMock.expectNone((r) => r.method === 'POST'); // nenhum POST disparado
  });

  it('remove uma tarefa chamando DELETE com o id', () => {
    fixture.detectChanges();
    httpMock.expectOne(isTarefas).flush({ data: [{ id: 7, title: 'Temporária', completed: false }] });
    fixture.detectChanges();

    button('Remover').click();

    const del = httpMock.expectOne((r) => r.method === 'DELETE');
    expect(del.request.url).toMatch(/\/tarefas\/7$/);
    del.flush(null);
    fixture.detectChanges();

    expect(el().textContent).not.toContain('Temporária');
  });

  // ---------- Grupo B: comportamento-alvo (habilitar na Fase 9) ----------

  it('erro ao listar mostra mensagem e NAO dados fake', () => {
    pending('Alvo: remover o fallback fake e exibir erro na UI (Fase 9).');

    fixture.detectChanges();
    httpMock.expectOne(isTarefas).error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(el().textContent).not.toContain('offline');
  });

  it('erro ao criar NAO adiciona tarefa fabricada', () => {
    pending('Alvo: no POST com erro, mostrar erro em vez de inventar tarefa (Fase 9).');

    fixture.detectChanges();
    httpMock.expectOne(isTarefas).flush({ data: [] });
    type('Nova');
    button('Adicionar').click();
    httpMock.expectOne((r) => r.method === 'POST').error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(el().textContent).not.toContain('Nova');
  });

  it('erro ao remover MANTÉM a tarefa (consistente com o servidor)', () => {
    pending('Alvo: no DELETE com erro, não remover localmente (Fase 9).');

    fixture.detectChanges();
    httpMock.expectOne(isTarefas).flush({ data: [{ id: 1, title: 'Fica', completed: false }] });
    fixture.detectChanges();
    button('Remover').click();
    httpMock.expectOne((r) => r.method === 'DELETE').error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(el().textContent).toContain('Fica');
  });
});
