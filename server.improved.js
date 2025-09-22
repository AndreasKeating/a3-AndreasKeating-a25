const http = require( "http" ),
      fs   = require( "fs" ),
      // IMPORTANT: you must run `npm install` in the directory for this assignment
      // to install the mime library if you"re testing this on your local machine.
      // However, Glitch will install it automatically by looking in your package.json
      // file. [DONE]
      path = require ("path"),
      mime = require( "mime" ),
      dir  = "public/";
const port = process.env.PORT || 3000;


let nextId = 1;
const appdata = [
  { id: nextId++, model: "toyota", year: 1999, mpg: 23 },
  { id: nextId++, model: "honda",  year: 2004, mpg: 30 },
  { id: nextId++, model: "ford",   year: 1987, mpg: 14 }
]

//----------- Helper Functions -----------

function withDerived(row) { //Determins age from the "year" field
  const currentYear = new Date().getFullYear();
  return { ...row, age: currentYear - Number(row.year)}; //age can be negative (I might need to add a checker)
}

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", chunk => (raw += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); }
      catch { resolve({ _raw: raw }); }
    });
  });
}

//----------------------------------------

const server = http.createServer( function( request,response ) {
  if( request.method === "GET" ) {
    handleGet( request, response )    
  }else if( request.method === "POST" ){
    handlePost( request, response ) 
  }
})

const handleGet = function( request, response ) {
  if (request.url === "/api/entries") {
    return sendJSON(response, 200, appdata.map(withDerived));
  }
  if( request.url === "/" || request.url === "/index.html") {
    return sendFile( response, "public/index.html" )
  }

  const filename = dir + request.url.slice( 1 )
  return sendFile(response, filename)
}


const handlePost = function( request, response ) {
  let dataString = ""

  request.on( "data", function( data ) {
      dataString += data 
  })

  request.on( "end", function() {
    console.log( JSON.parse( dataString ) )

    let body = {}
    try { body = JSON.parse( dataString || "{}" ) } catch { body = {} }
    
    //--ADD Handler (server) --------------
    if ( request.url === "/api/entries" ) {
      const { model, year, mpg } = body || {}
      const base = { id: nextId++, model: String(model), year: +year, mpg: +mpg }
      const full = withDerived(base)
      appdata.push(full)

      return sendJSON( response, 201, full )
    }

    //--DELETE Handler (server) --------------
    if (request.url === "/api/delete") {
      const id = Number(body && body.id);
      const idx = appdata.findIndex(r => Number(r.id) === id);

      if (idx === -1){ //in case ID doesn't exist
        return sendJSON(response, 404, { error: "Item not found" });
      }

      const removed = appdata.splice(idx, 1)[0];
      return sendJSON(response, 200, removed);
    }

    console.log( body )

    response.writeHead( 200, "OK", {"Content-Type": "text/plain" })
    response.end("test")
  })
}

const sendFile = function( response, filename ) {
   const type = mime.getType( filename ) 

   fs.readFile( filename, function( err, content ) {

     if( err === null ) {

       // status code: https://httpstatuses.com
       response.writeHeader( 200, { "Content-Type": type })
       response.end( content )

     }else{

       // file not found, error code 404
       response.writeHeader( 404 )
       response.end( "404 Error: File Not Found" )

     }
   })
}

//server.listen( process.env.PORT || port )
server.listen(process.env.PORT || port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});