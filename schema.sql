-- Authors table
CREATE TABLE author (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Publishers table
CREATE TABLE publisher (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Genres table
CREATE TABLE genre (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Customers table
CREATE TABLE customer (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Books table
CREATE TABLE book (
    id VARCHAR(10) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    authorid INTEGER NOT NULL REFERENCES author(id) ON DELETE CASCADE,
    publisherid INTEGER NOT NULL REFERENCES publisher(id) ON DELETE CASCADE,
    genreid INTEGER NOT NULL REFERENCES genre(id) ON DELETE CASCADE
    -- Note: No 'state' column here; status tracked via borrowed table
);

-- Borrowed (borrowing records) table
CREATE TABLE borrowed (
    id SERIAL PRIMARY KEY,
    bookid VARCHAR(10) NOT NULL REFERENCES book(id) ON DELETE CASCADE,
    customerid INTEGER NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
    state VARCHAR(20) NOT NULL CHECK (state IN ('Borrowed', 'Returned')),
    borrow_date DATE NOT NULL,
    return_date DATE
);




-- Insert sample authors
INSERT INTO author (name) VALUES
('J.K. Rowling'),
('George Orwell'),
('J.R.R. Tolkien'),
('Agatha Christie'),
('Stephen King');

-- Insert sample publishers
INSERT INTO publisher (name) VALUES
('Bloomsbury'),
('Penguin Books'),
('HarperCollins'),
('Harlequin'),
('Scribner');

-- Insert sample genres
INSERT INTO genre (name) VALUES
('Fantasy'),
('Science Fiction'),
('Mystery'),
('Horror'),
('Classics');

-- Insert sample books
INSERT INTO book (id, title, authorid, publisherid, genreid) VALUES
('b1', 'Harry Potter and the Philosopher\'s Stone', 1, 1, 1),
('b2', '1984', 2, 2, 5),
('b3', 'The Hobbit', 3, 3, 1),
('b4', 'Murder on the Orient Express', 4, 2, 3),
('b5', 'The Shining', 5, 5, 4);

-- Insert sample customers
INSERT INTO customer (name) VALUES
('Alice'),
('Bob'),
('Charlie');

-- Insert sample borrowed records
INSERT INTO borrowed (bookid, customerid, state, borrow_date, return_date) VALUES
('b2', 2, 'Borrowed', '2025-05-10', NULL),  -- Bob borrowed '1984'
('b5', 1, 'Returned', '2025-04-01', '2025-04-15'); -- Alice borrowed and returned 'The Shining'
