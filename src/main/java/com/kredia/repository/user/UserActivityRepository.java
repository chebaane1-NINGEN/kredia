package com.kredia.repository.user;

import com.kredia.entity.user.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Set;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {

    List<UserActivity> findByUserIdOrderByTimestampAsc(Long userId);

    List<UserActivity> findByUserIdInOrderByTimestampAsc(Set<Long> userIds);
}
