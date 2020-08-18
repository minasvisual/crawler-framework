# Under construction - Not stable!

Node system to create dynamic and cronlable crawlers with business rules only.

Libs used:
- Node-Cron
- ScrapeIt

Create crawlers:
- Create model on model folder (see example in example folder)
```
module.exports = {
  status: false,   //CRAWLER RUN STATUS
  url: "https://ionicabizau.net", // URLS TO CRAW ( STRING | ARRAY ) 
  schedule: '0 0 6 * * *',  // CRON SCHEDULE
  header:{}, // MANUAL REQUEST HEADERS
  schema: {   // CRAWLER SCHEMA TO RESPONSE SEE DOCS https://github.com/IonicaBizau/scrape-it
      title: ".header h1"
    , desc: ".header h2"
    , avatar: {
          selector: ".header img"
        , attr: "src"
      }
  },
  beforeCall: async (model, scrapeIt) => {  // RUN BEFORE CALL URL - params ( This model instance | ScrapeIt Instance)
    console.log('Called before '+model.task) 
    return model; // model return required
  },
  success: ({ data, response }) => { // RUN AFTER EACH URL CALL SUCCESS
     console.log(`Status Code: ${response.statusCode}`)
     console.log(data)
  },
  error: (err) => { // RUN AFTER EACH URL CALL ERROR 
      console.log(`Error Code: ${err}`)
      console.log(err)
  },
  afterCall: async (data) => { // RUN AFTER ALL URL CALLED - params ( DATA PARAMETER IS ALL DATA RESPONSE )
    console.log('Called after') 
  }
  // export
}
```
- Test your model running 
```
node index <modelname>
```

Installation
```
npm install
```

Run All batches
```
npm index
```

#Logs 
log.txt is generated during cron processes

#Interface - localhost:<port>
- GET /logs: Get logs file
- GET /tasks: Get tasks scheduled and active
- POST /tasks?task=<modelname> : Start/Stop task

Additional packages
- lodash
- moment
- mysql2
- request
- sequelize
- nodemailer

Linux requirements
- sudo apt-get install gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wgetdo
