module.exports = {
  status: false,
  url: "https://ionicabizau.net",
  schedule: '0 0 6 * * *',
  header:{},
  schema: {
      title: ".header h1"
    , desc: ".header h2"
    , avatar: {
          selector: ".header img"
        , attr: "src"
      }
  },
  beforeCall: async (model) => {
    console.log('Called before '+model.task) 
    return model;
  },
  success: ({ data, response }) => {
     console.log(`Status Code: ${response.statusCode}`)
     console.log(data)
  },
  error: (err) => {
      console.log(`Error Code: ${err}`)
      console.log(err)
  },
  afterCall: async (data) => {
    console.log('Called after') 
  }
  // export
}

// scrapeIt("https://ionicabizau.net", {
//     // Fetch the articles
//     articles: {
//         listItem: ".article"
//       , data: {

//             // Get the article date and convert it into a Date object
//             createdAt: {
//                 selector: ".date"
//               , convert: x => new Date(x)
//             }

//             // Get the title
//           , title: "a.article-title"

//             // Nested list
//           , tags: {
//                 listItem: ".tags > span"
//             }

//             // Get the content
//           , content: {
//                 selector: ".article-content"
//               , how: "html"
//             }

//             // Get attribute value of root listItem by omitting the selector
//           , classes: {
//                 attr: "class"
//             }
//         }
//     }

//     // Fetch the blog pages
//   , pages: {
//         listItem: "li.page"
//       , name: "pages"
//       , data: {
//             title: "a"
//           , url: {
//                 selector: "a"
//               , attr: "href"
//             }
//         }
//     }

//     // Fetch some other data from the page
//   , title: ".header h1"
//   , desc: ".header h2"
//   , avatar: {
//         selector: ".header img"
//       , attr: "src"
//     }
// }, (err, { data }) => {
//     console.log(err || data)
// })