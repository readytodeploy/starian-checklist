<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'Tarefas API',
    description: 'API de tarefas da Todo List (Laravel + Angular).'
)]
#[OA\Server(
    url: 'http://localhost:8000',
    description: 'Servidor local'
)]
abstract class Controller
{
    //
}
