--liquibase formatted sql

--changeset hrkms:002-knowledge-items-km-fields
ALTER TABLE knowledge_items ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE knowledge_items ADD COLUMN suggested_by VARCHAR(100);
