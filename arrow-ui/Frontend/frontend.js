$(document).ready(function () {
    var configJSON = {}

    $.get('/sendData', function (data) {
        if (data != "") {
            var configJSON = JSON.parse(data);
            console.log("undefined");
            $("#oneViewHost").val(configJSON.oneview.host);
            $("#oneViewUser").val(configJSON.oneview.user);
            $("#oneViewPasswd").val(configJSON.oneview.passwd);
            $("#oneViewAction").val(configJSON.oneview.action);
            $("#oneViewRoute").val(configJSON.oneview.route);

            $("#serviceNowInstance").val(configJSON.servicenow.instance);
            $("#serviceNowUsername").val(configJSON.servicenow.username);
            $("#serviceNowPassword").val(configJSON.servicenow.password);
            $("#serviceNowAssignmentgroup").val(configJSON.servicenow.assignmentgroup);

            $("#arrowUsername").val(configJSON.arrow.username);
            $("#arrowPassword").val(configJSON.arrow.password);
        }
    })


    $('#saveButton').on('click', function () {

        configJSON = {
            "oneview": {
                "host": $("#oneViewHost").val(),
                "user": $("#oneViewUser").val(),
                "passwd": $("#oneViewPasswd").val(),
                "action": $("#oneViewAction").val(),
                "route": $("#oneViewRoute").val()
            },
            "servicenow": {
                "instance": $("#serviceNowInstance").val(),
                "username": $("#serviceNowUsername").val(),
                "password": $("#serviceNowPassword").val(),
                "assignmentgroup": $("#serviceNowAssignmentgroup").val()
            },
            "arrow": {
                "username": $("#arrowUsername").val(),
                "password": $("#arrowPassword").val()
            }
        }

        $.ajax({
            type: 'POST',
            url: '/getData',
            data: JSON.stringify(configJSON),
            success: function (data) { console.log(data) },
            contentType: "application/json",
            dataType: 'json'
        });


        // $.post("getData", configJSON, function (data) {
        //     console.log(data);
        // });
    });

});

