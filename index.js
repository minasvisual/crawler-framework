"use strict"
global.BASEURI = __dirname
// docs https://github.com/IonicaBizau/scrape-it
var http = require('http');
const fs = require("fs")
var url = require('url')
const scrapeIt = require("scrape-it")
var cron = require('node-cron');
var Config = require('./config');
var Helpers = require('./src/helpers');

  
var log = Helpers.log

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

// CALL BEFORE CALLBACK
var beforeModel = async (model) => {
  if( model.beforeCall ) 
    return  await model.beforeCall(model, scrapeIt)
  else 
    return model;
}

// CRAWLER CORE
var core = async function(model){
  if( !model || !model.url || !model.schema ) throw "Invalid model for "+activeTask+", are you return it?";
  if( typeof model.url == 'string') model.url = [model.url];
  if( !Array.isArray(model.url) ) throw "URL Invalida";
  
  var rtn = [];
  for(var i=0; i < model.url.length; i++ ){
    var opts = {
        url: model.url[i],
        rejectUnauthorized: false,
        requestCert: true,
        agent: false
    }
    if( model.header && Object.values(model.header).lenght > 0 ) opts['headers'] = model.header;
    if( model.options && Object.values(model.options).lenght > 0 ) opts = Object.assign(opts, model.options);
    
    var proms;
    if( !model.eachUrl )
      await scrapeIt(opts, model.schema ) 
                .then( async (i) => { rtn.push(i.data); return i; })
                .then(model.success || (async () => console.log) )
                .catch(model.error || (async () => console.log) )
    else
      await model.eachUrl(opts, model)
              .then( async (i) => { rtn.push(i.data); return i; })
              .then(model.success || (async () => console.log) )
              .catch(model.error || (async () => console.log) )
    
       
  }
  return Promise.resolve(rtn);
}

// CALL AFTER CALL
var afterCall = async function(json){
  if( !model ) return ;
  if( model.afterCall ) model.afterCall(model, json)
}

// CALL IF MODEL HAS SCHEDULE
var scheduling = (runfile, model) =>{

  if( !tasks[runfile] && model.schedule && (!model.status || model.status === true) ){
      console.log('Scheduling Task '+runfile, ' every ' +model.schedule )
      tasks[runfile] = cron.schedule( model.schedule , ((data) => {
        console.log(`Running a task ${runfile} every ${model.schedule} - ${new Date().toString()}`, data );
        runner(data)
      }).bind(null, runfile), {
        scheduled: true,
        task: runfile
      });  
      return true;
   }
   return false;
}

// RUN ORCHESTRATOR
var runner = function(runfile, cb, startup){
  startup = startup || false;
  cb = cb || console.log;
  
  console.info('Init runner for ' + runfile)
  
  if( !runfile ){ cb(false); return; }
  
  activeTask = runfile;
  model = require(`./models/${runfile}`)
  
  if( !model || !model.schema ){ cb(false); return; }
  model.task = runfile;
  // CHECK IF CRON ACTIVE
  if( model && model.status === false && tasks[runfile] ){
    console.info('Run deactivated in model ' + runfile)
    tasks.stop();
    tasks[runfile] = null;
  }
  //CHECK IF MODEL ACTIVE
  if( model && model.status === false ){ 
      console.info('Status deactivated in model ' + runfile)
      cb(false); return; 
  }
  // CHECK IF AUTOSTART ACTIVE
  if( model && model.startup === false && startup === true ){ 
    console.info('Startup deactivated in model ' + runfile)
    scheduling(runfile, model); 
    cb(false); 
    return; 
  }
     
  console.log('Ininializing Task '+runfile, 'startup '+startup )
  Promise.resolve(model)
      .then(beforeModel)
      .then(core)
      .then(afterCall)
      .catch((rtn) => console.error('Run Error: ', rtn || '' ))
      .then((rtn) => {
           console.log('Complete Task: '+runfile, rtn || '' )
           scheduling(runfile, model)
           model = null;
       })
      .then( (cb || console.log) )
}


//
// boostrap crawler
//

var count = 0;
var listModels = []
var getModels = async () => { 
  fs.readdirSync('./models').map((file) => {
    if( file.indexOf('.js') > -1 )
      listModels.push( file.replace('.js', '') );
  })
  console.log('models: ', listModels)
}

var bootstrap = function(rtn){
   count += 1;
   if( listModels[count] ) runner(listModels[count], bootstrap, true);
}
var init = function(){
  if( listModels.length > 0 && count < listModels.length ){
    runner( listModels[count], bootstrap, true);
  }
}


if( activeTask && fs.existsSync( __dirname +'/models/'+ activeTask +'.js') ) {
  console.log('Running model: ', activeTask)
  runner(activeTask, () => console.log)
}else if( activeTask ){
  console.log('Model not exists ' + activeTask)
}else{
  console.log('Server running at http://localhost:'+Config.port+'/')
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
          res.end('<h1>Crawler Framework</h1>');
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
      default:
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
      break;
   }
  }).listen( Config.port );
}