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
public class Bloc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idBloc;
    
    private String nomBloc;
    private Long capaciteBloc;
    
    @ManyToOne
    private Foyer foyer;
    
    @OneToMany(mappedBy = "bloc", cascade = CascadeType.ALL)
    private Set<Chambre> chambres;
}
