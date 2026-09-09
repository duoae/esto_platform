<?php
namespace App\Repositories;
use App\Models\Laboratoire;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Repositories\Interfaces\LabRepositoryInterface;

class LabRepository implements LabRepositoryInterface
{
    public function getAll() { return Laboratoire::with(['directeur', 'equipes'])->get(); }
    public function getById(int $id) { return Laboratoire::with(['directeur', 'directeurAdjoint', 'membres', 'sujets', 'equipes.axes', 'thematiques'])->findOrFail($id); }
    
    private function handleDirector(array $data, $prefix) {
        if (!empty($data[$prefix.'_name']) && !empty($data[$prefix.'_email'])) {
            $user = Utilisateur::where('email', $data[$prefix.'_email'])->first();
            $parts = explode(' ', trim($data[$prefix.'_name']), 2);
            $nom = $parts[0] ?? '';
            $prenom = $parts[1] ?? '';

            if (!$user) {
                $user = Utilisateur::create([
                    'nom' => $nom,
                    'prenom' => $prenom,
                    'email' => $data[$prefix.'_email'],
                    'telephone' => $data[$prefix.'_phone'] ?? null,
                    'specialite' => $data[$prefix.'_title'] ?? null,
                    'role' => 'directeur',
                    'mot_de_passe_hash' => Hash::make(Str::random(10)),
                ]);
            } else {
                $user->update([
                    'nom' => $nom,
                    'prenom' => $prenom,
                    'telephone' => $data[$prefix.'_phone'] ?? $user->telephone,
                    'specialite' => $data[$prefix.'_title'] ?? $user->specialite,
                ]);
            }
            return $user->id;
        }
        return null;
    }

    private function syncRelations(Laboratoire $lab, array $data) {
        if (isset($data['thematiques']) && is_array($data['thematiques'])) {
            $lab->thematiques()->delete();
            foreach ($data['thematiques'] as $theme) {
                if (!empty(trim($theme))) {
                    $lab->thematiques()->create(['libelle' => $theme]);
                }
            }
        }

        if (isset($data['equipes']) && is_array($data['equipes'])) {
            // Very simple approach: delete old and recreate (for simplicity in this mega-form approach)
            // Or just create if it's new. We'll delete and recreate axes/equipes for updates
            foreach ($lab->equipes as $equipe) {
                $equipe->axes()->delete();
                $equipe->delete();
            }
            
            foreach ($data['equipes'] as $eqData) {
                if (!empty($eqData['nom'])) {
                    $equipe = $lab->equipes()->create([
                        'nom' => $eqData['nom'],
                        'coordinateur_name' => $eqData['coordinateur'] ?? null,
                        'thematique_equipe' => $eqData['thematique'] ?? null,
                    ]);
                    
                    if (isset($eqData['axes']) && is_array($eqData['axes'])) {
                        foreach ($eqData['axes'] as $axe) {
                            $axeName = is_array($axe) ? ($axe['nom'] ?? $axe['libelle'] ?? '') : $axe;
                            if (!empty(trim($axeName))) {
                                $equipe->axes()->create(['libelle' => $axeName]);
                            }
                        }
                    }
                }
            }
        }
    }

    public function create(array $data) {
        $dirId = $this->handleDirector($data, 'director');
        $adjId = $this->handleDirector($data, 'adjoint');
        
        if ($dirId) $data['directeur_id'] = $dirId;
        if ($adjId) $data['directeur_adjoint_id'] = $adjId;

        $lab = Laboratoire::create($data);
        $this->syncRelations($lab, $data);
        
        return $lab;
    }
    
    public function update(int $id, array $data) {
        $lab = $this->getById($id);
        
        $dirId = $this->handleDirector($data, 'director');
        $adjId = $this->handleDirector($data, 'adjoint');
        
        if ($dirId) $data['directeur_id'] = $dirId;
        if ($adjId) $data['directeur_adjoint_id'] = $adjId;

        $lab->update($data);
        $this->syncRelations($lab, $data);
        
        return $lab;
    }
    public function delete(int $id) { return $this->getById($id)->delete(); }
    public function getMembers($id) { return $this->getById($id)->membres; }
}
