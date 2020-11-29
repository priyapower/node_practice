const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', process.env.PORT || 3000);
app.locals.title = 'Publications';

app.get('/', (request, response) => {
  response.send('Hello, Publications');
});

app.listen(app.get('port'), () => {
  console.log(`${app.locals.title} is running on ${app.get('port')}.`);
});

// RETRIEVING DATA: We are making a selection for all the papers in the database. This will return an array of all the papers we've added to the paper table:
app.get('/api/v1/papers', (request, response) => {
  database('papers').select()
    .then((papers) => {
      response.status(200).json(papers);
    })
    .catch((error) => {
      response.status(500).json({ error });
    });
});
    // Ran server in terminal: node fetching_from_database.js
    // Ran in Postman GET http://localhost:3000/api/v1/papers
    // Returned Reponse:
        // [
        //   {
        //       "id": 1,
        //       "title": "Fooo",
        //       "author": "Bob",
        //       "created_at": "2020-11-13T14:22:05.234Z",
        //       "updated_at": "2020-11-13T14:22:05.234Z",
        //       "publisher": "Minnesota"
        //   }
        // ]

// ROLLED BACK THE PUBLISHERS COLUMN MIGRATION: Now let’s say we decided we didn’t need that publisher column, and we wanted to get rid of it.
// We could rollback that change to our schema by running knex:migrate rollback.
// Now, or GET request would now return the same array without publisher columns.
    // Ran server in terminal: node fetching_from_database.js
    // Ran in Postman GET http://localhost:3000/api/v1/papers
    // Returned Reponse:
        // [
        //     {
        //         "id": 1,
        //         "title": "Fooo",
        //         "author": "Bob",
        //         "created_at": "2020-11-13T14:22:05.234Z",
        //         "updated_at": "2020-11-13T14:22:05.234Z"
        //     }
        // ]


// DIY: Write a GET request to retrieve all footnotes. Verify it works using Postman.
app.get('/api/v1/papers/footnotes', (request, response) => {
  database('footnotes').select()
    .then((footnotes) => {
      response.status(200).json(footnotes);
    })
    .catch((error) => {
      response.status(500).json({ error });
    });
});
    // Ran server in terminal: node fetching_from_database.js
    // Ran in Postman GET http://localhost:3000/api/v1/papers/footnotes
    // Returned Reponse:
        // [
        //     {
        //         "id": 1,
        //         "note": "Lorem",
        //         "paper_id": 1,
        //         "created_at": "2020-11-13T14:22:05.236Z",
        //         "updated_at": "2020-11-13T14:22:05.236Z"
        //     },
        //     {
        //         "id": 2,
        //         "note": "Dolor",
        //         "paper_id": 1,
        //         "created_at": "2020-11-13T14:22:05.236Z",
        //         "updated_at": "2020-11-13T14:22:05.236Z"
        //     }
        // ]

// ADDING DATA: POST a new paper
app.post('/api/v1/papers', (request, response) => {
  const paper = request.body;

  for (let requiredParameter of ['title', 'author']) {
    if (!paper[requiredParameter]) {
      return response
        .status(422)
        .send({ error: `Expected format: { title: <String>, author: <String> }. You're missing a "${requiredParameter}" property.`});
    }
  }

  database('papers').insert(paper, 'id')
    .then(paper => {
      response.status(201).json({ id: paper[0] })
    })
    .catch(error => {
      response.status(500).json({ error });
    });
});
    // Ran server in terminal: node fetching_from_database.js
    // Ran in Postman POST http://localhost:3000/api/v1/papers
    // NEEDED A BODY
    //     Selected raw => JSON
    //     {
    //         "title": "Blarg", "author": "Poop"
    //     }
    // Returned Reponse:
    //     {
    //         "id": 2
    //     }
    // Confirmed with GET (after I did below)
    //     [
    //         {
    //             "id": 2,
    //             "title": "Blarg",
    //             "author": "Poop",
    //             "created_at": "2020-11-13T16:22:34.023Z",
    //             "updated_at": "2020-11-13T16:22:34.023Z"
    //         }
    //     ]

// DIY: Write a POST request to add a new footnote that belongs to a pre-existing paper. Verify it works in Postman
app.post('/api/v1/papers/footnotes', (request, response) => {
  const footnote = request.body;

  for (let requiredParameter of ['note', 'paper_id']) {
    if (!footnote[requiredParameter]) {
      return response
        .status(422)
        .send({ error: `Expected format: { note: <String>, paper_id: <Integer> }. You're missing a "${requiredParameter}" property.`});
    }
  }

  database('footnotes').insert(footnote, 'id')
    .then(footnote => {
      response.status(201).json({ id: footnote[0] })
    })
    .catch(error => {
      response.status(500).json({ error });
    });
});
    // Ran server in terminal: node fetching_from_database.js
    // Ran in Postman POST http://localhost:3000/api/v1/papers
    // NEEDED A BODY
    //     Selected raw => JSON
        // {
        //     "note": "Meus Culpam", "paper_id": 2
        // }
    // Returned Reponse:
        // {
        //     "id": 3
        // }
    // Confirmed with GET (after I did below)
        // [
        //     {
        //         "id": 3,
        //         "note": "Meus Culpam",
        //         "paper_id": 2,
        //         "created_at": "2020-11-13T16:31:52.866Z",
        //         "updated_at": "2020-11-13T16:31:52.866Z"
        //     }
        // ]

// QUERYING DATA: GET a specific paper
app.get('/api/v1/papers/:id', (request, response) => {
  database('papers').where('id', request.params.id).select()
    .then(papers => {
      if (papers.length) {
        response.status(200).json(papers);
      } else {
        response.status(404).json({
          error: `Could not find paper with id ${request.params.id}`
        });
      }
    })
    .catch(error => {
      response.status(500).json({ error });
    });
});
    // Ran server in terminal: node fetching_from_database.js
    // Ran in Postman GET http://localhost:3000/api/v1/papers/1
    // Returned Reponse:
        // [
        //     {
        //         "id": 1,
        //         "title": "Fooo",
        //         "author": "Bob",
        //         "created_at": "2020-11-13T14:22:05.234Z",
        //         "updated_at": "2020-11-13T14:22:05.234Z"
        //     }
        // ]
    // Ran in Postman GET http://localhost:3000/api/v1/papers/10
    // Returned Reponse:
        // {
        //     "error": "Could not find paper with id 10"
        // }


// DIY: Write a GET request to retrieve all footnotes for a specific paper. Verify it works using Postman.
app.get('/api/v1/papers/:id/footnotes', (request, response) => {
  database('footnotes').where('paper_id', request.params.id).select()
    .then(footnotes => {
      if (footnotes.length) {
        response.status(200).json(footnotes);
      } else {
        response.status(404).json({
          error: `Could not find footnote associated with paper id ${request.params.id}`
        });
      }
    })
    .catch(error => {
      response.status(500).json({ error });
    });
});
    // Ran server in terminal: node fetching_from_database.js
    // Ran in Postman GET http://localhost:3000/api/v1/papers/2/footnotes
    // Returned Reponse:
        // [
        //     {
        //         "id": 3,
        //         "note": "Meus Culpam",
        //         "paper_id": 2,
        //         "created_at": "2020-11-13T16:31:52.866Z",
        //         "updated_at": "2020-11-13T16:31:52.866Z"
        //     }
        // ]
