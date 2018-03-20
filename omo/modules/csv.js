const request       = require('request-promise')
const util          = require('util')
const fs            = require('fs')
const { google }    = require('googleapis')
const sheets        = google.sheets('v4');
const { promisify } = require('util')

const SHEET_ID = '1fIDx8oM5p9DxeNSrjVuRU9m75jZBM53nVZfK3fqDZvU'
const CLIENT_KEY = require('/tmp/googleClientKey.json')
const API_KEY = require('/tmp/googleAPIKey.json').key
const DATA_FILE = '../gs_added_data.csv'
const TEST_FILE = '../gs_added_testcases.csv'

const deleteFile = promisify(fs.unlinkSync)
const appendFile = promisify(fs.appendFileSync)

const processData = (index, data) => {
  let file = (index === 0) ? DATA_FILE : TEST_FILE
  let numRows = data.sheets[index].data[0].rowData.length
  for (let row of data.sheets[index].data[0].rowData) {
    let rowLength = row.values.length
    for (let value of row.values) {
      appendFile(file, value.userEnteredValue.stringValue)
      if (--rowLength > 0) {
        appendFile(file, ',')
      }
    }
    if (--numRows > 0) {
      appendFile(file, '\n')
    }
  }
}

module.exports = async (omoContext) => {

  try {
    deleteFile(DATA_FILE)
    deleteFile(TEST_FILE)
  } catch (err) {

  }

  var jwtClient = new google.auth.JWT(
    CLIENT_KEY.client_email,
    null,
    CLIENT_KEY.private_key,
    ['https://www.googleapis.com/auth/drive'], // an array of auth scopes
    null
  )

  jwtClient.authorize(function (err, tokens) {
    if (err) {
      console.log(err)
      return Promise.resolve({status: 'error'})
    }

    sheets.spreadsheets.get({spreadsheetId: SHEET_ID,
                                        includeGridData: true,
                                        key: API_KEY}, function (err, response) {
      if (err) {
        return Promise.resolve({status: 'error'})
      } else {
        for (let i=0; i<2; i++) {
          processData(i, response.data)
        }

        return Promise.resolve()
      }
    })
  })
}
