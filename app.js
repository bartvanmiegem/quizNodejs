var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var routes = require('./routes/index');
var users = require('./routes/users');
var PORT = 4444;
var app = express();


var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

var clients = {}; //id->name
var sockets={}; //socketid->socket
var numUsers=0;

io.on('connection', function(socket){
  numUsers++;
  socket.on('nieuwe gebruiker', function(naamgebruiker){
    console.log('Nieuwe gebruiker in chat');
    clients[socket.id] = naamgebruiker;
    sockets[socket.id]=socket;
    for(var i=0; i< Object.keys(clients).length; i++){ //sturen naar al de rest dat er een nieuwe chatter is
      var socketid = Object.keys(clients)[i];
      if(socketid!=socket.id){
        socket.emit('addUser',clients[socketid]); //de andere op de hoogte brengen
        sockets[socketid].emit('addUser', clients[socket.id]); //jezelf ook updaten
      }
    }
    if(numUsers!=1){
      socket.emit('beginbericht', "Er zijn "+numUsers+" gebruikers online");
    }
    else{
      socket.emit('beginbericht', "Je bent de enige die online is");
    }
  });
  
  socket.on('chat bericht', function(msg){
    var gestuurd=false;
    for(var j=0;j<Object.keys(msg).length;j++){ //alle geselecteerde gebruikers aflopen
      var bericht = msg[Object.keys(msg)[j]]; 
      var gebruiker = Object.keys(msg)[j]; //naar wie wil hij het sturen
      if(gebruiker!='ALL'){
        for(var i=0; i< Object.keys(clients).length; i++){ //sturen naar al de rest dat er een nieuwe chatter is
          var naam = clients[Object.keys(clients)[i]];
          if(naam==gebruiker){
            sockets[Object.keys(clients)[i]].emit('chat bericht', clients[socket.id]+": "+bericht); //sturen naar specifiek gebruiker
            break;
          }
        }
        if(!gestuurd){
          socket.emit('chat bericht', clients[socket.id]+": "+bericht); //sturen naar jezelf, slechts 1x
          gestuurd=true;
        }
        
      }
      else{
        io.emit('chat bericht', clients[socket.id]+": "+bericht); //naar iedereen, inclusief jezelf, sturen
      }
    }
  });

  socket.on('disconnect', function(){
    numUsers--;
    delete clients[socket.id];
    delete sockets[socket.id];
    console.log('gebruiker disconnected');
    io.emit("removeUser",clients[socket.id]);
  });
});


server.listen(PORT, function(){
  console.log("De server is aan het runnen! Surf naar localhost:"+PORT);
});


module.exports = app;
