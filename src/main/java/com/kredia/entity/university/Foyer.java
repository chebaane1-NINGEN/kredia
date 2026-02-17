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
public class Foyer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idFoyer;
    
    private String nomFoyer;
    private Long capaciteFoyer;
    
    @OneToOne
    private Universite universite;
    
    @OneToMany(mappedBy = "foyer", cascade = CascadeType.ALL)
    private Set<Bloc> blocs;
}
