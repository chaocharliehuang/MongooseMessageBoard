var express = require('express');
var app = express();

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/message_board');
var Schema = mongoose.Schema;

var MessageSchema = new mongoose.Schema({
    name: {type: String, required: true, minlength: 4, maxlength: 256},
    message: {type: String, required: true, minlength: 2, maxlength: 256},
    comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}]
}, {timestamps: true});
mongoose.model('Message', MessageSchema);
var Message = mongoose.model('Message', MessageSchema);

var CommentSchema = new mongoose.Schema({
    _message: {type: Schema.Types.ObjectId, ref: 'Message'},
    name: {type: String, required: true, minlength: 4, maxlength: 256},
    comment: {type: String, required: true, minlength: 2, maxlength: 256}
}, {timestamps: true});
mongoose.model('Comment', CommentSchema);
var Comment = mongoose.model('Comment', CommentSchema);

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

var path = require('path');
app.use(express.static(path.join(__dirname, './static')));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
    Message.find({})
        .sort('-createdAt')
        .populate('comments')
        .exec(function(err, messages) {
            res.render('index', {messages: messages, prefill: {name: '', message: ''}});
        });
});

app.post('/messages', function(req, res) {
    var message = new Message(req.body);
    message.save(function(err) {
        if (err) {
            Message.find({}).sort('-createdAt').exec(function(err, messages) {
                res.render('index', {messages: messages, errors: message.errors, prefill: {name: req.body.name, message: req.body.message}});
            });
        } else {
            res.redirect('/');
        }
    });
});

app.post('/messages/:id', function(req, res) {
    Message.findOne({_id: req.params.id}, function(err, message) {
        var comment = new Comment(req.body);
        comment._message = message._id;
        comment.save(function(err) {
            if (err) {
                console.log('Error in saving comment');
                Message.find({})
                .sort('-createdAt')
                .populate('comments')
                .exec(function(err, messages) {
                    res.render('index', {messages: messages, errors: message.errors, commentErrors: {commentErrors: comment.errors, messageID: req.params.id}, prefill: {name: '', message: ''}});
                });
            } else {
                message.comments.push(comment);
                message.save(function(err) {
                    if (err) {
                        console.log('Error in saving message');
                    } else {
                        res.redirect('/');
                    }
                });
            }
        });
    });
});

app.listen(8000, function() {
    console.log("listening on port 8000");
});