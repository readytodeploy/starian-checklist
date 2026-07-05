<?php

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Rede de seguranca da API de tarefas.
 *
 * Depois do cutover (Fase 3) a persistencia e via Eloquent, entao usamos
 * RefreshDatabase + TaskFactory. Todos os testes (regressao + alvo) verdes.
 */
class TarefasApiTest extends TestCase
{
    use RefreshDatabase;

    private string $url = '/api/tarefas';

    // ---------- Grupo A: regressao (comportamento que nao muda) ----------

    public function test_list_returns_200_with_tasks(): void
    {
        Task::factory()->create(['title' => 'Existing task']);

        $this->getJson($this->url)
            ->assertStatus(200)
            ->assertJsonFragment(['title' => 'Existing task']);
    }

    public function test_create_persists_task(): void
    {
        $this->postJson($this->url, ['title' => 'Buy bread'])
            ->assertStatus(201)
            ->assertJsonFragment(['title' => 'Buy bread', 'completed' => false]);

        $this->assertDatabaseHas('tasks', ['title' => 'Buy bread', 'completed' => false]);
    }

    public function test_delete_existing_task_removes_it(): void
    {
        $task = Task::factory()->create();

        $this->deleteJson("{$this->url}/{$task->id}")->assertStatus(204);

        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }

    // ---------- Grupo B: comportamento-alvo (melhorias do refactor) ----------

    public function test_create_without_title_returns_422(): void
    {
        $this->postJson($this->url, [])->assertStatus(422);
    }

    public function test_delete_missing_task_returns_404(): void
    {
        $this->deleteJson("{$this->url}/999999")->assertStatus(404);
    }
}
