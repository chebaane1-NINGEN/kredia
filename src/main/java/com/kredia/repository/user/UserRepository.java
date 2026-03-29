package com.kredia.repository.user;

import com.kredia.entity.user.User;
import com.kredia.entity.user.UserRole;
import com.kredia.entity.user.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByIdAndDeletedFalse(Long id);

    Optional<User> findByEmailAndDeletedFalse(String email);

    boolean existsByEmailAndDeletedFalse(String email);

    boolean existsByEmailAndDeletedFalseAndIdNot(String email, Long id);

    boolean existsByPhoneNumberAndDeletedFalse(String phoneNumber);

    boolean existsByPhoneNumberAndDeletedFalseAndIdNot(String phoneNumber, Long id);

    long countByRoleAndDeletedFalse(UserRole role);

    long countByStatusAndDeletedFalse(UserStatus status);

    long countByDeletedFalse();

    long countByCreatedAtAfterAndDeletedFalse(Instant createdAt);

    Page<User> findAllByRoleAndDeletedFalse(UserRole role, Pageable pageable);
}
