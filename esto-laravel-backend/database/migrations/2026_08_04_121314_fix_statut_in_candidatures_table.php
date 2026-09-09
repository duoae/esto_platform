<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE candidatures MODIFY COLUMN statut VARCHAR(50) NOT NULL DEFAULT 'en_attente'");
    }

    public function down(): void
    {
        //
    }
};