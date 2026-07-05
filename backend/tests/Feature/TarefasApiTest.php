<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use Tests\TestCase;

/**
 * Rede de seguranca da API de tarefas (Fase 1 — test-first).
 *
 * Grupo A (regressao): fixa o comportamento que NAO deve mudar durante o
 * refactor. Deve ficar verde ja contra o codigo atual (JSON file).
 *
 * Grupo B (comportamento-alvo): especifica as melhorias (422 / 404). Fica
 * marcado como skipped ate a Fase 3, quando passa a verde.
 *
 * Obs.: o codigo atual persiste em storage/tarefas.json com file_put_contents
 * cru (nao usa a facade Storage), por isso isolamos controlando esse arquivo.
 * Na Fase 2 (banco de dados) isto vira RefreshDatabase + TaskFactory.
 *
 * Processo isolado por teste: o routes/api.php atual declara funcoes globais
 * (lerTarefas/salvarTarefas) e web.php faz `require` (nao `require_once`), entao
 * recriar a app no mesmo processo dispara "Cannot redeclare function". Isolar
 * cada teste evita isso SEM tocar no codigo de producao. O refactor (Fase 3)
 * remove essas funcoes globais e este isolamento deixa de ser necessario.
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState(false)]
class TarefasApiTest extends TestCase
{
    /**
     * Endpoint atual. Na Fase 3 (rotas movidas para routes/api.php com prefixo)
     * muda para '/api/tarefas' aqui, num unico lugar.
     */
    private string $url = '/tarefas';

    private string $tasksFile;

    private ?string $originalTasks = null;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tasksFile = storage_path('tarefas.json');

        // Preserva o arquivo rastreado do repo para nao sujar a arvore de trabalho.
        $this->originalTasks = File::exists($this->tasksFile)
            ? File::get($this->tasksFile)
            : null;

        // Estado conhecido e isolado para cada teste.
        File::put($this->tasksFile, json_encode([
            ['id' => 1, 'title' => 'Existing task', 'completed' => false],
        ]));
    }

    protected function tearDown(): void
    {
        // Restaura o estado original (ou remove se nao existia antes).
        if ($this->originalTasks !== null) {
            File::put($this->tasksFile, $this->originalTasks);
        } elseif (File::exists($this->tasksFile)) {
            File::delete($this->tasksFile);
        }

        parent::tearDown();
    }

    // ---------- Grupo A: regressao (deve passar ja) ----------

    public function test_list_returns_200_with_tasks(): void
    {
        $this->getJson($this->url)
            ->assertStatus(200)
            ->assertJsonFragment(['title' => 'Existing task']);
    }

    public function test_create_persists_task(): void
    {
        $this->postJson($this->url, ['title' => 'Buy bread'])
            ->assertStatus(201)
            ->assertJsonFragment(['title' => 'Buy bread', 'completed' => false]);

        $this->getJson($this->url)->assertJsonFragment(['title' => 'Buy bread']);
    }

    public function test_delete_existing_task_removes_it(): void
    {
        $created = $this->postJson($this->url, ['title' => 'Temporary'])->json();

        $this->deleteJson("{$this->url}/{$created['id']}")->assertStatus(204);

        $this->getJson($this->url)->assertJsonMissing(['title' => 'Temporary']);
    }

    // ---------- Grupo B: comportamento-alvo (habilitar na Fase 3) ----------

    public function test_create_without_title_returns_422(): void
    {
        $this->markTestSkipped('Comportamento-alvo: validacao chega na Fase 3 (StoreTaskRequest).');

        $this->postJson($this->url, [])->assertStatus(422);
    }

    public function test_delete_missing_task_returns_404(): void
    {
        $this->markTestSkipped('Comportamento-alvo: 404 chega na Fase 3 (route-model binding).');

        $this->deleteJson("{$this->url}/999999")->assertStatus(404);
    }
}
