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

2. **Configure the PostgreSQL Connection**:
   - Ensure your PostgreSQL server is running locally and accepting connections.
   - Update the connection details in the `db.js` file (or wherever you have defined your PostgreSQL connection) to match your local configuration:
     ```javascript
     const pool = new Pool({
       user: 'your-username',
       host: 'localhost',
       database: 'postgres',
       password: 'your-password',
       port: 5432,
     });
     ```

### 4. Run the Server

```bash
node app.js
```

You should see a message indicating that the server is running on `http://localhost:3000`.

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

3. If successful, you should receive a message like:
   ```plaintext
   Database populated and partitioned successfully.
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

This will retrieve the next 50 most recent messages for the contact with ID `1` (page `2`).

#### Example Response

```json
[
  "1. Hello there!",
  "2. How are you?",
  "3. Meeting at 10 AM.",
  ...
]
```

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

This will retrieve the next 50 messages for the contact with phone number "123-456-7890" (page `2`).

#### Example Response

```json
[
  "1. Meeting at 10 AM.",
  "2. Are we still meeting today?",
  "3. Please confirm the meeting time.",
  ...
]
```

## Additional Notes

- **Database Configuration**: Ensure that your PostgreSQL connection details in the application match your local setup.
- **Data Volume**: Be cautious when running the `/populate` endpoint, as it generates large amounts of data. Make sure your machine can handle the load.

## Troubleshooting

- **Database Connection Errors**: Ensure your PostgreSQL server is running and that your connection details are correct.
- **Memory Issues**: If you encounter memory issues when populating the database, consider reducing the number of generated contacts and messages.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.