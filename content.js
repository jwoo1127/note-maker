// inserts HTML code for the sidenav onto the new websites login
document.body.insertAdjacentHTML('afterbegin', `
    <div id="mSidenav" class="sidenav">
        <div class="tab">
            <a href="javascript:void(0)" id="closeBtn">&times;</a>
            <button class="tablinks" onclick="openTab(event, 'Notes')" id="defaultOpen">Notes</button>
            <button class="tablinks" onclick="openTab(event, 'Flashcards')">Flashcards</button>
        </div>

        <div id="Notes" class="tabcontent">
            <span role="textbox" class="notes-area" contenteditable></span>
        </div>

        <div id="Flashcards" class="tabcontent">
            <div id="flashcards-list">
                <fieldset class="flashcard-container" id="template">
                    <a href="javascript:void(0)" class="closebtn" onclick="deleteFlashcard(event)">&times;</a>

                    <span role="textbox" class="term" contenteditable></span>
                    <span role="textbox" class="definition" contenteditable></span>
                </fieldset>

                <fieldset class="flashcard-container">
                    <a href="javascript:void(0)" class="closebtn" onclick="deleteFlashcard(event)">&times;</a>

                    <span role="textbox" class="term" contenteditable></span>
                    <span role="textbox" class="definition" contenteditable></span>
                </fieldset>

                <fieldset class="flashcard-container">

                    <a href="javascript:void(0)" class="closebtn" onclick="deleteFlashcard(event)">&times;</a>

                    <span role="textbox" class="term" contenteditable></span>
                    <span role="textbox" class="definition" contenteditable></span>
                </fieldset>
            </div>

            <button id="addMoreBtn"><span class="plusSymbol">&#43;</span> Add More Cards</button>
        </div>
    </div>
    `);

// insert functions for the onclick buttons for the tabs and close buttons on each individual flashcards
// function openTab: closes all visuals of the other tab, and then sets the button with the parameter 
// tabName as the "active" to make it visible

// function deleteFlashcard(): deletes the flashcard's parent, which is the flashcard-container fieldset
// the fieldset is what contains all components of each individual flashcard, so deleting parent deletes
// one entire flashcard
var script_tag = document.createElement('script');
script_tag.type = 'text/javascript';
holder = document.createTextNode(`
document.getElementById("defaultOpen").click();
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
  }
  
function deleteFlashcard(evt) {
    var deleteParent = evt.currentTarget.parentNode;
    deleteParent.remove();
}`
);
script_tag.appendChild(holder);
document.body.appendChild(script_tag);

// when the add more button is clicked on, the flashcards-list is appended one more flashcard-container
document.getElementById("addMoreBtn").onclick = addMoreFlashcards;

// when the X button is clicked  from the top right of the tab buttons, close the sidenav
document.getElementById("closeBtn").onclick = function() {
    document.getElementById("mSidenav").style.width = "0";
    document.body.style.marginLeft= "0";
}

// adds more flashcards to the flashcards-list div
// there is one invisible template flashcards that is copied without the template id
// this way the container is visible and a new flashcard is actually appended to the flashcards-list
function addMoreFlashcards() {
    var containFlashcards = document.getElementById("flashcards-list");
    var original = document.getElementsByClassName("flashcard-container");
    var copy = original[0].cloneNode(true);

    copy.id = "";
    copy.getElementsByClassName("term")[0].value = "";
    copy.getElementsByClassName("definition")[0].textContent = "";

    containFlashcards.appendChild(copy);
}

var typingTimer;
var doneTypingInterval = 750;  
var notesInput = document.getElementsByClassName("notes-area")[0];
var termInputs = document.getElementsByClassName("term");
var defInputs = document.getElementsByClassName("definition");

// on keyup, start the countdown
document.getElementById("mSidenav").addEventListener('keyup', function (e) {
    // if the focus of where the key was raised is where the inputs are in the sidenav
    if (e.target.tagName.toLowerCase().includes('span')) {
        // reset the timer to start the timer again; when timer ends, run the doneTyping function
        clearTimeout(typingTimer);
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
    }
});

function doneTyping() {
    var flashcards = [];
    
    // iterate through all flashcards and get the term and definition values into the flashcards array
    for (var i = 1; i < termInputs.length; i++) {
        var term = termInputs.item(i).textContent.trim();
        var def = defInputs.item(i).textContent.trim();
        if (term != "" || def != "") {
            flashcards.push([term, def]);
        }
     }

     // if there are no flashcards, add a filler value for the array
    if (flashcards.length == 0) 
        flashcards = "filler_value_for_this_code";
    
    // send message to the background.js to run server request and update the spreadsheet
    // message contains the parameters set as (site url, notes taken in notes-area, and flashcards list)
    chrome.runtime.sendMessage({parameters: [window.location.href, notesInput.textContent, flashcards]});

    console.log("edited done!")
}

// when the user opens new site for the first time, request value from spreadsheet based on new url
// to check if this website has previously taken notes
// NOTE: adding parameter null indicates to the google script that request is to try to get values of previously taken notes
chrome.runtime.sendMessage({parameters: [window.location.href, null, null]}, function(response) {
        // if the response doesn't equal null, that means this website has previously taken notes before
        // which is now returned back to the content.js to add to the inputs in the sidenav
        if (response.returnVals != null) {
            var notesVal = response.returnVals[0];
            var flashcardsList = JSON.parse(response.returnVals[1]);

            notesInput.textContent = notesVal;
            
            // as long as the flashcards doesn't equal to the filler value (as seen in line 130)
            // add the values from the list to the flashcard inputs
            if (flashcardsList.toString() != "filler_value_for_this_code") {
                for (var i = 0; i < flashcardsList.length; i++) {
                    var flashcard = flashcardsList[i];
                    try {
                        termInputs.item(i+1).textContent = flashcard[0];
                        defInputs.item(i+1).textContent = flashcard[1];
                    } catch (e) {
                        // if there are not enough flashcards, make a new one
                        addMoreFlashcards();
                        termInputs.item(i+1).textContent = flashcard[0];
                        defInputs.item(i+1).textContent = flashcard[1];
                    }
                    
                }
            }

            
        }
    });