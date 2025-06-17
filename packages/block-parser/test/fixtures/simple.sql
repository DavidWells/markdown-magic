-- My SQL Script

/* GENERATED a */
-- This is a comment inside
/* END-GENERATED */

/* GENERATED b */
-- Another comment block
/* END-GENERATED */

/* GENERATED c */
-- Multiline
-- comment block
/* END-GENERATED */

/* GENERATED MyCodeGen foo='bar' */
-- Generated content
SELECT * FROM users WHERE id = 1;
/* END-GENERATED */

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255)
); 