var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

MongoClient.connect('mongodb://127.0.0.1:27017/test_2', function (err, database) {
    if (err) console.log('Ошибка подключения к БД');
    app.get('/api/', function (req, res) {
        var searchFields = {};
        if (req.query.name) searchFields.name = patternForSearch(req.query.name);
        if (req.query.surname) searchFields.surname = patternForSearch(req.query.surname);
        if (req.query.phone) searchFields.phone = patternForSearch(req.query.phone);

        if (Object.keys(searchFields).length) {
            database.collection('users').find(searchFields).toArray(function (err, docs) {
                if (err) res.sendStatus(400);
                else res.json(docs);
            });

        } else {
            database.collection('users').find().toArray(function (err, docs) {
                if (err) res.sendStatus(400);
                else res.json(docs);
            });
        }
    });
    app.get('/api/:id', function (req, res) {
        database.collection('users').findOne({'_id': ObjectId(req.params.id)}, function (err, doc) {
            if (err) res.sendStatus(404);
            else res.json(doc);
        });
    });
    app.post('/api/', function (req, res) {
        if (req.body.name && req.body.surname && req.body.phone) {
            var newUser = {
                name: req.body.name,
                surname: req.body.surname,
                phone: req.body.phone
            };
            database.collection('users').insertOne(newUser, function (err, r) {
                if (err) res.sendStatus(500);
                else res.sendStatus(200);
            })
        } else res.sendStatus(401);
    });
    app.put('/api/:id', function (req, res) {
        var updateUser = {};
        if (req.body.name) updateUser.name = req.body.name;
        if (req.body.surname) updateUser.surname = req.body.surname;
        if (req.body.phone) updateUser.phone = req.body.phone;
        if (Object.keys(updateUser).length) {
            database.collection('users').updateOne({'_id': ObjectId(req.params.id)}, {$set: updateUser}, function (err) {
                if (err) return res.sendStatus(500);
                else res.sendStatus(200);
            });
        } else res.sendStatus(400);

    });
    app.delete('/api/:id', function (req, res) {
        database.collection('users').deleteOne({'_id': ObjectId(req.params.id)}, function (err, result) {
            if (err) return res.sendStatus(500);
            res.sendStatus(200);

        });


    });


    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });
    app.use(function (err, req, res, next) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });
});

function patternForSearch(input) {
    var str = input + '+';
    return new RegExp(str, 'i')

}
module.exports = app;
