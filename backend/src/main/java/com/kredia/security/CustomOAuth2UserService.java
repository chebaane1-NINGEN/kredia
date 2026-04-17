package com.kredia.security;

import com.kredia.entity.user.User;
import com.kredia.entity.user.UserRole;
import com.kredia.entity.user.UserStatus;
import com.kredia.repository.user.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        try {
            return processOAuth2User(userRequest, oAuth2User);
        } catch (Exception ex) {
            throw new OAuth2AuthenticationException(ex.getMessage());
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest userRequest, OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        if (email == null) {
            // Fallback for GitHub if email is private
            email = oAuth2User.getAttribute("login") + "@github.com";
        }

        Optional<User> userOptional = userRepository.findByEmailAndDeletedFalse(email);
        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
        } else {
            user = registerNewUser(userRequest, oAuth2User, email);
        }

        return oAuth2User; // In a real app, wrap this in a custom principal
    }

    private User registerNewUser(OAuth2UserRequest userRequest, OAuth2User oAuth2User, String email) {
        User user = new User();
        user.setEmail(email);
        
        String name = oAuth2User.getAttribute("name");
        if (name != null) {
            String[] parts = name.split(" ");
            user.setFirstName(parts[0]);
            user.setLastName(parts.length > 1 ? parts[1] : "");
        } else {
            user.setFirstName(oAuth2User.getAttribute("login"));
            user.setLastName("");
        }

        user.setRole(UserRole.CLIENT);
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(true);
        user.setDeleted(false);
        
        return userRepository.save(user);
    }
}
