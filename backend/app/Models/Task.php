<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    /** @use HasFactory<\Database\Factories\TaskFactory> */
    use HasFactory;

    protected $fillable = [
        'title',
        'completed',
    ];

    protected $casts = [
        'completed' => 'boolean',
    ];

    /**
     * Valores padrao do model (garante completed=false na instancia recem-criada,
     * nao apenas no default da coluna).
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'completed' => false,
    ];
}
