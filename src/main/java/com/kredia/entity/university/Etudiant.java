package com.kredia.entity.university;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.Set;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class Etudiant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idEtudiant;
    
    private String nomEtudiant;
    private String prenomEtudiant;
    private Long cin;
    private String ecole;
    private LocalDate dateNaissance;
    
    @ManyToMany(mappedBy = "etudiants")
    private Set<Reservation> reservations;
}
