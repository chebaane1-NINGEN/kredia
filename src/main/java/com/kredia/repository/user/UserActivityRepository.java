package com.kredia.repository.user;

import com.kredia.entity.user.UserActivity;
import com.kredia.entity.user.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {

    List<UserActivity> findByUserIdOrderByTimestampAsc(Long userId);

    Page<UserActivity> findByUserIdOrderByTimestampAsc(Long userId, Pageable pageable);

    List<UserActivity> findByUserIdInOrderByTimestampAsc(Set<Long> userIds);

    Page<UserActivity> findByUserIdInOrderByTimestampAsc(Set<Long> userIds, Pageable pageable);

    List<UserActivity> findTop10ByOrderByTimestampDesc();

    Page<UserActivity> findAllByOrderByTimestampDesc(Pageable pageable);

    @Query("SELECT ua FROM UserActivity ua JOIN User u ON ua.userId = u.id WHERE u.role = :role")
    Page<UserActivity> findAllByUserRoleOrderByTimestampDesc(UserRole role, Pageable pageable);
}
