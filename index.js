"use strict"
// docs https://github.com/IonicaBizau/scrape-it
var http = require('http');
const fs = require("fs")
var url = require('url')
const scrapeIt = require("scrape-it")
var cron = require('node-cron');
var Config = require('./config');

var log = (data, json) => fs.appendFile('./log.txt', data + JSON.stringify(json) + '\r', function (err) {
    if (err) throw err;
  })

var console = {
  log, 
  info: log,
  error: log
}
 

// Promise interface
let model;
let tasks = new Object();
let args = process.argv.slice(2);
let activeTask = args[0];

var beforeModel = async (model) => {
  if( model.beforeCall ) 
    return  await model.beforeCall(model, scrapeIt)
  else 
    return model;
}
var core = async function(model){
  if( !model || !model.url || !model.schema ) throw "Model inválida para "+activeTask+", voce retornou-a?";
  if( typeof model.url == 'string') model.url = [model.url];
  if( !Array.isArray(model.url) ) throw "URL Invalida";
  
  var rtn = [];
  for(var i=0; i < model.url.length; i++ ){
    await scrapeIt( model.url[i], model.schema )
      .then( async (i) => {
         rtn.push(i.data);
         return i;
      })
      .then(model.success || console.log)
      .catch(model.error || console.log)
  }
  return Promise.resolve(rtn);
}

var afterCall = async function(json){
  if( !model ) return ;
  if( model.afterCall ) model.afterCall(model, json)
}

var runner = function(runfile, cb){
  if( !runfile ){ cb(false); return; }
  
  activeTask = runfile;
  model = require(`./models/${runfile}`)
  
  if( !model || !model.schema ){ cb(false); return; }
  model.task = runfile;
    
  if( model && model.status === false && tasks[runfile] ){
    tasks.stop();
    tasks[runfile] = null;
  }
  
  if( model && model.status === false ){ cb(false); return; }
  
  Promise.resolve(model)
      .then(beforeModel)
      .then(core)
      .then(afterCall)
      .catch((rtn) => console.error('Erro', rtn))
      .then((rtn) =>{
        console.log('Finalizado', rtn)

        if( !tasks[runfile] && model.schedule && (!model.status || model.status === true) ){
            tasks[runfile] = cron.schedule( model.schedule , ((data) => {
              console.log(`running a task ${data} every ${model.schedule} - ${new Date().toString()}`, data );
              runner(data)
            }).bind(null, runfile), {
              scheduled: true,
              task: runfile
            });  
//             tasks[runfile] = setInterval( (data) => {
//               console.log(`running a task ${data} every ${model.schedule} min - ${new Date().toString()}`, data );
//               runner(data)
//             }, (60000 * model.schedule), runfile );
//             console.log('passou cron')
        }
         return true;
      })
      .then(cb)
}


//
// boostrap crawler
//

var count = 0;
var listModels = []
var getModels = async () => { 
  fs.readdirSync('./models').map((file) => {
    console.log(file)
    listModels.push( file.replace('.js', '') );
  })
}

var bootstrap = function(rtn){
   count += 1;
   if( listModels[count] ) runner(listModels[count], bootstrap)
}
var init = function(){
  if( listModels.length > 0 && count < listModels.length ){
    runner( listModels[count], bootstrap);
  }
}


if( activeTask && fs.existsSync( __dirname +'/models/'+ activeTask +'.js') ) {
  console.log('Entrou no runfile', activeTask)
  runner(activeTask, () => console.log)
}else if( activeTask ){
  console.log('File not exists')
}else{
  getModels();
  init();
  setInterval(init, 60000)
  
  // cron.schedule('* * */1 * *', () => {
  //   console.log('running a task every hour '+ new Date().toString() );
  // });
  http.createServer(function(req,res){
   // normalize url by removing querystring, optional
   // trailing slash, and making it lowercase
   var path = req.url.replace(/\/?(?:\?.*)?$/, '').toLowerCase();  //REMOVE CARACTERES ESPECIAIS DA URL
   switch(path) {
      case '':
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Homepage</h1><img src="image">');
      break;
      case '/logs':
           res.setHeader('Content-Type', 'application/json');
           res.end(fs.readFileSync('./log.txt'));
      break;    
      case '/tasks':
        if(req.method == 'POST'){
           var msg = '';
           var qr = url.parse(req.url, true).query;
           if( qr['task'] && tasks[qr['task']] && qr['action'] == 'stop' ){
             tasks[qr['task']].stop();
             delete tasks[qr['task']];
             msg = 'Task stopped successfully';
           }else if( qr['task'] && !tasks[qr['task']] && qr['action'] == 'start' ){
             runner(activeTask, () => console.log)
             msg = 'Task start successfully';
           }

           res.setHeader('Content-Type', 'text/plain');
           res.end( JSON.stringify({message: msg}) );
        }else{
           res.setHeader('Content-Type', 'text/plain');
           res.end( JSON.stringify(Object.keys(tasks)) );
        }
      break;
      case '/tasks/:name':
          fs.readFile( './image.jpg', (err, content)=>{
              res.writeHead(200, { 'Content-Type': 'text/plain' });
              res.end(content);
          }  )
      break;
      default:
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
      break;
   }
  }).listen( Config.port );
  console.log('Server running at http://localhost:'+Config.port+'/')
}

