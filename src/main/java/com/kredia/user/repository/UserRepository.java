package com.kredia.user.repository;

import com.kredia.common.UserStatus;
import com.kredia.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByPhoneNumber(String phoneNumber);

    // ─── Dashboard aggregations ───────────────────────────────────────

    /** Count users by status (PENDING, VERIFIED, BLOCKED). */
    long countByStatus(com.kredia.common.UserStatus status);

    /** Count users by role. */
    long countByRole(com.kredia.common.Role role);

    /** Count users by role and status. */
    long countByRoleAndStatus(com.kredia.common.Role role, com.kredia.common.UserStatus status);

    /** Time-series: User growth by day for the last 30 days. */
    @Query(value = "SELECT CAST(created_at AS DATE) as date, COUNT(*) as count FROM users WHERE created_at >= :since GROUP BY CAST(created_at AS DATE) ORDER BY date", nativeQuery = true)
    List<Object[]> getUserGrowthTimeSeries(@Param("since") java.time.LocalDateTime since);
}
