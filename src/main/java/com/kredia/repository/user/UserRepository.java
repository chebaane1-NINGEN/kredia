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

    Optional<User> findByEmailIgnoreCaseAndDeletedFalse(String email);

    Optional<User> findByVerificationToken(String verificationToken);

    boolean existsByEmailAndDeletedFalse(String email);

    boolean existsByEmailIgnoreCaseAndDeletedFalse(String email);

    boolean existsByEmailAndDeletedFalseAndIdNot(String email, Long id);

    boolean existsByEmailIgnoreCaseAndDeletedFalseAndIdNot(String email, Long id);

    boolean existsByPhoneNumberAndDeletedFalse(String phoneNumber);

    boolean existsByPhoneNumberAndDeletedFalseAndIdNot(String phoneNumber, Long id);

    long countByRoleAndDeletedFalse(UserRole role);

    long countByRoleAndDeletedFalseAndStatus(UserRole role, UserStatus status);

    long countByStatusAndDeletedFalse(UserStatus status);

    long countByDeletedFalse();

    long countByCreatedAtAfterAndDeletedFalse(Instant createdAt);

    @org.springframework.data.jpa.repository.Query(value = "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count FROM user WHERE deleted = false GROUP BY month ORDER BY month DESC LIMIT 6", nativeQuery = true)
    java.util.List<Object[]> countRegistrationsByMonth();

    @org.springframework.data.jpa.repository.Query(value = "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as day, COUNT(*) as count FROM user WHERE deleted = false AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY day ORDER BY day DESC", nativeQuery = true)
    java.util.List<Object[]> countRegistrationsByDay();

    Page<User> findAllByRoleAndDeletedFalse(UserRole role, Pageable pageable);

    long countByAssignedAgentAndDeletedFalse(User agent);

    long countByAssignedAgentAndStatusAndDeletedFalse(User agent, UserStatus status);
}
