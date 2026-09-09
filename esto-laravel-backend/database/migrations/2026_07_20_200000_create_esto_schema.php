<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Laboratoires (sans les FK vers utilisateurs d'abord)
        Schema::create('laboratoires', function (Blueprint $table) {
            $table->id();
            $table->string('acronyme', 20)->unique();
            $table->string('nom', 255);
            $table->string('etablissement', 255)->nullable();
            $table->string('locaux', 255)->nullable();
            $table->unsignedBigInteger('directeur_id')->nullable();
            $table->unsignedBigInteger('directeur_adjoint_id')->nullable();
            $table->timestamps();
        });

        // 2. Thematiques du laboratoire
        Schema::create('thematiques_labo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('laboratoire_id')->constrained('laboratoires')->onDelete('cascade');
            $table->string('libelle', 255);
        });

        // 3. Equipes de recherche
        Schema::create('equipes_recherche', function (Blueprint $table) {
            $table->id();
            $table->foreignId('laboratoire_id')->constrained('laboratoires')->onDelete('cascade');
            $table->string('nom', 255);
            $table->unsignedBigInteger('coordinateur_id')->nullable();
        });

        // 4. Axes des équipes
        Schema::create('axes_equipe', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipe_id')->constrained('equipes_recherche')->onDelete('cascade');
            $table->string('libelle', 255);
        });

        // 5. Utilisateurs (remplace l'ancienne table users)
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 120);
            $table->string('prenom', 120);
            $table->string('email', 255)->unique();
            $table->string('mot_de_passe_hash', 255);
            $table->string('telephone', 30)->nullable();
            $table->enum('role', ['admin', 'directeur', 'professeur', 'doctorant']);
            $table->string('grade', 50)->nullable();
            $table->string('specialite', 255)->nullable();
            $table->foreignId('laboratoire_id')->nullable()->constrained('laboratoires')->onDelete('set null');
            $table->string('diplome', 100)->nullable();
            $table->string('etablissement_origine', 255)->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // 6. FK différées sur laboratoires et equipes
        Schema::table('laboratoires', function (Blueprint $table) {
            $table->foreign('directeur_id')->references('id')->on('utilisateurs')->onDelete('set null');
            $table->foreign('directeur_adjoint_id')->references('id')->on('utilisateurs')->onDelete('set null');
        });

        Schema::table('equipes_recherche', function (Blueprint $table) {
            $table->foreign('coordinateur_id')->references('id')->on('utilisateurs')->onDelete('set null');
        });

        // 7. Sujets de thèse
        Schema::create('sujets_these', function (Blueprint $table) {
            $table->id();
            $table->foreignId('laboratoire_id')->constrained('laboratoires')->onDelete('cascade');
            $table->foreignId('equipe_id')->nullable()->constrained('equipes_recherche')->onDelete('set null');
            $table->foreignId('enseignant_id')->nullable()->constrained('utilisateurs')->onDelete('set null');
            $table->string('titre', 500);
            $table->string('axe_recherche', 255)->nullable();
            $table->string('pole_thematique', 255)->nullable();
            $table->text('objectif')->nullable();
            $table->text('retombees')->nullable();
            $table->text('conditions_accueil')->nullable();
            $table->string('financement', 255)->nullable();
            $table->text('production_scientifique')->nullable();
            $table->enum('statut', ['disponible', 'attribue', 'indisponible'])->default('disponible');
            $table->string('annee_universitaire', 20)->default('2026-2027');
            $table->timestamps();
        });

        // 8. Candidatures
        Schema::create('candidatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctorant_id')->constrained('utilisateurs')->onDelete('cascade');
            $table->foreignId('laboratoire_id')->constrained('laboratoires')->onDelete('cascade');
            $table->enum('statut', ['depose', 'traitement', 'convoque', 'accepte', 'rejete'])->default('depose');
            $table->enum('concours_reponse', ['accepte', 'refuse'])->nullable();
            $table->timestamp('date_depot')->useCurrent();
            $table->timestamp('date_decision')->nullable();
            $table->timestamps();
        });

        // 9. Sujets choisis dans une candidature
        Schema::create('candidature_sujets', function (Blueprint $table) {
            $table->foreignId('candidature_id')->constrained('candidatures')->onDelete('cascade');
            $table->foreignId('sujet_id')->constrained('sujets_these')->onDelete('cascade');
            $table->tinyInteger('rang');
            $table->primary(['candidature_id', 'sujet_id']);
            $table->unique(['candidature_id', 'rang'], 'uq_candidature_rang');
        });

        // 10. Documents de candidature
        Schema::create('documents_candidature', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidature_id')->constrained('candidatures')->onDelete('cascade');
            $table->string('nom_document', 255);
            $table->enum('statut', ['manquant', 'depose'])->default('manquant');
            $table->timestamp('date_depot')->nullable();
            $table->string('chemin_fichier', 500)->nullable();
        });

        // 11. Encadrements
        Schema::create('encadrements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctorant_id')->constrained('utilisateurs')->onDelete('cascade');
            $table->foreignId('professeur_id')->constrained('utilisateurs')->onDelete('cascade');
            $table->foreignId('sujet_id')->nullable()->constrained('sujets_these')->onDelete('set null');
            $table->date('date_debut')->useCurrent();
            $table->tinyInteger('annee_these')->default(1);
            $table->timestamps();
        });

        // 12. Suivi et évaluations
        Schema::create('suivi_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('encadrement_id')->constrained('encadrements')->onDelete('cascade');
            $table->enum('type', ['note', 'rapport', 'comite', 'alerte']);
            $table->text('note')->nullable();
            $table->tinyInteger('taux_avancement')->nullable();
            $table->timestamp('date_evaluation')->useCurrent();
            $table->foreignId('cree_par')->nullable()->constrained('utilisateurs')->onDelete('set null');
        });

        // 13. Statistiques par laboratoire
        Schema::create('statistiques_laboratoire', function (Blueprint $table) {
            $table->foreignId('laboratoire_id')->primary()->constrained('laboratoires')->onDelete('cascade');
            $table->smallInteger('nb_equipes')->default(0);
            $table->smallInteger('nb_doctorants')->default(0);
            $table->smallInteger('taux_occupation')->nullable();
        });

        // 14. Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('utilisateur_id')->nullable()->constrained('utilisateurs')->onDelete('cascade');
            $table->enum('role_cible', ['admin', 'directeur', 'professeur', 'doctorant'])->nullable();
            $table->string('message', 500);
            $table->enum('type', ['info', 'a_valider', 'termine', 'alerte'])->default('info');
            $table->tinyInteger('lu')->default(0);
            $table->timestamps();
        });

        // 15. Paramètres plateforme
        Schema::create('parametres_plateforme', function (Blueprint $table) {
            $table->string('cle', 100)->primary();
            $table->string('valeur', 500);
            $table->string('description', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parametres_plateforme');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('statistiques_laboratoire');
        Schema::dropIfExists('suivi_evaluations');
        Schema::dropIfExists('encadrements');
        Schema::dropIfExists('documents_candidature');
        Schema::dropIfExists('candidature_sujets');
        Schema::dropIfExists('candidatures');
        Schema::dropIfExists('sujets_these');
        Schema::table('laboratoires', function (Blueprint $table) {
            $table->dropForeign(['directeur_id']);
            $table->dropForeign(['directeur_adjoint_id']);
        });
        Schema::table('equipes_recherche', function (Blueprint $table) {
            $table->dropForeign(['coordinateur_id']);
        });
        Schema::dropIfExists('utilisateurs');
        Schema::dropIfExists('axes_equipe');
        Schema::dropIfExists('equipes_recherche');
        Schema::dropIfExists('thematiques_labo');
        Schema::dropIfExists('laboratoires');
    }
};
