const ejs = require('ejs');
try {
  ejs.render("<%- include('layout', { body: ` <script> <%- encodeURIComponent('hello') %> </script> ` }) %>", {});
  console.log("Success");
} catch(e) {
  console.log("Error:", e.message);
}
