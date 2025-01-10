import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "asdadsad",  // Cambio nombre para no tener problemas
  host: "localhost",
  database: "books",
  password: "asdasdsada", // Cambio la contraseña para no tener problemas
  port: 5432,
})
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let sort = "title";

app.get("/", async (req, res) => {
  try {
    const response = await db.query(`SELECT * FROM books JOIN review_books ON books.id = review_books.id ORDER BY ${sort} ASC`);
    const data = response.rows;
    res.render("index.ejs", {data: data, selectedOption: sort});
  } catch (err) {
    console.log(err);
  }
});

app.post("/sort", async (req, res) => {
  sort = req.body.sort;
  res.redirect("/");
});

app.get("/book", async (req, res) => {
  const title = req.query.title;
  const author = req.query.author;
  const coverISBN = req.query.coverISBN;
  const review = req.query.book_review;
  const rating = req.query.book_rating;

  try {
    const response = await db.query("SELECT * FROM books JOIN review_books ON books.id = review_books.id");
    const data = response.rows;
    const bookCheck = data.find((book) => book.title == title);  // Buscamos el libro que contenga el titulo asignado

    res.render("edit.ejs", {
      title: title,
      author: author,
      cover: coverISBN,
      review: review,
      rating: rating,
      book_id: bookCheck.id
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/addBook", async (req, res) => {
  res.render("addBook.ejs");
});

app.post("/addBook", async (req, res) => {
  const title = req.body.title;
  const author = req.body.author;
  const isbn_code = req.body.isbn_code;
  const review = req.body.review;
  const rating = req.body.rating;
  const date = new Date().toLocaleDateString();

  try {
    const newBook = await db.query("INSERT INTO books (title, author, isbn_code) VALUES ($1, $2, $3) RETURNING *", [title, author, isbn_code]);
    const data = newBook.rows;
    await db.query("INSERT INTO review_books (id, rating, review_text, review_date) VALUES ($1, $2, $3, $4)", [data[0].id, rating, review, date]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.post("/updateReview", async (req, res) => {
  console.log(req.body);
  const review = req.body.review;
  const rating = req.body.rating;
  const date = new Date().toLocaleDateString();
  const id = req.body.book_id;

  try {
    await db.query("UPDATE review_books SET review_text = $1, rating = $2, review_date = $3 WHERE review_books.id = $4 RETURNING *", [review, rating, date, id]);
    res.redirect("/");
  } catch(err) {
    console.log(err);
  }
})

app.post("/delete", async (req, res) => {
  const title = req.body.title;
  try {
    const response = await db.query("SELECT * FROM books WHERE title = $1", [title]);
    const data = response.rows;
    console.log(data[0].id);
    await db.query("DELETE FROM review_books WHERE id = $1", [data[0].id]);
    await db.query("DELETE FROM books WHERE id = $1", [data[0].id]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });