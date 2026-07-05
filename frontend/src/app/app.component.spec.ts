import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientModule, HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

/**
 * Rede de seguranca do fluxo da Todo (Fase 7 — test-first).
 *
 * Grupo A (regressao): fixa o happy path que NAO deve mudar. Interage pelo
 * DOM/HTTP (agnostico a implementacao), entao deve sobreviver a extracao de
 * servico e componentes (Fases 8–9). A URL e o envelope do payload sao ajustados
 * quando o contrato /api + { data } entrar (Fase 8); as asseracoes de comportamento
 * (DOM/metodo HTTP) ficam.
 *
 * Grupo B (alvo): comportamentos que o codigo legado ainda NAO cumpre (bugs do
 * fallback fake e da URL sem /api). Ficam `pending()` ate a fase que os corrige.
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
    // O componente legado importa HttpClientModule (backend real); removê-lo deixa o
    // HttpTestingController interceptar. Isso some ao migrar para provideHttpClient (Fase 8).
    TestBed.overrideComponent(AppComponent, { remove: { imports: [HttpClientModule] } });

    fixture = TestBed.createComponent(AppComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ---------- Grupo A: regressao (verde agora) ----------

  it('lista e exibe as tarefas ao iniciar', () => {
    fixture.detectChanges(); // dispara a carga

    const req = httpMock.expectOne(isTarefas);
    expect(req.request.method).toBe('GET');
    req.flush([
      { id: 1, title: 'Comprar pão', completed: false },
      { id: 2, title: 'Estudar Angular', completed: true },
    ]);
    fixture.detectChanges();

    expect(el().textContent).toContain('Comprar pão');
    expect(el().textContent).toContain('Estudar Angular');
  });

  it('exibe estado vazio quando não há tarefas', () => {
    fixture.detectChanges();
    httpMock.expectOne(isTarefas).flush([]);
    fixture.detectChanges();

    expect(el().textContent).toContain('Nenhuma tarefa');
  });

  it('cria uma tarefa e a exibe', () => {
    fixture.detectChanges();
    httpMock.expectOne(isTarefas).flush([]); // GET inicial vazio

    type('Estudar Angular');
    button('Adicionar').click();

    const post = httpMock.expectOne((r) => r.method === 'POST');
    expect(post.request.body).toEqual({ title: 'Estudar Angular' });
    post.flush({ id: 2, title: 'Estudar Angular', completed: false });
    fixture.detectChanges();

    expect(el().textContent).toContain('Estudar Angular');
  });

  it('não cria tarefa com título vazio ou só espaços', () => {
    fixture.detectChanges();
    httpMock.expectOne(isTarefas).flush([]);

    type('    ');
    button('Adicionar').click();

    httpMock.expectNone((r) => r.method === 'POST'); // nenhum POST disparado
  });

  it('remove uma tarefa chamando DELETE com o id', () => {
    fixture.detectChanges();
    httpMock.expectOne(isTarefas).flush([{ id: 7, title: 'Temporária', completed: false }]);
    fixture.detectChanges();

    button('Remover').click();

    const del = httpMock.expectOne((r) => r.method === 'DELETE');
    expect(del.request.url).toMatch(/\/tarefas\/7$/);
    del.flush(null);
    fixture.detectChanges();

    expect(el().textContent).not.toContain('Temporária');
  });

  // ---------- Grupo B: comportamento-alvo (habilitar na fase indicada) ----------

  it('o contrato usa o prefixo /api', () => {
    pending('Alvo: environment.apiUrl -> /api/tarefas (Fase 8).');

    fixture.detectChanges();
    expect(httpMock.expectOne(isTarefas).request.url).toMatch(/\/api\/tarefas/);
  });

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
    httpMock.expectOne(isTarefas).flush([]);
    type('Nova');
    button('Adicionar').click();
    httpMock.expectOne((r) => r.method === 'POST').error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(el().textContent).not.toContain('Nova'); // não deve ter sido adicionada
  });

  it('erro ao remover MANTÉM a tarefa (consistente com o servidor)', () => {
    pending('Alvo: no DELETE com erro, não remover localmente (Fase 9).');

    fixture.detectChanges();
    httpMock.expectOne(isTarefas).flush([{ id: 1, title: 'Fica', completed: false }]);
    fixture.detectChanges();
    button('Remover').click();
    httpMock.expectOne((r) => r.method === 'DELETE').error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(el().textContent).toContain('Fica'); // deve permanecer
  });
});
