--liquibase formatted sql

--changeset hrkms:001-users
CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   VARCHAR(50)  NOT NULL,
    password   VARCHAR(255) NOT NULL,
    full_name  VARCHAR(100) NOT NULL,
    email      VARCHAR(100),
    department VARCHAR(20),
    role       VARCHAR(20)  NOT NULL DEFAULT 'USER',
    active     INTEGER DEFAULT 1,
    created_date TEXT,
    last_login   TEXT,
    CONSTRAINT uq_users_username UNIQUE (username)
);

--changeset hrkms:001-tags
CREATE TABLE IF NOT EXISTS tags (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         VARCHAR(50) NOT NULL,
    description  VARCHAR(255),
    created_date TEXT,
    CONSTRAINT uq_tags_name UNIQUE (name)
);

--changeset hrkms:001-knowledge-items
CREATE TABLE IF NOT EXISTS knowledge_items (
    id           VARCHAR(20) PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    type         VARCHAR(20)  NOT NULL,
    audience     VARCHAR(100),
    content      TEXT,
    author       VARCHAR(100),
    version      VARCHAR(20),
    created_date TEXT,
    updated_date TEXT,
    status       VARCHAR(20) DEFAULT 'Draft',
    rating       REAL    DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0
);

--changeset hrkms:001-item-tags
CREATE TABLE IF NOT EXISTS item_tags (
    item_id VARCHAR(20) NOT NULL,
    tag_id  INTEGER     NOT NULL,
    PRIMARY KEY (item_id, tag_id),
    CONSTRAINT fk_item_tags_item FOREIGN KEY (item_id) REFERENCES knowledge_items(id),
    CONSTRAINT fk_item_tags_tag  FOREIGN KEY (tag_id)  REFERENCES tags(id)
);

--changeset hrkms:001-item-related
CREATE TABLE IF NOT EXISTS item_related (
    item_id    VARCHAR(20) NOT NULL,
    related_id VARCHAR(255),
    CONSTRAINT fk_item_related_item FOREIGN KEY (item_id) REFERENCES knowledge_items(id)
);

--changeset hrkms:001-comments
CREATE TABLE IF NOT EXISTS comments (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name           VARCHAR(255) NOT NULL,
    text                TEXT,
    created_date        TEXT,
    knowledge_item_id   VARCHAR(20),
    CONSTRAINT fk_comments_item FOREIGN KEY (knowledge_item_id) REFERENCES knowledge_items(id)
);
