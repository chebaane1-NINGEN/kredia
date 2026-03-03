package com.kredia.repository;

import com.kredia.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LegacyUserRepository extends JpaRepository<User, Long> {
}
