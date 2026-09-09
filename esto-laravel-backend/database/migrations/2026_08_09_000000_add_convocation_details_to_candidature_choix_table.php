<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddConvocationDetailsToCandidatureChoixTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('candidature_choix', function (Blueprint $table) {
            $table->string('convocation_date', 50)->nullable()->after('statut_choix');
            $table->string('convocation_time', 50)->nullable()->after('convocation_date');
            $table->string('convocation_lieu', 255)->nullable()->after('convocation_time');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('candidature_choix', function (Blueprint $table) {
            $table->dropColumn(['convocation_date', 'convocation_time', 'convocation_lieu']);
        });
    }
}
