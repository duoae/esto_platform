<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('candidatures', function (Blueprint $table) {
            // Add columns if they don't exist
            if (!Schema::hasColumn('candidatures', 'path_cv')) {
                $table->string('path_cv')->nullable();
            }
            if (!Schema::hasColumn('candidatures', 'path_bac')) {
                $table->string('path_bac')->nullable();
            }
            if (!Schema::hasColumn('candidatures', 'path_bac2')) {
                $table->string('path_bac2')->nullable();
            }
            if (!Schema::hasColumn('candidatures', 'path_licence')) {
                $table->string('path_licence')->nullable();
            }
            if (!Schema::hasColumn('candidatures', 'path_master')) {
                $table->string('path_master')->nullable();
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
        Schema::table('candidatures', function (Blueprint $table) {
            $table->dropColumn(['path_cv', 'path_bac', 'path_bac2', 'path_licence', 'path_master']);
        });
    }
};
