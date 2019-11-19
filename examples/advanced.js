const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
  username: '',
  password: '',
  database: '',
  host: '',
  dialect: 'mysql',
});
const Op = Sequelize.Op

Model.init({
  title: DataTypes.STRING,
  content	: Sequelize.TEXT,	
  cover:	DataTypes.STRING,
  artists	:{ type: DataTypes.STRING, default:'[]' },
  status	:{ type: Sequelize.INTEGER, default:1 },
  category:{ type: Sequelize.INTEGER, default:1 },
  source	: DataTypes.STRING,
  account_id:{ type: Sequelize.INTEGER, default:9 }
}, { sequelize, modelName: 'blog', tableName: 'blog', timestamps: false });

module.exports = {
  status: true,
  schedule: '0 0 7 * * *', //every day 07 am
  url: [], //dynamic url discover
  header:{},
  schema: {
        title: ".site-content .entry-header h1.entry-title",
        content: {
          selector:".site-content .entry-content", 
          how: "html"
        },
        cover: {
          selector:".site-content img:first-child",
          attr: "src"
        },
  },
  beforeCall: async (model, scrapeIt) => {  // params:( this model instance | scrapeIt instance )
    console.log('Called before') 
    // call link to discover posts
    model = await scrapeIt( "https://pequenosclassicosperdidos.com.br/category/darkwave/", {
        url:{
          listItem: '.site-content article',
          data: {
            link:{
              selector:'.entry-title a',
              attr: 'href'
            }
          }
        }
      })
      .then(({ data, response }) => {
         // set new urls on model instance
         if(response.statusCode == 200)
            model.url = data.url.map(i => i.link);
      
         return model;
      })
    return model; // model return required
  },
  success: async ({ data, response, $ }) => {
     console.log(`Status Code: ${response.statusCode}`)
     if( response.statusCode == 200 ){
       data.source = response.responseUrl;
       // storage results on mysql database
       await Model.count({ where: { 
           [Op.or]: {
              title : data.title,
              source: response.responseUrl
           }
         }
       }).then((c) => {
         if(c <= 0){ 
           data.content = data.content.replace(/<div id\=\"jp\-post\-flair\".*>.*?<\/div>/ig,'');
           Model.create(data);
         }
       })
     }
     return Promise.resolve(data) // promise return required
  },
  error: async (err) => {
      console.log(`Error Code: ${err}`)
      console.log(err)
  },
  afterCall: async (data) => {
    console.log('Called after') 
  }
  // export
}