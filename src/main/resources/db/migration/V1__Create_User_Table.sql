CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL,
    last_login DATETIME,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_phone_number UNIQUE (phone_number)
);
