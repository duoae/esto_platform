<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Utilisateur;
use App\Models\Laboratoire;
use App\Models\EquipeRecherche;
use App\Models\ThematiqueLabo;
use App\Models\SujetThese;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password');

        // 1. Create Admin
        Utilisateur::create([
            'nom' => 'Admin',
            'prenom' => 'Super',
            'email' => 'admin@ump.ac.ma',
            'mot_de_passe_hash' => $password,
            'role' => 'admin',
        ]);

        // 2. Create Directeurs & Professeurs
        $dirCelhn = Utilisateur::create([
            'nom' => 'Jaafar',
            'prenom' => 'Khalid',
            'email' => 'jaafarkhalid6@gmail.com',
            'mot_de_passe_hash' => $password,
            'role' => 'directeur',
            'grade' => 'PES',
        ]);

        $profCelhn = Utilisateur::create([
            'nom' => 'El Boukhari',
            'prenom' => 'Mohamed',
            'email' => 'elboukhari@ump.ac.ma',
            'mot_de_passe_hash' => $password,
            'role' => 'professeur',
            'grade' => 'PH',
        ]);

        // 3. Create Labs
        $celhn = Laboratoire::create([
            'acronyme' => 'CELHN',
            'nom' => 'Centre d\'Etudes et de Laboratoire d\'Histoire Numérique',
            'etablissement' => 'EST Oujda',
            'directeur_id' => $dirCelhn->id,
        ]);

        // Update Users with Lab ID
        $dirCelhn->update(['laboratoire_id' => $celhn->id]);
        $profCelhn->update(['laboratoire_id' => $celhn->id]);

        // 4. Create Equipes & Thematiques
        ThematiqueLabo::create(['laboratoire_id' => $celhn->id, 'libelle' => 'IA et Sciences des données']);
        
        $equipe = EquipeRecherche::create([
            'laboratoire_id' => $celhn->id,
            'nom' => 'Equipe IA',
            'coordinateur_id' => $profCelhn->id
        ]);

        // 5. Create Doctorants
        $doctorant = Utilisateur::create([
            'nom' => 'Rami',
            'prenom' => 'Yassine',
            'email' => 'yassine.rami@gmail.com',
            'mot_de_passe_hash' => $password,
            'role' => 'doctorant',
            'diplome' => 'Master en Informatique',
            'etablissement_origine' => 'FSO',
        ]);

        // 6. Create Subjects
        SujetThese::create([
            'laboratoire_id' => $celhn->id,
            'equipe_id' => $equipe->id,
            'enseignant_id' => $profCelhn->id,
            'titre' => 'L\'Intelligence Artificielle au service de la médecine',
            'axe_recherche' => 'IA, Santé',
            'objectif' => 'Améliorer les diagnostics médicaux via le Machine Learning',
            'statut' => 'disponible',
            'annee_universitaire' => '2026-2027',
        ]);
    }
}
