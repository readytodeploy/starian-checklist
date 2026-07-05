<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\Response;

class TaskController extends Controller
{
    /**
     * Lista todas as tarefas (mais recentes primeiro).
     */
    #[OA\Get(
        path: '/api/tarefas',
        summary: 'Lista todas as tarefas',
        tags: ['Tarefas'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de tarefas',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/Task')
                        ),
                    ]
                )
            ),
        ]
    )]
    public function index(): AnonymousResourceCollection
    {
        return TaskResource::collection(Task::latest()->get());
    }

    /**
     * Cria uma nova tarefa a partir de dados validados.
     */
    #[OA\Post(
        path: '/api/tarefas',
        summary: 'Cria uma nova tarefa',
        tags: ['Tarefas'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['title'],
                properties: [
                    new OA\Property(property: 'title', type: 'string', maxLength: 255, example: 'Comprar pão'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Tarefa criada',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/Task'),
                    ]
                )
            ),
            new OA\Response(response: 422, description: 'Falha de validação'),
        ]
    )]
    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = Task::create($request->validated());

        return (new TaskResource($task))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Remove uma tarefa. Route-model binding devolve 404 se nao existir.
     */
    #[OA\Delete(
        path: '/api/tarefas/{task}',
        summary: 'Remove uma tarefa',
        tags: ['Tarefas'],
        parameters: [
            new OA\Parameter(
                name: 'task',
                in: 'path',
                required: true,
                description: 'ID da tarefa',
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(response: 204, description: 'Tarefa removida'),
            new OA\Response(response: 404, description: 'Tarefa não encontrada'),
        ]
    )]
    public function destroy(Task $task): Response
    {
        $task->delete();

        return response()->noContent();
    }
}
