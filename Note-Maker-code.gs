function updateSpreadsheet(url, content, flashcards) {
  var parFdr = DriveApp.getRootFolder(); 
  var fdrName = "Note Maker";
  var spreadsheetName = "Note Maker Sheets";
  
  // try to get the folder by the name, but if it doesn't exist, create the folder in the root directory
  try {
    var newFdr = parFdr.getFoldersByName(fdrName).next();
  }
  catch(e) {
    var newFdr = parFdr.createFolder(fdrName);
  }
  
  //if the spreadsheet does not exist in the file, create it by calling function createSpreadsheet() and store returned spreadsheet in sheet variable
  //if exists, get the spreadsheet and save it in variable sheet
  var sheet;
  if (!newFdr.getFilesByName(spreadsheetName).hasNext()) {
    sheet = createSpreadsheet(spreadsheetName, newFdr);
  } else {
    var temp = newFdr.getFilesByName(spreadsheetName).next().getId(); 
    sheet = SpreadsheetApp.openById(temp);
  }

  sheet = sheet.getSheetByName("Sheet1");

  var startRow = 1;
  var startCol = 1;
  var numRows = sheet.getLastRow();
  var numCol = sheet.getLastColumn();
  
  // if there are no values in the sheet, just append it onto the spreadsheet
  if (numRows === 0) {
    sheet.appendRow([url, content, JSON.stringify(flashcards)]);
    return null;
  }
  
  // sets data range from row 1 - last value in row with non-empty value and column 1 - last value in row with non empty-value
  // This saves time, as then the 1000 empty cells on each row does not need to be iterated and checked
  var dataRange = sheet.getRange(startRow, startCol, numRows, numCol);
  var data = dataRange.getValues();
  
  // iterates through the spreadsheet row by row in the data range
  for (n in data) {
    var curUrl = data[n][0].toString();
    var curContent = data[n][1].toString();
    var curFlashcards = JSON.parse(data[n][2]);
  
    // if the current URL is equal to the URL the user's site that was opened
    if (curUrl.toString().includes(url.trim())) {
      // if the request is requesting the program to return the values of the row
      if (content == null && flashcards == null) {
        return [curContent, curFlashcards];
      }
      
      // updates values in the range with the new values from the parameters
      data[n][1] = content;
      data[n][2] = JSON.stringify(flashcards);
      
      //  set the values of spreadsheet equal to the values the user wants to update with
      sheet.getRange(startRow, startCol, numRows, numCol).setValues(data);
      return null;
    }
  }
  
  // this would happen when the user tries to request the value to be returned that does not exist
  if (content == null && flashcards == null) 
    return null;
  
  // the request is trying to update values in the spreadsheet that does not exist; append the new url to the sheet with the content/flashcards
  sheet.appendRow([url, content, JSON.stringify(flashcards)]);
  return null;
}

function createSpreadsheet( name, parent ){
  //NOTE: google blocked the ability to make a spreadsheet into a specific folder
  //hence, a copy of a new spreadsheet needs to be made, and then placed into the specific folder, and then trash the original file

  // create the spreadsheet and get the id
  this.ssTmp = SpreadsheetApp.create( name );
  this.idTmp = this.ssTmp.getId();
  this.fileTmp = DriveApp.getFileById( this.idTmp );
  
  // if the parent exists
  if ( parent ) {
    // make copy of spreadsheet into the designated parent folder
    this.file = this.fileTmp.makeCopy( name, parent );
    // trash the original
    this.fileTmp.setTrashed(true);  
  } else {
    // make copy of spreadsheet but make the copy into the root folder 
    this.file = this.fileTmp.makeCopy( name, folderReports );
    // set the original copy to trash
    this.fileTmp.setTrashed(true);
  }
  this.id = this.file.getId();
  this.ss = SpreadsheetApp.openById( this.id );
  
  // return the spreadsheet that was copied into the designated or root folder
  return ss;
}

