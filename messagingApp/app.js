// app.js
const express = require('express');
const pool = require('./db');

const app = express();
const PORT = 3000;

// Helper function to validate and parse page number
const getPageNumber = (page) => {
  const parsedPage = parseInt(page, 10);
  return isNaN(parsedPage) || parsedPage <= 0 ? 1 : parsedPage;
};

// 1. Retrieve the 50 most recent messages for a specified contact id
app.get('/conversations', async (req, res) => {
  const page = getPageNumber(req.query.page); // Validate and parse the page number
  const pageSize = 50;
  const offset = (page - 1) * pageSize;
  const id = req.query.id; // Get id from query parameter

  if (!id) {
    return res.status(400).send('Contact ID (id) is required');
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        messages.content,
        messages.created_at AS message_time
      FROM contacts
      JOIN messages ON contacts.id = messages.contact_id
      WHERE contacts.id = $1
      ORDER BY messages.created_at DESC
      LIMIT $2 OFFSET $3;
      `,
      [id, pageSize, offset]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('No messages found for the specified contact');
    }

    // Format the response as a numbered list of message contents
    const formattedMessages = result.rows.map((row, index) => `${index + 1}. ${row.content}`);

    res.json(formattedMessages);
  } catch (error) {
    console.error("Error retrieving messages:", error.message);
    res.status(500).send('Server Error');
  }
});

// Search feature: filter results by message content, contact name, or phone number with pagination
app.get('/search', async (req, res) => {
  const { searchValue, page = 1 } = req.query;

  if (!searchValue) {
    return res.status(400).send('Search value is required');
  }

  const pageSize = 50;
  const currentPage = getPageNumber(page); // Validate and parse the page number
  const offset = (currentPage - 1) * pageSize;

  try {
    const result = await pool.query(
      `
      SELECT messages.content
      FROM contacts
      JOIN messages ON contacts.id = messages.contact_id
      WHERE
        contacts.phone_number ILIKE $1 OR
        messages.content ILIKE $1
      ORDER BY messages.created_at DESC
      LIMIT $2 OFFSET $3;
      `,
      [`%${searchValue}%`, pageSize, offset]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('No messages found for the specified search criteria');
    }

    // Format the response as a numbered list of message contents
    const formattedMessages = result.rows.map((row, index) => `${index + 1}. ${row.content}`);

    res.json({
      messages: formattedMessages,
      page: currentPage,
      pageSize: result.rows.length
    });
  } catch (error) {
    console.error("Error searching conversations:", error.message);
    res.status(500).send('Server Error');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});