import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TodoService } from './todo.service';
import { Todo } from '../models/todo.model';
import { environment } from '../../environments/environment';

describe('TodoService', () => {
  let service: TodoService;
  let httpMock: HttpTestingController;
  const url = `${environment.apiUrl}/tarefas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TodoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll faz GET em /api/tarefas e desenvelopa data', () => {
    let result: Todo[] | undefined;
    service.getAll().subscribe((r) => (result = r));

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    expect(url).toMatch(/\/api\/tarefas$/);
    req.flush({ data: [{ id: 1, title: 'A', completed: false }] });

    expect(result).toEqual([{ id: 1, title: 'A', completed: false }]);
  });

  it('add faz POST { title } e desenvelopa data', () => {
    let result: Todo | undefined;
    service.add('Nova').subscribe((r) => (result = r));

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Nova' });
    req.flush({ data: { id: 2, title: 'Nova', completed: false } });

    expect(result).toEqual({ id: 2, title: 'Nova', completed: false });
  });

  it('remove faz DELETE no id', () => {
    service.remove(3).subscribe();

    const req = httpMock.expectOne(`${url}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
