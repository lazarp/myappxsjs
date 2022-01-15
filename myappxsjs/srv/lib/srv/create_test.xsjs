var conn = $.hdb.getConnection();
var query = 'SELECT "myappxsjs.db::SEQ_STUDENTS".nextval from dummy';
var nextId = conn.executeQuery(query);
conn.close();



var jsonResult;
var insertQuery =   `INSERT INTO "MYAPPXSJS"."myappxsjs.db::students" VALUES( `
                +   `60, `
                +   `'student_60', `
                +   `'Brazil', `
                +   `'Male', `
                +   `'34', `
                +   `10 `
                +   `) `;

var conn = $.hdb.getConnection();
jsonResult = conn.executeUpdate(insertQuery);
conn.commit();
conn.close();

$.response.contentType = "text/json";
$.response.setBody(jsonResult, nextId);
$.response.status = $.net.http.OK;
