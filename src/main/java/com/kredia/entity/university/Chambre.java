package com.kredia.entity.university;

import jakarta.persistence.*;
import lombok.*;

import java.util.Set;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class Chambre {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idChambre;
    
    private Long numeroChambre;
    
    @Enumerated(EnumType.STRING)
    private TypeChambre typeC;
    
    @ManyToOne
    private Bloc bloc;
    
    @OneToMany(mappedBy = "chambre", cascade = CascadeType.ALL)
    private Set<Reservation> reservations;
}
