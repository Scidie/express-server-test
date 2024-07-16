const express = require("express");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const Datastore = require("nedb");
const cors = require('cors')

const db = new Datastore({ filename: "users.db", autoload: true });

const app = express();
const PORT = 3000;

const SESSION_COOKIE_NAME = "session_id";
const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 7; // 1 tydzień

const corsOptions = {
  origin: 'http://127.0.0.1:5173', // Replace with your front-end URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  optionsSuccessStatus: 204 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/views"));
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: "supersecretkey", // Klucz do podpisu sesji (wymagany w produkcji)
    name: SESSION_COOKIE_NAME,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: SESSION_EXPIRATION_TIME,
      httpOnly: true,
      secure: false, // Ustaw na true, jeśli korzystasz z HTTPS w produkcji
    },
  })
);

app.get("/", (req, res) => {
  console.log(req.session)
  if (!req.session.isAuthenticated) {
    res.render("welcomePageAnonymouse")
  } else {
    const data = {
      username: req.session.username
    }
    res.render("welcomePage", { data })
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.send("Zostałeś wylogowany.");
});

app.get("/register", (req, res) => {
  res.send(`
      <h1>Rejestracja</h1>
      <form method="post" action="/register">
        <input type="text" name="username" placeholder="Nazwa użytkownika" required/><br>
        <input type="password" name="password" placeholder="Hasło" required/><br>
        <button type="submit">Zarejestruj</button>
      </form>
    `);
});

app.post("/register", async (req, res) => {
  // console.log(req.body)
  const { username, password } = req.body;

  // Sprawdzenie, czy użytkownik już istnieje
  db.find({ username: username }, async (err, users) => {
    if (users.length !== 0) {
      res.send("The user already exist!");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        username: username,
        password: hashedPassword,
        pamietnik: ""
      };

      db.insert(newUser, (err, insertedUser) => { });
      res.send("Użytkownik został zarejestrowany!");
    }
  });
});

app.get("/login", (req, res) => {
  if (req.session.username) {
    res.send(`Witaj, ${req.session.username}! Zostałeś zalogowany.`);
  } else {
    res.render("login");
  }
});

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  db.find({ username: username }, async (err, users) => {
    if (users.length === 0) {
      res.send({ isLogged: false });
    } else {
      const passwordMatch = await bcrypt.compare(password, users[0].password);
      if (!passwordMatch) {
        return res.send("Niepoprawna nazwa użytkownika lub hasło!2");
      } else {
        req.session.isAuthenticated = true;
        req.session.username = username;
        res.send({ isLoggedIn: true, userData: users[0] });
        // res.redirect("/account");
      }
    }
  })
})



const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  res.redirect("/login");
};

// app.get("/account2", isAuthenticated, async (req, res) => {
//   console.log("debug1")
//   db.find({ username: req.session.username }, async (err, users) => {
//     if (users.length === 0) {
//       res.send({ isLogged: false });
//     } else {
//       res.send({ isLoggedIn: true, userData: users[0] });
//       // res.redirect("/account");
//     }
//   })
// })

app.get("/account", isAuthenticated, (req, res) => {

  let pamietnik = ""

  db.findOne({ username: req.session.username }, (err, doc) => {
    if (!err && doc) {
      pamietnik = doc.pamietnik
    }

    const data = {
      username: req.session.username,
      pamietnik: pamietnik
    }

    res.render("accountPage", { data });

  })
});

app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});

app.post("/newData", (req, res) => {
  const newMemoValue = req.body.data

  db.findOne({ username: req.session.username }, (err, doc) => {
    if (!err && doc) {
      // Jeśli dokument istnieje, dodaj parametr "pamietnik"
      doc.pamietnik = newMemoValue

      // Zaktualizuj dokument w bazie danych
      db.update({ username: req.session.username }, doc, {}, (updateErr, numReplaced) => { })
    }
  })
})
