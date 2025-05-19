const BASE_URL = "http://127.0.0.1:5000/api";

// Function to fetch all books from the API
async function fetchAllBooks() {
  try {
    // Make a GET request to the API endpoint
    const response = await fetch(BASE_URL + "/books");

    // Check if the response status is OK (status code 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse the JSON response
    const books = await response.json();

    // Log the books to the console or process them as needed
    return books;
  } catch (error) {
    // Handle any errors that occur during the fetch
    console.error("Failed to fetch books:", error);
  }
}

function formatDate(dateString) {
  // Create a Date object from the parsed string
  const date = new Date(dateString);

  if (isNaN(date) || dateString === null) {
    return "Not Issued";
  }

  // Extract the day, month, and year from the Date object
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  // Format the date as DD/MM/YY
  return `${day}/${month}/${year}`;
}

loadBooks = async () => {
  const books = await fetchAllBooks();
  const bookTable = document.querySelector("#book-table");
  const returnBookSelect = document.querySelector("#returnBookId");
  const borrowBookSelect = document.querySelector("#borrowBookId");
  bookTable.innerHTML = ""; // Clear existing rows
  returnBookSelect.innerHTML = '<option value="">Select a Book</option>'; // Clear existing options
  borrowBookSelect.innerHTML = '<option value="">Select a Book</option>'; // Clear existing options
  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const id = book["book_id"];
    const title = book["book_title"];
    const authorName = book["author_name"];
    const publisherName = book["publisher_name"];
    const genreName = book["genre_name"];
    const bookState = book["state"] === null ? "Present" : book["state"];
    const borrowDate = formatDate(book["borrow_date"]);
    const returnDate = formatDate(book["return_date"]);
    const customerName = book["customer_name"];
    const isBorrowed = bookState === "Borrowed";

    // Create table row for each book
    const row = document.createElement("tr");
    row.setAttribute("data-id", id);

    // Check if book is borrowed

    // Populate row with book details, including genre
    row.innerHTML = `<td>${id}</td>
                     <td><a href="#" target="_blank">${title}</a></td>
                     <td><a href="#" target="_blank">${authorName}</a></td>
                     <td><a href="#" target="_blank">${publisherName}</a></td>
                     <td><a href="#" target="_blank">${genreName}</a></td>
                     <td>${customerName}</td>
    <td>${borrowDate}</td>
    <td>${returnDate}</td>
    <td>${bookState}</td>
                     `;
    bookTable.appendChild(row);

    // // Populate the appropriate dropdown
    if (!isBorrowed) {
      // Add book to Borrow dropdown
      const option = document.createElement("option");
      option.value = id;
      option.textContent = `${id} - ${title}`;
      borrowBookSelect.appendChild(option);
    } else {
      // Add book to Return dropdown
      const returnOption = document.createElement("option");
      returnOption.value = id;
      returnOption.textContent = `${id} - ${title}`;
      returnBookSelect.appendChild(returnOption);
    }
  }
};

window.onload = function () {
  loadBooks();
};

// Handle Borrow Form Submission
document
  .getElementById("borrowForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const bookId = document.getElementById("borrowBookId").value;
    const borrowerName = document.getElementById("borrowerName").value.trim();
    const borrowDate = document.getElementById("borrowDate").value;

    if (!bookId || !borrowerName || !borrowDate) {
      alert("Please fill in all fields.");
      return;
    }

    // Confirmation Dialog
    if (!confirm(`Are you sure you want to borrow Book ID ${bookId}?`)) {
      return;
    }

    fetch(BASE_URL + "/borrow", {
      method: "POST",
      body: JSON.stringify({
        book_id: bookId,
        customer_name: borrowerName,
        borrow_date: borrowDate,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((response) => {
      if (response.ok) {
        alert(`Book ID ${bookId} has been successfully borrowed.`);
        loadBooks();
      } else {
        alert("Failed to borrow the book. Please try again.");
      }
    });
  });

// // Handle Return Form Submission
document
  .getElementById("returnForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const bookId = document.getElementById("returnBookId").value;
    const returnDateInput = document.getElementById("returnDate").value;

    if (!bookId || !returnDateInput) {
      alert("Please fill in all fields.");
      return;
    }

    // Confirmation Dialog
    if (!confirm(`Are you sure you want to return Book ID ${bookId}?`)) {
      return;
    }

    fetch("http://127.0.0.1:5000/api/return", {
      method: "POST",
      body: JSON.stringify({
        book_id: bookId,
        return_date: returnDateInput,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((response) => {
      if (response.ok) {
        alert(`Book ID ${bookId} has been successfully returned.`);
        loadBooks();
      } else {
        alert("Failed to return the book. Please try again.");
      }
    });
  });

// // Clear borrowing data from localStorage
document.querySelector("#clearDataBtn").addEventListener("click", async () => {
  if (
    confirm(
      "Are you sure you want to clear all borrowing data? This action cannot be undone."
    )
  ) {
    const res = await fetch(BASE_URL + "/clear", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      alert("All borrowing data has been cleared.");
      loadBooks();
    } else {
      alert("Failed to clear borrowing data. Please try again.");
    }
  }
});