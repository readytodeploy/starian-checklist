<?php

namespace Database\Seeders;

use App\Models\Task;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    /**
     * Semeia as tarefas iniciais (paridade com o antigo tarefas.json).
     * Idempotente: firstOrCreate por title evita duplicar em re-execucoes.
     */
    public function run(): void
    {
        $tasks = [
            ['title' => 'Tarefa 1', 'completed' => false],
            ['title' => 'Tarefa 2', 'completed' => true],
            ['title' => 'Tarefa 3', 'completed' => false],
        ];

        foreach ($tasks as $task) {
            Task::firstOrCreate(['title' => $task['title']], $task);
        }
    }
}
