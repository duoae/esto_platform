-- ============================================================================
-- BASE DE DONNÉES COMPLÈTE — Plateforme Doctorale ESTO (Adaptée pour MySQL)
-- ============================================================================

CREATE TABLE utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(120) NOT NULL,
    prenom VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL DEFAULT 'CHANGE_ME',
    telephone VARCHAR(30),
    role ENUM('admin', 'directeur', 'professeur', 'doctorant') NOT NULL,
    grade VARCHAR(50),
    specialite VARCHAR(255),
    laboratoire_id INT,
    diplome VARCHAR(100),
    etablissement_origine VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE laboratoires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    acronyme VARCHAR(20) NOT NULL UNIQUE,
    nom VARCHAR(255) NOT NULL,
    etablissement VARCHAR(255),
    locaux VARCHAR(255),
    directeur_id INT,
    directeur_adjoint_id INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (directeur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    FOREIGN KEY (directeur_adjoint_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

ALTER TABLE utilisateurs
ADD CONSTRAINT fk_utilisateurs_labo FOREIGN KEY (laboratoire_id) REFERENCES laboratoires(id) ON DELETE SET NULL;

CREATE TABLE thematiques_labo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    laboratoire_id INT NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    FOREIGN KEY (laboratoire_id) REFERENCES laboratoires(id) ON DELETE CASCADE
);

CREATE TABLE equipes_recherche (
    id INT AUTO_INCREMENT PRIMARY KEY,
    laboratoire_id INT NOT NULL,
    nom VARCHAR(255) NOT NULL,
    coordinateur_id INT,
    FOREIGN KEY (laboratoire_id) REFERENCES laboratoires(id) ON DELETE CASCADE,
    FOREIGN KEY (coordinateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

CREATE TABLE axes_equipe (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipe_id INT NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    FOREIGN KEY (equipe_id) REFERENCES equipes_recherche(id) ON DELETE CASCADE
);

CREATE TABLE sujets_these (
    id INT AUTO_INCREMENT PRIMARY KEY,
    laboratoire_id INT NOT NULL,
    equipe_id INT,
    enseignant_id INT,
    titre VARCHAR(500) NOT NULL,
    axe_recherche VARCHAR(255),
    pole_thematique VARCHAR(255),
    objectif TEXT,
    retombees TEXT,
    conditions_accueil TEXT,
    financement VARCHAR(255),
    production_scientifique TEXT,
    statut ENUM('disponible', 'attribue', 'indisponible') NOT NULL DEFAULT 'disponible',
    annee_universitaire VARCHAR(20) DEFAULT '2026-2027',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (laboratoire_id) REFERENCES laboratoires(id) ON DELETE CASCADE,
    FOREIGN KEY (equipe_id) REFERENCES equipes_recherche(id) ON DELETE SET NULL,
    FOREIGN KEY (enseignant_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

CREATE TABLE candidatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctorant_id INT NOT NULL,
    laboratoire_id INT NOT NULL,
    statut ENUM('depose', 'traitement', 'convoque', 'accepte', 'rejete') NOT NULL DEFAULT 'depose',
    concours_reponse ENUM('accepte', 'refuse'),
    date_depot TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_decision TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (doctorant_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (laboratoire_id) REFERENCES laboratoires(id) ON DELETE CASCADE
);

CREATE TABLE candidature_sujets (
    candidature_id INT NOT NULL,
    sujet_id INT NOT NULL,
    rang SMALLINT NOT NULL CHECK (rang BETWEEN 1 AND 3),
    PRIMARY KEY (candidature_id, sujet_id),
    UNIQUE (candidature_id, rang),
    FOREIGN KEY (candidature_id) REFERENCES candidatures(id) ON DELETE CASCADE,
    FOREIGN KEY (sujet_id) REFERENCES sujets_these(id) ON DELETE CASCADE
);

CREATE TABLE documents_candidature (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidature_id INT NOT NULL,
    nom_document VARCHAR(255) NOT NULL,
    statut ENUM('manquant', 'depose') NOT NULL DEFAULT 'manquant',
    date_depot TIMESTAMP NULL DEFAULT NULL,
    chemin_fichier VARCHAR(500),
    FOREIGN KEY (candidature_id) REFERENCES candidatures(id) ON DELETE CASCADE
);

CREATE TABLE encadrements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctorant_id INT NOT NULL,
    professeur_id INT NOT NULL,
    sujet_id INT,
    date_debut DATE NOT NULL DEFAULT (CURRENT_DATE),
    annee_these SMALLINT NOT NULL DEFAULT 1,
    FOREIGN KEY (doctorant_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (professeur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (sujet_id) REFERENCES sujets_these(id) ON DELETE SET NULL
);

CREATE TABLE suivi_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    encadrement_id INT NOT NULL,
    type ENUM('note', 'rapport', 'comite', 'alerte') NOT NULL,
    note TEXT,
    taux_avancement SMALLINT CHECK (taux_avancement BETWEEN 0 AND 100),
    date_evaluation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cree_par INT,
    FOREIGN KEY (encadrement_id) REFERENCES encadrements(id) ON DELETE CASCADE,
    FOREIGN KEY (cree_par) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

CREATE TABLE statistiques_laboratoire (
    laboratoire_id INT PRIMARY KEY,
    nb_equipes SMALLINT NOT NULL,
    nb_doctorants SMALLINT NOT NULL,
    taux_occupation SMALLINT CHECK (taux_occupation BETWEEN 0 AND 100),
    FOREIGN KEY (laboratoire_id) REFERENCES laboratoires(id) ON DELETE CASCADE
);

-- ============================================================================
-- INSERTION DES DONNÉES DE DÉMO (Optionnel)
-- ============================================================================
INSERT INTO utilisateurs (id, nom, prenom, email, mot_de_passe_hash, telephone, role) VALUES
(1, 'Administration', 'ESTO', 'admin@ump.ac.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'admin');

INSERT INTO laboratoires (id, acronyme, nom, etablissement, locaux) VALUES
(1, 'CELHN', 'Communication, Éducation, Linguistique et Humanités Numériques', 'EST', 'ENSAO'),
(2, 'MADEO', 'Management et Développement des Entreprises et des Organisations', 'EST', 'EST'),
(3, 'MATSI', 'Mathématiques Appliquées, Traitement du Signal et Informatique', 'ESTO', 'ESTO'),
(4, 'LGEM', 'Laboratoire de Génie Électrique et Maintenance', 'ESTO', 'ESTO');

INSERT INTO utilisateurs (id, nom, prenom, email, telephone, role, laboratoire_id) VALUES
(2, 'Khalid', 'Jaafar', 'jaafarkhalid6@gmail.com', '0667240113', 'directeur', 1),
(3, 'Boutchich Driss', 'El Kadiri', 'd.elkadiriboutchich@ump.ma', '0651339486', 'directeur', 2),
(4, 'Omar', 'Moussaoui', 'o.moussaoui@ump.ac.ma', '+212662206946', 'directeur', 3),
(5, 'Jamal', 'Bouchnaif', 'j.bouchnaif@ump.ac.ma', '0666287324', 'directeur', 4);

UPDATE laboratoires SET directeur_id = 2 WHERE id = 1;
UPDATE laboratoires SET directeur_id = 3 WHERE id = 2;
UPDATE laboratoires SET directeur_id = 4 WHERE id = 3;
UPDATE laboratoires SET directeur_id = 5 WHERE id = 4;
