DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;

CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW() -- Add updated_at column to track changes
);

CREATE TABLE messages (
  id SERIAL,
  contact_id INT NOT NULL REFERENCES contacts(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, contact_id, created_at) -- Include created_at in the primary key
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_contacts_phone_number ON contacts(phone_number);  -- Index on phone_number in contacts
CREATE INDEX idx_messages_contact_id ON messages(contact_id);      -- Index on contact_id in messages
CREATE INDEX idx_messages_created_at ON messages(created_at);      -- Index on created_at in messages