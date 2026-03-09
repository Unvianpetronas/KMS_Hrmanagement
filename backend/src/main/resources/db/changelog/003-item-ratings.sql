--liquibase formatted sql

--changeset hrkms:003-item-ratings
CREATE TABLE IF NOT EXISTS item_ratings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id    VARCHAR(20)  NOT NULL,
    username   VARCHAR(100) NOT NULL,
    stars      INTEGER      NOT NULL,
    rated_date TEXT,
    CONSTRAINT uq_item_ratings UNIQUE (item_id, username),
    CONSTRAINT fk_item_ratings_item FOREIGN KEY (item_id)
        REFERENCES knowledge_items(id) ON DELETE CASCADE
);
