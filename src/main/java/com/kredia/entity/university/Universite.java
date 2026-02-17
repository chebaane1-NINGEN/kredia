package com.kredia.entity.university;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class Universite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idUniversite;
    
    private String nomUniversite;
    private String adresse;
    
    @OneToOne(mappedBy = "universite")
    private Foyer foyer;
}
