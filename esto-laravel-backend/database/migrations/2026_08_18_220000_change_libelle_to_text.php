<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement('ALTER TABLE axes_equipe MODIFY libelle TEXT');
        DB::statement('ALTER TABLE thematiques_labo MODIFY libelle TEXT');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE axes_equipe MODIFY libelle VARCHAR(255)');
        DB::statement('ALTER TABLE thematiques_labo MODIFY libelle VARCHAR(255)');
    }
};
