<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateEncadrementsForCredits extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('encadrements', function (Blueprint $table) {
            if (!Schema::hasColumn('encadrements', 'total_heures')) {
                $table->integer('total_heures')->default(0);
            }
            if (!Schema::hasColumn('encadrements', 'total_points')) {
                $table->decimal('total_points', 8, 2)->default(0);
            }
            if (!Schema::hasColumn('encadrements', 'statut_these')) {
                $table->string('statut_these', 50)->default('en_cours');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('encadrements', function (Blueprint $table) {
            $table->dropColumn(['total_heures', 'total_points', 'statut_these']);
        });
    }
}
