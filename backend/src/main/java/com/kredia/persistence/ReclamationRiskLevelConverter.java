package com.kredia.persistence;

import com.kredia.enums.ReclamationRiskLevel;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Locale;

@Converter
public class ReclamationRiskLevelConverter implements AttributeConverter<ReclamationRiskLevel, String> {

    private static final Logger log = LoggerFactory.getLogger(ReclamationRiskLevelConverter.class);

    @Override
    public String convertToDatabaseColumn(ReclamationRiskLevel attribute) {
        return attribute != null ? attribute.name() : ReclamationRiskLevel.LOW.name();
    }

    @Override
    public ReclamationRiskLevel convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return ReclamationRiskLevel.LOW;
        }

        try {
            return ReclamationRiskLevel.valueOf(dbData.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            log.warn("Unknown reclamation risk level '{}' found in database. Falling back to LOW.", dbData);
            return ReclamationRiskLevel.LOW;
        }
    }
}
