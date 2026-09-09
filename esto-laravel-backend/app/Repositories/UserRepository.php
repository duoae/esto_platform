<?php
namespace App\Repositories;
use App\Models\Utilisateur;
use App\Repositories\Interfaces\UserRepositoryInterface;

class UserRepository implements UserRepositoryInterface
{
    public function getAll() { return Utilisateur::all(); }
    public function getById(int $id) { return Utilisateur::findOrFail($id); }
    public function create(array $data) {
        if (isset($data['password'])) {
            $data['mot_de_passe_hash'] = bcrypt($data['password']);
        }
        if (isset($data['name'])) {
            $parts = explode(' ', trim($data['name']), 2);
            $data['nom'] = $parts[0] ?? '';
            $data['prenom'] = $parts[1] ?? '';
            unset($data['name']);
        }
        if (isset($data['lab_id']) && !empty($data['lab_id'])) {
            if (is_numeric($data['lab_id'])) {
                $data['laboratoire_id'] = (int)$data['lab_id'];
            } else {
                $lab = \App\Models\Laboratoire::where('acronyme', $data['lab_id'])->first();
                $data['laboratoire_id'] = $lab ? $lab->id : null;
            }
            unset($data['lab_id']);
        } else {
            unset($data['lab_id']);
        }
        if (isset($data['phone'])) {
            $data['telephone'] = $data['phone'];
            unset($data['phone']);
        }
        unset($data['password']);
        unset($data['confirmPassword']);
        return Utilisateur::create($data);
    }
    public function update(int $id, array $data) {
        $user = $this->getById($id);
        if (isset($data['password'])) {
            $data['mot_de_passe_hash'] = bcrypt($data['password']);
        }
        if (isset($data['name'])) {
            $parts = explode(' ', trim($data['name']), 2);
            $data['nom'] = $parts[0] ?? '';
            $data['prenom'] = $parts[1] ?? '';
            unset($data['name']);
        }
        if (isset($data['lab_id']) && !empty($data['lab_id'])) {
            if (is_numeric($data['lab_id'])) {
                $data['laboratoire_id'] = (int)$data['lab_id'];
            } else {
                $lab = \App\Models\Laboratoire::where('acronyme', $data['lab_id'])->first();
                $data['laboratoire_id'] = $lab ? $lab->id : null;
            }
            unset($data['lab_id']);
        }
        if (isset($data['phone'])) {
            $data['telephone'] = $data['phone'];
            unset($data['phone']);
        }
        unset($data['password']);
        unset($data['confirmPassword']);
        $user->update($data);
        return $user;
    }
    public function delete(int $id) { return $this->getById($id)->delete(); }
    public function getAllByRoleAndLab(?string $role, ?string $labId) {
        $query = Utilisateur::query();
        if ($role) $query->where('role', $role);
        if ($labId) $query->where('laboratoire_id', $labId);
        return $query->get();
    }
    public function getStats() {
        return [
            'total_users' => Utilisateur::count(),
            'by_role' => Utilisateur::selectRaw('role, count(*) as count')->groupBy('role')->get()
        ];
    }
}
