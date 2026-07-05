<?php

use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

// Recurso de tarefas: index (GET), store (POST) e destroy (DELETE).
// parameters() mapeia {tarefa} -> {task} para casar o route-model binding
// com destroy(Task $task).
Route::apiResource('tarefas', TaskController::class)
    ->only(['index', 'store', 'destroy'])
    ->parameters(['tarefas' => 'task']);
