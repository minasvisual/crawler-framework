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
  beforeCall: async (model) => {  // RUN BEFORE CALL URL
    console.log('Called before '+model.task) 
    return model;
  },
  success: ({ data, response }) => { // RUN AFTER EACH URL CALL SUCCESS
     console.log(`Status Code: ${response.statusCode}`)
     console.log(data)
  },
  error: (err) => { // RUN AFTER EACH URL CALL ERROR 
      console.log(`Error Code: ${err}`)
      console.log(err)
  },
  afterCall: async (data) => { // RUN AFTER ALL URL CALLED -  DATA PARAMETER IS ALL DATA RESPONSE
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

Additional packages
- lodash
- moment
- mysql2
- request
- sequelize
