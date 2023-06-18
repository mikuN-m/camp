const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();

app.use(express.static('stylesheet'));
app.use(express.static('javascript'));

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




app.use((req,res,next) => {
    const userName = req.session.userName;
    const reservation = req.session.reservation;

    if (userName === undefined) {
        res.locals.userName = 'ゲスト';
        res.locals.login = true;
    } else {
        res.locals.userName = userName;
        res.locals.login = false;
    }

    if (reservation == false || reservation == undefined) {
        res.locals.reservation = false;
    } else {
        res.locals.reservation = true;
    }

    next();
});

// トップ
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
    res.render('sign-up.ejs',{textError: []});
});

app.get('/logOut',(req,res) => {
    req.session.destroy((error) => {
        res.redirect('/');
    });
});


//ログイン、新規登録
app.post('/login',(req,res) => {
    const mail = req.body.mail;
    const errorMs = 'メールアドレスまたはパスワードが違います';

    connection.query(
        'select * from users where mail = ?',
        [mail],
        (error,results) => {
            if (results.length > 0) {
                const name = results[0].name;
                const id = results[0].id;
                const password = req.body.password;
                const reservation = results[0].reservation;
                const hash = results[0].password;

                bcrypt.compare(password,hash,(error,isEqual) => {

                    if (isEqual) {

                        if (reservation == 'no') {
                            req.session.reservation = false;
                        } else if (reservation == 'yes') {
                            req.session.reservation = true;
                        }

                        req.session.userId = id;
                        req.session.userName = name;
                        res.redirect('/');
                    } else {
                        res.render('login.ejs',{error: errorMs});
                    }

                });
            } else {
                res.render('login.ejs',{error: errorMs});
            }
        }
    );
});

app.post('/sign-up',
(req,res,next) => {
    const name = req.body.userName;
    const mail = req.body.mail;
    const password = req.body.password;
    let textError = [];

    if (name === '') {
        textError.push('＊アカウント名が入力されていません');
    }
    if (mail === '') {
        textError.push('＊メールアドレスが入力されていません');
    }
    if (password === '') {
        textError.push('＊パスワードが入力されていません');
    }

    if (textError.length > 0) {
        res.render('sign-up.ejs',{textError: textError});
    } else {
        next();
    }

},(req,res,next) => {
    const mail = req.body.mail;
    let textError = [];

    connection.query(
        'select * from users where mail = ?',
        [mail],
        (error,results) => {
            if (results.length > 0) {
                textError.push('このメールアドレスはすでに使われています');
                res.render('sign-up.ejs',{textError: textError});
            } else {
                next();
            }
        }
    );
},(req,res) => {
    const name = req.body.userName;
    const mail = req.body.mail;
    const password = req.body.password;
    const no = 'no';

    bcrypt.hash(password,10,(error,hash) => {
        connection.query(
            'INSERT INTO users(name,mail,password,reservation) VALUES(?,?,?,?)',
            [name,mail,hash,no],
            (error,results) => {
                connection.query(
                    'select * from users where name = ?',
                    [name],
                    (error,results) => {
                        const reservation = results[0].reservation;
                        if (reservation == 'no') {
                            req.session.reservation = false;
                        } else if (reservation == 'yes') {
                            req.session.reservation = true;
                        }

                        const id = results[0].id;
                        req.session.userId = id;
                        req.session.userName = name;
                        res.redirect('/');
                    }
                );
            }
        );
    });
});


// プラン

const plans = [
    {id: 1, planAbout: '/planAbout1', img: '/img/plan-img.jpg', name: '林間サイト', site: 'フリーサイト', pplNum: '１～４人', num: 4, data: '林の中でお過ごしいただけるサイトです。バードウォッチングにも最適です。'},
    {id: 2, planAbout: '/planAbout2', img: '/img/plan-img.jpg', name: 'リバーサイト', site: 'フリーサイト', pplNum: '１～６人', num:6, data: '川のせせらぎに癒されるサイトです。魚釣りも可能です。'}
];

app.get('/plan',(req,res) => {
    res.render('plan.ejs',{plans: plans});
});

app.get('/planAbout/:id',(req,res) => {
    const id = req.params.id;
    const plan = plans[id-1];
    res.render('planAbout.ejs',{plan: plan});
});


//予約
app.get('/reserve/:id',(req,res) => {
    const id = req.params.id;
    const plan = plans[id-1];
    res.render('reserve.ejs',{plan: plan, textError: [], confirm: false});
});

app.post('/reserveNext/:id', (req,res,next) => {
    const reserveName = req.body.reserveName;
    const furigana = req.body.furigana;
    const tel = req.body.tel;
    const mail = req.body.mail;
    const data = req.body.data;
    const dataTime = req.body.dataTime;
    const pplNum = req.body.pplNum;
    let textError = [];

    if (reserveName == '') {
        textError.push('＊お名前');
    }
    if (furigana == '') {
        textError.push('＊ふりがな');
    }
    if (tel == '') {
        textError.push('＊電話番号');
    }
    if (mail == '') {
        textError.push('＊メールアドレス');
    }
    if (data == '') {
        textError.push('＊日にち');
    }
    if (dataTime == '') {
        textError.push('＊時間');
    }
    if (pplNum == null) {
        textError.push('＊人数');
    }

    if (textError.length > 0) {
        const id = req.params.id;
        const plan = plans[id-1];
        res.render('reserve.ejs',{plan: plan, textError: textError, confirm: true});
    } else {
        next();
    }
},
(req,res) => {
    const reserveName = req.body.reserveName;
    const furigana = req.body.furigana;
    const tel = req.body.tel;
    const mail = req.body.mail;
    const data = req.body.data;
    const dataTime = req.body.dataTime;
    const reserveSite = req.body.reserveSite;
    const pplNum = req.body.pplNum;
    const note = req.body.note;

    const formItem = [reserveName,furigana,tel,mail,data,dataTime,reserveSite,pplNum,note];
    res.render('confirm.ejs', {formItem: formItem});
});

app.post('/confirmation', (req,res) => {
    const reserveName = req.body.confirmationeservReName;
    const furigana = req.body.confirmationFurigana;
    const tel = req.body.confirmationTel;
    const mail = req.body.confirmationMail;
    const data = req.body.confirmationData;
    const dataTime = req.body.confirmationDataTime;
    const reserveSite = req.body.confirmationReserveSite;
    const pplNum = req.body.confirmationPplNum;
    const note = req.body.confirmationNote;
    
    const id = req.session.userId;

    console.log(reserveName,furigana,tel,mail,data,dataTime,reserveSite,pplNum,note);

    connection.query(
        'INSERT INTO reservations(name,furigana,phone_number,email,reservation_date,reservation_datatime,num_of_guests,reservation_plan,note,userId) VALUES(?,?,?,?,?,?,?,?,?,?)',
        [reserveName,furigana,tel,mail,data,dataTime,pplNum,reserveSite,note,id],
        (error,results) => {
            connection.query(
                'UPDATE users SET reservation = ? where id = ?',
                ['yes',id],
                (error, results) => {
                    req.session.reservation = true;
                    res.redirect('/');
                }
            );
        }
    );
});


//マイページ
app.get('/myPage',(req,res) => {
    const id = req.session.userId;

    if (id == undefined) {
        res.render('myPage.ejs',{reservationList: []});
    } else {
        connection.query(
            'select * from reservations where userId = ?',
            [id],
            (error,results) => {
                const reservationList = [
                    results[0].name,
                    results[0].furigana,
                    results[0].phone_number,
                    results[0].email,
                    results[0].reservation_date,
                    results[0].reservation_datatime,
                    results[0].num_of_guests,
                    results[0].reservation_plan,
                    results[0].note
                ];
                res.render('myPage.ejs',{reservationList: reservationList});
            }
        );
    }
});

app.get('/reservation-delete',(req,res) => {
    res.render('reservation-delete');
});

app.get('/delete',(req,res) => {
    const id = req.session.userId;
    
    connection.query(
        'DELETE * FROM reservations WHERE userId = ?',
        [id],
        (error,results) => {
            connection.query(
                'UPDATE users SET reservation = ? WHERE id = ?',
                ['no',id],
                (error,results) => {
                    req.session.reservation = false;
                    res.redirect('/');
                }
            );
        }
    );
});

app.listen(3000);