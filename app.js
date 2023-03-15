const express = require('express');
const mysql = require('mysql');
const session = require('express-session');


const app = express();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'reiwa123',
    database: 'camp'
});

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

const ses_opt = {
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 60 * 60 * 1000 }
};
app.use(session(ses_opt));

app.use(express.static('stylesheet'));



app.use((req,res,next) => {
    const userName = req.session.userName;

    if (userName === undefined) {
        res.locals.userName = 'ゲスト';
        res.locals.login = true;
    } else {
        res.locals.userName = userName;
        res.locals.login = false;
    }

    next();
});


app.get('/',(req,res) => {
    res.render('top.ejs');
});

app.get('/login',(req,res) => {
    res.render('login.ejs',{error: null});
});

app.get('/loginSwitch',(req,res) => {
    res.render('login.ejs',{error: null});
});

app.get('/sign-upSwitch',(req,res) => {
    res.render('sign-up.ejs',{error: null});
});

app.get('/logOut',(req,res) => {
    req.session.destroy((erro) => {
        res.redirect('/');
    });
});

app.post('/login',(req,res) => {
    const mail = req.body.mail;
    const password = req.body.password;
    const errorMs = 'メールアドレスまたはパスワードが違います';

    connection.query(
        'select * from users where mail = ?',
        [mail],
        (error,results) => {
            if (results.length > 0) {
                if (results[0].password === password) {
                    req.session.userName = results[0].name;
                    res.redirect('/');
                } else {
                    res.render('login.ejs',{error: errorMs});
                }
            } else {
                res.render('login.ejs',{error: errorMs});
            }
        }
    );
});

app.post('/sign-up',(req,res) => {
    const name = req.body.userName;
    const mail = req.body.mail;
    const password = req.body.password;
    console.log(name);

    connection.query(
        'INSERT INTO users(name,mail,password) VALUE(?,?,?)',
        [name,mail,password],
        (error,results) => {
            res.redirect('/');
        }
    );
});

app.listen(3000);