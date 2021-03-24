const API_KEY = 'AIzaSyCRL6YECI6cUj7dbi-_U5qsh1pnEPXj-uk';
const DISCOVERY_DOCS = ["https://script.googleapis.com/$discovery/rest?version=v1"];
const SPREADSHEET_TAB_NAME = 'Sheet1';
const SPREADSHEET_TITLE = "Note Maker Sheets";

const CLIENT_ID = "267484825162-2tqqv3r1l7h2gnu40c7nv82ki0mb628m.apps.googleusercontent.com";

// run from the background.html when the chrome extension is first launched
function onGAPILoad() {
    gapi.client.init({
      'apiKey': API_KEY,
      'discoveryDocs': DISCOVERY_DOCS,
    })
  } 

  // when the message is received from the content.js to run request for google script 
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // get the user google login token to make sure user is authenticated based on the scopes set in the manifest
    // if the user is not currently logged in, google automatically requests login
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      console.log('got the token', token);
      gapi.auth.setToken({
        'access_token': token,
      });

      // app script ID from the project
      var scriptId = "AKfycbxsW2CuLmuCY43U1qpXgWJd_lFIDas1207tu05SJQKb8MWRLKfxz2EoquaXPtNDnqCo";
      
      // runs the function updateSpreadsheet with the parameters from the message sent from content.js
      var requestDetails = {
          'function': 'updateSpreadsheet',
          "parameters": request.parameters
      };

      // Make the request for the app script 
      var op = gapi.client.request({
          'root': 'https://script.googleapis.com',
          'path': 'v1/scripts/' + scriptId + ':run',
          'method': 'POST',
          'body': requestDetails
      });

      // executing the request 
      op.execute(function(resp) {
        // handle error response messages
        if (resp.error && resp.error.status) {
          console.log('Error calling API: ' + JSON.stringify(resp, null, 2));
        } else if (resp.error) {
          var error = resp.error.details[0];
          console.log('Script error! Message: ' + error.errorMessage);
          if (error.scriptStackTraceElements) {
            console.log('Script error stacktrace:');
            for (var i = 0; i < error.scriptStackTraceElements.length; i++) {
              var trace = error.scriptStackTraceElements[i];
              console.log('\t' + trace.function + ':' + trace.lineNumber);
            }
          }
        } else {
          //no errors
          var returnedVal = resp.response.result;

          // send the returned value from the app script back to the content.js
          sendResponse({returnVals: returnedVal});
        }
      });
    })
    return true;
  })

// this is so when the user clicks on the browser icon on the extension row in top of chrome, sidenav opens
chrome.browserAction.onClicked.addListener(function(tab) {

    chrome.tabs.executeScript({
        code: `
        if (document.getElementById("mSidenav").style.width == "0px") { 
            document.getElementById("mSidenav").style.width = "250px"; 
            document.body.style.marginLeft = "250px";
        } else if (document.getElementById("mSidenav").style.width == "250px") { 
            document.getElementById("mSidenav").style.width = "0";
            document.body.style.marginLeft= "0";
        } else {
            document.getElementById("mSidenav").style.width = "250px";
            document.body.style.marginLeft= "250px";
        }`
      });

});
