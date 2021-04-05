var express = require('express');
const path = require('path');
const mysql = require('mysql');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const session = require('express-session')

var app = express(); //object
// session
app.use(session({
    secret: 'testkey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}))

app.use(express.static('public'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', exphbs({ defaultLayout: 'main', extname: '.hbs' }));
app.set('view engine', 'hbs');

//First middleware before response is sent
// app.use(function(req, res, next) {

//     next();
// });

//Route handler
app.get('/signup', function(req, res) {
    //console.log(req.body)
    res.render('signup');
    //next();
});


var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "admin",
    database: "login_db"
});
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");

});
// app.post('/register', [
//     check('email').isEmail(),
//     check('phone').isLength({ min: 10 }),
//     check('password').isLength({ min: 10 })

// ], function(req, res, next) {

//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(422).json({ errors: errors.array() });
//     }

app.get('/login', function(req, res) {
    //res.json(users)
    return res.render('login', { defaultLayout: 'main' })
});

app.get('/admin', function(req, res) {
    //res.json(users)
    if (!req.session.email) {
        return res.redirect('/login')
    }
    let data = req.session.email;
    let DbEmail = 'SELECT * FROM new_table where email= ?';
    con.query(DbEmail, [data], async(error, results, fields) => {
        if (error || results.length == 0) {
            return console.error(error.message);
        }

        return res.render('admin', { defaultLayout: 'main', profile: results[0] })




    });




});






app.post("/auth", async(req, res) => {
    const data = req.body;
    const loginEmail = "SELECT * FROM new_table where email=?";

    con.query(loginEmail, [data.email], async(error, results, fields) => {
        if (error) {
            return console.error(error.message);
        }
        if (results.length > 0) {
            // console.log("result", results[0], fields);
            // console.log("data2", data.email);
            try {
                if (await bcrypt.compare(data.password, results[0].passwd)) {
                    // console.log("data", data.email);
                    req.session.email = data.email;
                    return res.send("login successfully")
                } else {
                    return res.send("Password is invalid")
                }
            } catch (error) {
                return res.send(error.message)
            }


        } else {
            res.send("email and password is invalid")
        }
    });
});
app.post('/register', function(req, res) {
    var data = req.body;
    let valid = true;
    if (data.email == "") {
        valid = false;

    }
    if (data.password == "") {
        valid = false;
    }
    if (data.lastname == "") {
        valid = false;
    }
    if (data.firstname == "") {
        valid = false;
    }
    //console.log(data.phone, data.phone.length);
    if (data.phone == '' || data.phone.length <= 9) {
        valid = false;
    }
    if (data.country == '') {
        valid = false;
    }

    if (valid === false) {
        return res.status(422).send({
            'type': 'error',
            "message": "Data validation failed"
        })
    } else {
        console.log("helo")
    }


    // console.log(data)
    //  var sql = `INSERT INTO new_table (email, passwd) VALUES ('"+ email +"', '"+ pwd +"')`;
    const validateEmail = "SELECT * FROM new_table where email=?";

    //var sql = `INSERT INTO new_table (email, passwd,phone,country) VALUES ("${data.email}", "${data.password}", "${data.phone}", "${data.country}")`;
    con.query(validateEmail, [data.email], async(error, results, fields) => {
        if (error) {
            return console.error(error.message);
        }
        if (results.length > 0) {
            return res.send("Email Exists");
            console.log("email exists")
        } else {
            const hashPassword = await bcrypt.hash(data.password, 8);
            // console.log(hashPassword)
            var sql = "INSERT INTO new_table (email, passwd,firstname,lastname,phone,country) VALUES (?,?,?,?,?,?)";
            con.query(sql, [data.email, hashPassword, data.firstname, data.lastname, data.phone, data.country], function(err, result) {
                if (err) throw err;
                console.log("1 record inserted");
                return res.send("Record created")
            });
        }
        // console.log(results);
        // console.log(fields);


    });



});
app.get('/changePassword', (req, res) => {
    res.render('changePassword', { defaultLayout: 'main' })
});

app.post("/savedPassword", async(req, res) => {
    const data = req.body;
    const checkEmail = "SELECT * FROM new_table where email=?";
    con.query(checkEmail, [data.email], async(error, results, fields) => {
        if (error) {
            return console.error(error.message);
        }
        if (results.length > 0) {
            //  res.send("Email Exists");
            // console.log("email exists")
            const hashPassword = await bcrypt.hash(data.Newpassword, 8);
            // console.log(hashPassword)
            if (await bcrypt.compare(data.password, results[0].passwd)) {
                console.log("old and new password matched")
                var sql = `UPDATE new_table SET passwd=? where email= "${data.email}" `;
                //   var sql = "INSERT INTO new_table (email, passwd,phone,country) VALUES (?,?,?,?)";
                con.query(sql, [hashPassword], function(err, result) {
                    if (err) throw err;

                    res.status(200).json({ message: 'New password created' });
                    console.log("1 password changed");

                });
            } else {
                res.status(404).json({ message: 'password not matched' });
            }



        } else {

            res.status(300).json({ message: 'email invalid' });
        }
    });
});
app.get('/forgetPassword', (req, res) => {
    res.render('forgetPassword', { defaultLayout: 'main' })
});
app.post("/newPassword", async(req, res) => {
    const data = req.body;
    const checkEmail = "SELECT * FROM new_table where email=?";
    con.query(checkEmail, [data.email], async(error, results, fields) => {
        if (error) {
            return console.error(error.message);
        }
        if (results.length > 0) {
            //  res.send("Email Exists");
            // console.log("email exists")
            const hashPassword = await bcrypt.hash(data.Newpassword, 8);
            //Newpassword hbs.
            // console.log(data.Re_enterpassword)
            // if (await (data.Newpassword) == (data.Re_enterpassword)) {
            //    if (await bcrypt.compare(data.password, results[0].passwd)) {
            //console.log("old and new password matched")
            var sql = `UPDATE new_table SET passwd=? where email= "${data.email}"`;
            //   var sql = "INSERT INTO new_table (email, passwd,phone,country) VALUES (?,?,?,?)";
            con.query(sql, [hashPassword], function(err, result) {
                if (err) throw err;

                res.status(200).json({ message: '  New password created' });
                // console.log("forget 1 password updated");

            });
            // } else {
            //     res.status(404).json({ message: 'password not matched ,plz enter again' });
            // }



        } else {

            res.status(300).json({ message: 'email invalid' });
        }
    });
});
// session
app.get('/signup', function(req, res, next) {
    if (req.session.views) {
        req.session.views++
            res.setHeader('Content-Type', 'text/html')
        res.write('<p>views: ' + req.session.views + '</p>')
        res.write('<p>expires in: ' + (req.session.cookie.maxAge / 1000) + 's</p>')
        res.end()
            // console.log("helllo" + req.session.views)
    } else {
        req.session.views = 1;
        consoles.log("hello")
        res.end('welcome to the session demo. refresh!')
    }
})




app.listen(3002);