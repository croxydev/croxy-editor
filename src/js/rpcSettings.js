const $ = require('./js/jquery.min.js');
const fs = require("fs");

$(document).ready(function() {
    getValue("details")
    getValue("state")
})

function saveChanges() {
    var details = document.getElementById("details").value;
    var state = document.getElementById("state").value;

    fs.writeFileSync("../data/rpc.json", JSON.stringify({
        details: details,
        state: state
    }), "utf-8")

}

function getValue(value) {
    const data = JSON.parse(fs.readFileSync("../data/rpc.json"))
    document.getElementById(value).value = (data[value] ? data[value] : `{${value}}`)
}