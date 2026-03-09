package com.hrkms.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

/**
 * Converts LocalDate <-> Long (epoch milliseconds) for SQLite compatibility.
 * Hibernate 6 + SQLite JDBC natively stores LocalDate as epoch milliseconds (Long).
 * This converter makes that explicit and consistent for all LocalDate fields.
 * autoApply=true applies to ALL LocalDate fields across all entities automatically.
 */
@Converter(autoApply = true)
public class LocalDateConverter implements AttributeConverter<LocalDate, Long> {

    @Override
    public Long convertToDatabaseColumn(LocalDate date) {
        return date != null ? date.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli() : null;
    }

    @Override
    public LocalDate convertToEntityAttribute(Long epochMilli) {
        return epochMilli != null ? Instant.ofEpochMilli(epochMilli).atZone(ZoneOffset.UTC).toLocalDate() : null;
    }
}
