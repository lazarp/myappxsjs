var conn = $.hdb.getConnection();
var query = 'SELECT * FROM "myappxsjs.db::students" WHERE "score" > 90 ORDER BY "score" DESC';
var results = conn.executeQuery(query);
conn.close();

$.response.contentType = "text/json";
$.response.setBody(results);
$.response.status = $.net.http.OK;
