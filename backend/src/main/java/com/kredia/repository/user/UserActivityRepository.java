package com.kredia.repository.user;

import com.kredia.entity.user.User;
import com.kredia.entity.user.UserActivity;
import com.kredia.entity.user.UserActivityActionType;
import com.kredia.entity.user.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<UserActivity> {

    List<UserActivity> findByUserIdOrderByTimestampAsc(Long userId);

    Page<UserActivity> findByUserIdOrderByTimestampAsc(Long userId, Pageable pageable);

    List<UserActivity> findByUserIdInOrderByTimestampAsc(Set<Long> userIds);

    Page<UserActivity> findByUserIdInOrderByTimestampAsc(Set<Long> userIds, Pageable pageable);

    List<UserActivity> findTop10ByOrderByTimestampDesc();

    Page<UserActivity> findAllByOrderByTimestampDesc(Pageable pageable);

    @Query("SELECT ua FROM UserActivity ua JOIN User u ON ua.userId = u.id WHERE u.role = :role")
    Page<UserActivity> findAllByUserRoleOrderByTimestampDesc(UserRole role, Pageable pageable);

    @Query("SELECT ua FROM UserActivity ua, User u WHERE ua.userId = u.id " +
           "AND (:role IS NULL OR u.role = :role) " +
           "AND (:actionType IS NULL OR ua.actionType = :actionType) " +
           "AND (:userId IS NULL OR ua.userId = :userId) " +
           "AND (:from IS NULL OR ua.timestamp >= :from) " +
           "AND (:to IS NULL OR ua.timestamp <= :to) " +
           "ORDER BY ua.timestamp DESC")
    Page<UserActivity> findByFilters(UserRole role,
                                     UserActivityActionType actionType,
                                     Long userId,
                                     Instant from,
                                     Instant to,
                                     Pageable pageable);

    long countByUserIdAndActionType(Long userId, com.kredia.entity.user.UserActivityActionType actionType);

    long countByActionType(com.kredia.entity.user.UserActivityActionType actionType);
    
    long countByUserId(Long userId);

    long countByUserIdAndActionTypeAndTimestampBetween(Long userId, com.kredia.entity.user.UserActivityActionType actionType, Instant startDate, Instant endDate);

    List<UserActivity> findByUserIdAndTimestampBetweenOrderByTimestampAsc(Long userId, Instant startDate, Instant endDate);

    // ==================== Time-Based Queries for Analytics ====================
    
    List<UserActivity> findByTimestampBetween(Instant startDate, Instant endDate);
    
    long countByTimestampBetween(Instant startDate, Instant endDate);
    
    long countByTimestampAfter(Instant timestamp);
    
    List<UserActivity> findByTimestampAfterOrderByTimestampDesc(Instant timestamp);
    
    List<UserActivity> findByTimestampAfterOrderByTimestampDesc(Instant timestamp, Pageable pageable);
    
    List<UserActivity> findByUserIdAndTimestampBetween(Long userId, Instant startDate, Instant endDate);
    
    long countByUserIdAndTimestampBetween(Long userId, Instant startDate, Instant endDate);
    
    List<UserActivity> findByUserIdAndTimestampAfterOrderByTimestampDesc(Long userId, Instant timestamp);
}
