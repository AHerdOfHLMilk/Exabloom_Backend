# Messaging App

## Overview
This application allows you to create a PostgreSQL database, populate it with large amounts of contact and message data, and query the database using conversation and search endpoints.

## Prerequisites

1. **Node.js** (v14 or higher)
2. **PostgreSQL** (v12 or higher)
3. **pgAdmin 4** (for database management)
4. **Postman or curl** (for API testing)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <your-repository-directory>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup PostgreSQL Database

1. **Create a PostgreSQL Database**:
   - Open `pgAdmin 4` and create a new database named `postgres`.
   - Create a new user and assign it to the database with full privileges.
   - Open the schema.sql file in pgAdmin4 and run the query in the file to set the schema

2. **Configure the PostgreSQL Connection**:
   - Ensure your PostgreSQL server is running locally and accepting connections.
   - Update the connection details in the `db.js` file to match your local configuration:
     ```javascript
     const pool = new Pool({
       user: 'your-username',
       host: 'localhost',
       database: 'database_name',
       password: 'your-password',
       port: 5432,
     });
     ```

### 4. Setup the Database with dummy data

```bash
node setup.js
```

You should see a message indicating that the server is running on `http://localhost:3000` and that the CSV file has been read (ensure the message content csv file is in the same directory as the node project).

## Populating Data

### Endpoint: `/populate`

The `/populate` endpoint is used to populate the database with dummy contact and message data. This endpoint will create:
- **100,000 contacts** with randomly generated phone numbers.
- **5 million messages** associated with the contacts, each message having randomized content and timestamps within the last 3 months.

### How to Populate the Database

1. Open your browser or Postman.
2. Send a `GET` request to:
   ```plaintext
   http://localhost:3000/populate
   ```

3. If successful, you should receive a message like this on your console/terminal:
   ```plaintext
   Database populated and partitioned successfully.
   ```

### 5. Run the Server

```bash
node setup.js
```

## Using the Conversations and Search Endpoints

### Endpoint: `/conversations`

This endpoint retrieves the 50 most recent messages for a specified contact. It supports pagination for larger datasets.

#### Example Request

- **URL**: `http://localhost:3000/conversations`
- **Method**: `GET`
- **Query Parameters**:
  - `id` (required): The ID of the contact whose messages you want to retrieve.
  - `page` (optional): The page number for pagination (default is `1`).

#### Example Inputs

```plaintext
http://localhost:3000/conversations?id=1
```

This will retrieve the 50 most recent messages for the contact with ID `1`.

```plaintext
http://localhost:3000/conversations?id=1&page=2
```

This will retrieve the next 50 most recent messages for the contact with ID `1` (page `2`)

### Endpoint: `/search`

This endpoint allows you to search for messages based on a keyword or a contact’s phone number. It also supports pagination.

#### Example Request

- **URL**: `http://localhost:3000/search`
- **Method**: `GET`
- **Query Parameters**:
  - `searchValue` (required): The keyword or phone number to search for.
  - `page` (optional): The page number for pagination (default is `1`).

#### Example Inputs

```plaintext
http://localhost:3000/search?searchValue=meeting
```

This will retrieve the 50 most recent messages containing the keyword "meeting."

```plaintext
http://localhost:3000/search?searchValue=123-456-7890&page=2
```

This will retrieve the next 50 messages for the contact with phone number "123-456-7890" (page `2`) (If trying to run this on your example, find a phone number that exists in your database since the phone number generation is random).

### Assumptions made during development
1. The current messages have only been created in the past 3 months, but the database will need to support more messages in the future, thus the partitioning
2. From the requirements, efficient recall of the 50 most recent messages is fulfilled, however for the search query the process is slow but I assume that is not an issue


### Key Design Decisions

1. Populating the database was done in parallel batches to increase the efficiency of the process due to the large amounts of data being generated
2. Database creates partitioned tables based on the created_at column for messages to increase scalability as the database grows larger, easier search based on date and time if needed in the future
3. Inclusion of formatting of the outputs as numbered lists and having page numbers at the end are more for easier readability during testing, will be removed when deployed
4. Search types are not split into seperate endpoints to reduce the testing of features but in actual deployment will create individual endpoints for each search type
