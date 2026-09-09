<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE sujets_these MODIFY COLUMN statut ENUM('disponible', 'attribue', 'indisponible', 'en attente') DEFAULT 'en attente'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE sujets_these MODIFY COLUMN statut ENUM('disponible', 'attribue', 'indisponible') DEFAULT 'disponible'");
    }
};
