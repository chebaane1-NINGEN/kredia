package com.kredia.repository.user;

import com.kredia.entity.user.User;
import com.kredia.entity.user.UserRole;
import com.kredia.entity.user.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByIdAndDeletedFalse(Long id);

    Optional<User> findByEmailAndDeletedFalse(String email);

    Optional<User> findByVerificationToken(String verificationToken);

    boolean existsByEmailAndDeletedFalse(String email);

    boolean existsByEmailAndDeletedFalseAndIdNot(String email, Long id);

    boolean existsByPhoneNumberAndDeletedFalse(String phoneNumber);

    boolean existsByPhoneNumberAndDeletedFalseAndIdNot(String phoneNumber, Long id);

    long countByRoleAndDeletedFalse(UserRole role);

    long countByStatusAndDeletedFalse(UserStatus status);

    long countByDeletedFalse();

    long countByCreatedAtAfterAndDeletedFalse(Instant createdAt);

    Page<User> findAllByRoleAndDeletedFalse(UserRole role, Pageable pageable);

    Page<User> findAllByAssignedAgentAndDeletedFalse(User agent, Pageable pageable);
}
