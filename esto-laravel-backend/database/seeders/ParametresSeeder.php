<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Parametre;

class ParametresSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $parametres = [
            [
                'cle' => 'candidatures_ouvertes',
                'valeur' => '1',
                'type' => 'boolean',
                'description' => 'Ouvrir ou fermer les candidatures sur la plateforme.'
            ],
            [
                'cle' => 'inscriptions_ouvertes',
                'valeur' => '1',
                'type' => 'boolean',
                'description' => 'Autoriser les nouvelles inscriptions.'
            ],
            [
                'cle' => 'annee_universitaire_courante',
                'valeur' => '2026-2027',
                'type' => 'string',
                'description' => 'Année universitaire en cours.'
            ],
            [
                'cle' => 'chatbot_active',
                'valeur' => '1',
                'type' => 'boolean',
                'description' => 'Activer ou désactiver le chatbot IA pour les visiteurs.'
            ],
            [
                'cle' => 'max_annees_doctorat',
                'valeur' => '3',
                'type' => 'integer',
                'description' => 'Durée maximale par défaut pour un doctorat.'
            ],
            [
                'cle' => 'email_contact_admin',
                'valeur' => 'admin@esto.ma',
                'type' => 'string',
                'description' => 'Email de contact principal.'
            ]
        ];

        foreach ($parametres as $param) {
            Parametre::updateOrCreate(['cle' => $param['cle']], $param);
        }
    }
}
