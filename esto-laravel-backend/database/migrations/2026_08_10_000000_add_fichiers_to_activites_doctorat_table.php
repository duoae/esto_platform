<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('activites_doctorat', function (Blueprint $table) {
            $table->json('fichiers')->nullable()->after('pdf_path');
        });
    }

    public function down()
    {
        Schema::table('activites_doctorat', function (Blueprint $table) {
            $table->dropColumn('fichiers');
        });
    }
};
