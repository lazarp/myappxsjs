$.response.contentType = "text/html";
$.response.setBody(JSON.stringify($.session));
$.response.status = $.net.http.OK;