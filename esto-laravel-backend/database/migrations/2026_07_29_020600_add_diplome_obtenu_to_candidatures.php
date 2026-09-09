<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDiplomeObtenuToCandidatures extends Migration
{
    public function up()
    {
        Schema::table('candidatures', function (Blueprint $table) {
            $table->string('diplome_obtenu', 255)->nullable()->after('laboratoire_id');
        });
    }

    public function down()
    {
        Schema::table('candidatures', function (Blueprint $table) {
            $table->dropColumn('diplome_obtenu');
        });
    }
}
