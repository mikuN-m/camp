"use strict";

var express = require('express');

var mysql = require('mysql');

var session = require('express-session');

var bcrypt = require('bcrypt');

var app = express();
app.use(express["static"]('stylesheet'));
app.use(express["static"]('javascript'));
var connection = mysql.createConnection({
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
var ses_opt = {
  secret: 'my_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 1000
  }
};
app.use(session(ses_opt));
app.use(function (req, res, next) {
  var userName = req.session.userName;
  var reservation = req.session.reservation;

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
}); // トップ

app.get('/', function (req, res) {
  res.render('top.ejs');
});
app.get('/login', function (req, res) {
  res.render('login.ejs', {
    error: null
  });
});
app.get('/loginSwitch', function (req, res) {
  res.render('login.ejs', {
    error: null
  });
});
app.get('/sign-upSwitch', function (req, res) {
  res.render('sign-up.ejs', {
    textError: []
  });
});
app.get('/logOut', function (req, res) {
  req.session.destroy(function (error) {
    res.redirect('/');
  });
}); //ログイン、新規登録

app.post('/login', function (req, res) {
  var mail = req.body.mail;
  var errorMs = 'メールアドレスまたはパスワードが違います';
  connection.query('select * from users where mail = ?', [mail], function (error, results) {
    //mysqlが起動しないとエラーが起きます
    if (results.length > 0) {
      var name = results[0].name;
      var id = results[0].id;
      var password = req.body.password;
      var reservation = results[0].reservation;
      var hash = results[0].password;
      bcrypt.compare(password, hash, function (error, isEqual) {
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
          res.render('login.ejs', {
            error: errorMs
          });
        }
      });
    } else {
      res.render('login.ejs', {
        error: errorMs
      });
    }
  });
});
app.post('/sign-up', function (req, res, next) {
  var name = req.body.userName;
  var mail = req.body.mail;
  var password = req.body.password;
  var textError = [];

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
    res.render('sign-up.ejs', {
      textError: textError
    });
  } else {
    next();
  }
}, function (req, res, next) {
  var mail = req.body.mail;
  var textError = [];
  connection.query('select * from users where mail = ?', [mail], function (error, results) {
    if (results.length > 0) {
      textError.push('このメールアドレスはすでに使われています');
      res.render('sign-up.ejs', {
        textError: textError
      });
    } else {
      next();
    }
  });
}, function (req, res) {
  var name = req.body.userName;
  var mail = req.body.mail;
  var password = req.body.password;
  var no = 'no';
  bcrypt.hash(password, 10, function (error, hash) {
    connection.query('INSERT INTO users(name,mail,password,reservation) VALUES(?,?,?,?)', [name, mail, hash, no], function (error, results) {
      connection.query('select * from users where name = ?', [name], function (error, results) {
        var reservation = results[0].reservation;

        if (reservation == 'no') {
          req.session.reservation = false;
        } else if (reservation == 'yes') {
          req.session.reservation = true;
        }

        var id = results[0].id;
        req.session.userId = id;
        req.session.userName = name;
        res.redirect('/');
      });
    });
  });
}); // プラン

var plans = [{
  id: 1,
  planAbout: '/planAbout1',
  img: '/img/plan-img.jpg',
  name: '林間サイト',
  site: 'フリーサイト',
  pplNum: '１～４人',
  num: 4,
  data: '林の中でお過ごしいただけるサイトです。バードウォッチングにも最適です。'
}, {
  id: 2,
  planAbout: '/planAbout2',
  img: '/img/plan-img.jpg',
  name: 'リバーサイト',
  site: 'フリーサイト',
  pplNum: '１～６人',
  num: 6,
  data: '川のせせらぎに癒されるサイトです。魚釣りも可能です。'
}];
app.get('/plan', function (req, res) {
  res.render('plan.ejs', {
    plans: plans
  });
});
app.get('/planAbout/:id', function (req, res) {
  var id = req.params.id;
  var plan = plans[id - 1];
  res.render('planAbout.ejs', {
    plan: plan
  });
}); //予約

app.get('/reserve/:id', function (req, res) {
  var id = req.params.id;
  var plan = plans[id - 1];
  res.render('reserve.ejs', {
    plan: plan,
    textError: [],
    confirm: false
  });
});
app.post('/reserveNext/:id', function (req, res, next) {
  var reserveName = req.body.reserveName;
  var furigana = req.body.furigana;
  var tel = req.body.tel;
  var mail = req.body.mail;
  var data = req.body.data;
  var dataTime = req.body.dataTime;
  var pplNum = req.body.pplNum;
  var textError = [];

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
    var id = req.params.id;
    var plan = plans[id - 1];
    res.render('reserve.ejs', {
      plan: plan,
      textError: textError,
      confirm: true
    });
  } else {
    next();
  }
}, function (req, res) {
  var reserveName = req.body.reserveName;
  var furigana = req.body.furigana;
  var tel = req.body.tel;
  var mail = req.body.mail;
  var data = req.body.data;
  var dataTime = req.body.dataTime;
  var reserveSite = req.body.reserveSite;
  var pplNum = req.body.pplNum;
  var note = req.body.note;
  var formItem = [reserveName, furigana, tel, mail, data, dataTime, reserveSite, pplNum, note];
  res.render('confirm.ejs', {
    formItem: formItem
  });
});
app.post('/confirmation', function (req, res) {
  var reserveName = req.body.confirmationeservReName;
  var furigana = req.body.confirmationFurigana;
  var tel = req.body.confirmationTel;
  var mail = req.body.confirmationMail;
  var data = req.body.confirmationData;
  var dataTime = req.body.confirmationDataTime;
  var reserveSite = req.body.confirmationReserveSite;
  var pplNum = req.body.confirmationPplNum;
  var note = req.body.confirmationNote;
  var id = req.session.userId;
  connection.query('INSERT INTO reservations(name,furigana,phone_number,email,reservation_date,reservation_datatime,num_of_guests,reservation_plan,note,userId) VALUES(?,?,?,?,?,?,?,?,?,?)', [reserveName, furigana, tel, mail, data, dataTime, pplNum, reserveSite, note, id], function (error, results) {
    connection.query('UPDATE users SET reservation = ? where id = ?', ['yes', id], function (error, results) {
      req.session.reservation = true;
      res.redirect('/');
    });
  });
}); //マイページ

app.get('/myPage', function (req, res) {
  var id = req.session.userId;
  connection.query('select * from reservations where userId = ?', [id], function (error, results) {
    if (results.length > 0) {
      var reservationList = [results[0].name, results[0].furigana, results[0].phone_number, results[0].email, results[0].reservation_date, results[0].reservation_datatime, results[0].num_of_guests, results[0].reservation_plan, results[0].note];
      res.render('myPage.ejs', {
        reservationList: reservationList
      });
    } else {
      res.render('myPage.ejs', {
        reservationList: []
      });
    }
  });
});
app.get('/reservation-delete', function (req, res) {
  res.render('reservation-delete');
});
app.get('/delete', function (req, res) {
  var id = req.session.userId;
  connection.query('DELETE * FROM reservations WHERE userId = ?', [id], function (error, results) {
    connection.query('UPDATE users SET reservation = ? WHERE id = ?', ['no', id], function (error, results) {
      req.session.reservation = false;
      res.redirect('/');
    });
  });
});
app.listen(3000);