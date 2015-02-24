var path = require('path');
var threads = require(path.join(__dirname, 'config'));

// Export Routes/Pre
module.exports = [
  // CREATE THREAD
  { method: 'POST', path: '/threads', config: threads.create },
  // QUERY for threads under: board_id
  { method: 'GET', path: '/threads', config: threads.byBoard },
  // GET
  { method: 'GET', path: '/threads/{id}', config: threads.find },
  // DON'T UPDATE THREAD (update should be done in post)
  // DON'T DELETE THREAD (for now, should delete all posts?)
  // POST IMPORT
  { method: 'POST', path: '/threads/import', config: threads.import }
];