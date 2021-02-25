// https://www.html5rocks.com/en/tutorials/websockets/basics/

$(document).ready(function (event) {

    var connection = new WebSocket('ws://localhost:8001'); // ['soap', 'xmpp']);

    connection.onopen = function () {
        connection.send('Ping'); // Send the message 'Ping' to the server

        simpleGet();
    };

// Log errors
    connection.onerror = function (error) {
        console.log('WebSocket Error ' + error);
    };

// Log messages from the server
    connection.onmessage = function (e) {
        console.log('Server: ' + e.data);
    };

    function simpleGet() {
        restman.request.raw_request(
            "GET",
            "https://dev.fortivoice-cloud.com/api/0.0.1/pbx/access/current_pbx_config",
            {},
            {},
            function (data, textStatus, jqXHR, duration) {
                $('#ResponseStatus').text(jqXHR.status + " " + jqXHR.statusText).addClass("code" + jqXHR.status);

                content_type = jqXHR.getResponseHeader("Content-type");
                content_simple_type = "text"; // By default, assume text

                if (content_type != null) {
                    if (content_type.indexOf("application/json") >= 0 || content_type.indexOf("application/javascript") >= 0) {
                        content_simple_type = "javascript";
                        data = js_beautify(data);
                    } else if (content_type.indexOf("text/html") >= 0 || content_type.indexOf("application/xhtml+xml") >= 0 || content_type.indexOf("application/xml") >= 0) {
                        content_simple_type = "htmlmixed";
                        data = html_beautify(data);
                    }
                }

                // Calculate length of response
                content_length = jqXHR.getResponseHeader("Content-Length");
                if (content_length == null) {
                    content_length = data.length
                }

                $('#ResponseType').text(content_type);
                $('#ResponseSize').text(content_length + " bytes");
                $('#ResponseTime').text(parseFloat(duration).toFixed(2) + " ms");

                // Set body
                restman.ui.editors.setValue("#ResponseContentText", data);

                connection.send(data);
                var iframe = $('#ResponseContentHtml > iframe');
                try {
                    iframe.contents().find('html').html(data);
                } catch (e) {
                    // An error is thrown if the html links images or scripts
                    // outside of the permissions of the extension
                    console.info('Ignoring non-available resources, probably because of security restrictions')
                }
                $('[data-target="#ResponseContentText"][data-switch-type="' + content_simple_type + '"]').click()

                // Set response headers
                var response_headers = jqXHR.getAllResponseHeaders().split("\n");
                $('#ResponseHeaders > li:not([data-clone-template])').remove();
                for (var i in response_headers) {
                    var headervalue = response_headers[i];
                    var sep = headervalue.indexOf(":");

                    var key = headervalue.substring(0, sep).trim();
                    var value = headervalue.substring(sep + 1).trim();

                    if (key !== "") {
                        var row = restman.ui.dynamic_list.add_item($('#ResponseHeaders'));
                        row.find('.key').text(key);
                        row.find('.value').text(value);
                    }
                }
                $('#progress').get(0).value = 0;
                $(".shouldwait").removeClass('loading');
            },
            function (evt) {
                console.table(evt);
            },
            function (err) {
                console.error(err);
            }
        );
    }

});
