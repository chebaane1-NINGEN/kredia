package com.kredia.entity.university;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private String idReservation; // Often composed of idChambre + year + ...
    
    private String anneeUniversitaire;
    private Boolean estValide;
    
    @ManyToOne
    private Chambre chambre; // Added reference back to Chambre for mappedBy consistency
    
    @ManyToMany
    private Set<Etudiant> etudiants;
}
