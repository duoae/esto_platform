<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateActivitesDoctoratTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('activites_doctorat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('encadrement_id')->constrained('encadrements')->onDelete('cascade');
            $table->string('type', 50); // Formation, Article Scopus, Conference, Poster
            $table->string('titre', 255);
            $table->text('description')->nullable();
            $table->integer('heures')->default(0);
            $table->decimal('points', 8, 2)->default(0);
            $table->string('pdf_path', 255)->nullable();
            $table->string('statut', 20)->default('en_attente'); // en_attente, valide, refuse
            $table->text('motif_refus')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('activites_doctorat');
    }
}
