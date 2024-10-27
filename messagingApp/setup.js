const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
const { faker } = require('@faker-js/faker');
const moment = require('moment');

const app = express();
const PORT = 3000;

// PostgreSQL connection pool
const pool = new Pool({
  user: '',           
  host: '',       
  database: '',     
  password: '',     
  port: 5432,               
});

// Step 1: Read CSV data (message content)
const messageContents = [];

// Read the CSV file into an array
fs.createReadStream('message_content.csv')
  .pipe(csv({ headers: false }))
  .on('data', (row) => {
    messageContents.push(row[0].trim());
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });

// Helper function to test database connection
async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected successfully. Current timestamp:', result.rows[0].now);
  } catch (error) {
    console.error('Error connecting to the database:', error.message);
    throw new Error('Failed to connect to the database');
  }
}

// Helper function to clear database tables
async function clearDatabase() {
  try {
    await pool.query('TRUNCATE TABLE messages, contacts RESTART IDENTITY CASCADE');
    console.log('Database cleared successfully.');
  } catch (error) {
    console.error('Error clearing database:', error.message);
    throw new Error('Failed to clear the database');
  }
}

// Helper function to check table structure
async function checkTableStructure() {
  try {
    const result = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'contacts'`);
    console.log('Contacts table structure:', result.rows);
  } catch (error) {
    console.error('Error checking table structure:', error.message);
    throw new Error('Failed to check table structure');
  }
}

// Track generated phone numbers to ensure uniqueness
const generatedPhoneNumbers = new Set();

// Function to generate a unique phone number
function generateUniquePhoneNumber() {
  let phoneNumber;
  do {
    phoneNumber = faker.phone.number().slice(0, 15); // Generate and slice the phone number to fit the varchar(15) limit
  } while (generatedPhoneNumbers.has(phoneNumber));
  generatedPhoneNumbers.add(phoneNumber);
  return phoneNumber;
}

// Function to add bulk contacts in parallel batches
async function addBulkContacts(numContacts, batchSize = 1000, parallelBatches = 5) {
  console.log(`Adding ${numContacts} contacts in parallel batches...`);
  const contactIds = [];
  
  const insertBatch = async (batchStartIndex) => {
    const values = [];
    for (let i = 0; i < batchSize; i++) {
      const phoneNumber = generateUniquePhoneNumber();
      values.push(`('${phoneNumber}', NOW(), NOW())`);
    }
    const insertQuery = `
      INSERT INTO contacts (phone_number, created_at, updated_at)
      VALUES ${values.join(', ')}
      RETURNING id
    `;
    try {
      const result = await pool.query(insertQuery);
      result.rows.forEach((row) => contactIds.push(row.id));
    } catch (error) {
      console.error(`Error inserting contacts for batch starting at ${batchStartIndex}:`, error.message);
      throw new Error('Failed during parallel contact insertion');
    }
  };

  const totalBatches = Math.ceil(numContacts / batchSize);
  for (let i = 0; i < totalBatches; i += parallelBatches) {
    const batchPromises = [];
    for (let j = 0; j < parallelBatches && (i + j) < totalBatches; j++) {
      batchPromises.push(insertBatch((i + j) * batchSize));
    }
    await Promise.all(batchPromises); // Run the batches in parallel
    console.log(`${Math.min((i + parallelBatches) * batchSize, numContacts)} contacts added`);
  }

  console.log(`Successfully added ${numContacts} contacts.`);
  return contactIds;
}

// Helper function to generate a random date within the past 3 months
function generateRandomDate() {
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
  
    const start = threeMonthsAgo.getTime();
    const end = now.getTime();
    return new Date(start + Math.random() * (end - start)).toISOString();
  }

// Helper function to generate random message content and a created_at date
function generateMessageContent() {
  const numParts = Math.floor(Math.random() * 3) + 1; // Randomly pick 1 to 3 message parts
  let message = '';
  for (let i = 0; i < numParts; i++) {
    message += messageContents[Math.floor(Math.random() * messageContents.length)] + ' ';
  }

  // Generate a random date within the past 3 months
  const randomDate = generateRandomDate();

  return {
    content: message.trim().replace(/'/g, "''"), // Escape single quotes to prevent SQL errors
    createdAt: randomDate
  };
}

// Function to add bulk messages in parallel batches with random dates
async function addBulkMessages(numMessages, contactIds, batchSize = 10000, parallelBatches = 5) {
  console.log(`Adding ${numMessages} messages in parallel batches...`);

  const insertBatch = async (batchStartIndex) => {
    const values = [];
    const parameters = [];
    let parameterIndex = 1;

    for (let i = 0; i < batchSize; i++) {
      const contactId = contactIds[Math.floor(Math.random() * contactIds.length)];
      const { content, createdAt } = generateMessageContent();
      values.push(`($${parameterIndex++}, $${parameterIndex++}, $${parameterIndex++})`);
      parameters.push(contactId, content, createdAt);
    }

    const insertQuery = `
      INSERT INTO messages (contact_id, content, created_at)
      VALUES ${values.join(', ')}
    `;
    try {
      await pool.query(insertQuery, parameters);
    } catch (error) {
      console.error(`Error inserting messages for batch starting at ${batchStartIndex}:`, error.message);
      throw new Error('Failed during parallel message insertion');
    }
  };

  const totalBatches = Math.ceil(numMessages / batchSize);
  for (let i = 0; i < totalBatches; i += parallelBatches) {
    const batchPromises = [];
    for (let j = 0; j < parallelBatches && (i + j) < totalBatches; j++) {
      batchPromises.push(insertBatch((i + j) * batchSize));
    }
    await Promise.all(batchPromises); // Run the batches in parallel
    console.log(`${Math.min((i + parallelBatches) * batchSize, numMessages)} messages added`);
  }

  console.log(`Successfully added ${numMessages} messages.`);
}

// Helper function to create partition tables dynamically for the past 3 months
const createPartitionTables = async () => {
    try {
      // Start from the first day of 3 months ago
      let currentMonth = moment().subtract(3, 'months').startOf('month'); // Includes the past 3 months
      const lastMonth = moment().startOf('month'); // Up to the current month
  
      // Loop through each month from 3 months ago to the current month
      while (currentMonth.isSameOrBefore(lastMonth)) {
        const partitionName = `messages_${currentMonth.format('YYYY_MM')}`;
        const partitionStart = currentMonth.format('YYYY-MM-DD');
        const partitionEnd = currentMonth.clone().add(1, 'month').format('YYYY-MM-DD');
  
        const createPartitionQuery = `
          CREATE TABLE IF NOT EXISTS ${partitionName} PARTITION OF messages
          FOR VALUES FROM ('${partitionStart}') TO ('${partitionEnd}');
        `;
        
        await pool.query(createPartitionQuery);
        console.log(`Partition ${partitionName} created successfully for range ${partitionStart} to ${partitionEnd}.`);
        
        currentMonth.add(1, 'month');
      }
    } catch (error) {
      console.error(`Error creating partition tables: ${error.message}`);
    }
  };

// Main route to populate database
app.get('/populate', async (req, res) => {
    console.log("Route '/populate' triggered");
  
    try {
      // Step 1: Test database connection
      console.log("Attempting to connect to the database...");
      await testDatabaseConnection();
      console.log("Database connection check complete");
  
      // Step 2: Clear database
      console.log("Clearing database...");
      await clearDatabase();
      console.log("Database cleared successfully.");
  
      // Step 3: Check the structure of the table
      console.log("Checking table structure...");
      await checkTableStructure();
      console.log("Table structure check complete");
  
      // Step 4: Insert bulk contacts in parallel
      const numContacts = 100000;
      const contactIds = await addBulkContacts(numContacts);
  
      // Step 5: Create partitions for the past 3 months including the current month
      console.log("Creating partitions for messages...");
      await createPartitionTables();
  
      // Step 6: Insert bulk messages in parallel
      const numMessages = 5000000;
      await addBulkMessages(numMessages, contactIds);
  
      console.log('Initial checks, bulk insertion, and partition creation completed successfully.');
      res.status(200).send('Database populated and partitioned successfully.');
    } catch (error) {
      console.error('Error in /populate route:', error.message);
      res.status(500).send(`Failed during database connection or initial checks: ${error.message}`);
    }
  });

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});