console.log('Server-side code running');

const express = require('express');
const cors = require('cors');
var bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// start the express web server listening on 8080
app.listen(8081, () => {
  console.log('listening on 8081');
});

// serve the homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// -----------------------------------------------------------------------------
var requestify = require('requestify');
const url ="https://s3-us-west-2.amazonaws.com/css490/input.txt";
var newData = [];
var results = [];

const get = () => {
  requestify.get(url).then(function(response) {       //get response to create or rewrite a file
    // Get the response body
    response.getBody();
    // Get the response raw body
    response.body;
    var data = response.body.split("\n");             //split by each new line character
    objectData(data);
    fs.writeFile('mynewfile.txt', response.body, function (err) {
      if (err) throw err;
      console.log('Saved!');
    });
  });
  uploadToS3();
  tableCreate();
  setTimeout(function(){ uploadData(); }, 7000);
};

// -----------------------------------------------------------------------------
const fs = require('fs');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const BUCKET_NAME = '436-class';
const fileName = 'mynewfile.txt';

const uploadToS3 = () => {
  fs.readFile(fileName, (err, data) => {
     if (err) throw err;
     const params = {
         Bucket: BUCKET_NAME, // pass your bucket name
         Key: 'mynewfile.txt', // file will be saved as testBucket/contacts.csv
         Body: fs.createReadStream('mynewfile.txt')
     };
     s3.upload(params, function(s3Err, data) {
         if (s3Err) throw s3Err
         console.log(`File uploaded successfully at ${data.Location}`)
     });
  });
};

const deleteFromS3 = () => {
  fs.readFile(fileName, (err, data) => {
     if (err) throw err;
     const params = {
         Bucket: BUCKET_NAME,
         Key: 'mynewfile.txt',
     };
     s3.deleteObject(params, function(s3Err, data) {
         if (s3Err) throw s3Err
         console.log("File Deleted")
     });
  });
};

app.post('/load', (req, res) => {
    get();
    res.sendStatus(201);
});

app.post('/clear', (req, res) => {
    deleteFromS3();
    tableDelete();
    res.sendStatus(201);
});

app.post('/query', (req, res) => {
    setParams(req.body.first,req.body.last)
});

app.get('/test',(req,res)=>{
    //res.sendFile(__dirname +"/views/test.html",);
    res.json({title:"api",message:results});
})

app.get('/render',(req,res)=>{
    res.sendFile(__dirname +"/views/test.html");
})



// -----------------------------------------------------------------------------
 function objectData(data) {
   for (var i = 0; i < data.length; i++) {       //loop through each line
     if(data[i].length < 1)                      //skip empty lines
       continue;
     var line = data[i].split(" ");              //split each line by every space
     var newArr = {};
     for (var j = 0; j < line.length; j++) {     //loop through the line array
       if(line[j].length < 1 || line[j] == " ")  //skips empty array indicies
         continue
       if(j == 0){
         newArr["last"] = line[j];
       } else if(j == 1){
         newArr["first"] = line[j];
       } else {
         var words = line[j].split("=");
         newArr[words[0]]=words[1];
       }
     }
     newData.push(newArr);
   }
   return;
 };

 // -----------------------------------------------------------------------------
 AWS.config.update({region: 'us-west-1'});
 var dynamodb = new AWS.DynamoDB();
 var ddb = new AWS.DynamoDB.DocumentClient();


const tableCreate = () => {
  var params = {
     TableName : "prog4",
     KeySchema: [
         { AttributeName: "last", KeyType: "HASH"},    //Partition key
         { AttributeName: "first", KeyType: "RANGE" }
     ],
     AttributeDefinitions: [
         { AttributeName: "last", AttributeType: "S" },
         { AttributeName: "first", AttributeType: "S" }
     ],
     ProvisionedThroughput: {
         ReadCapacityUnits: 10,
         WriteCapacityUnits: 10
     }
  };

  dynamodb.createTable(params, function(err, data) {
      if (err) {
          console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
          uploadData();
      }
      if(!err) {
          console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
          uploadData();
      }
  });
}


const tableDelete = () => {
  var params = {
    TableName : "prog4"
  };

  dynamodb.deleteTable(params, function(err, data) {
    if (err) {
        console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Deleted table. Table description JSON:", JSON.stringify(data, null, 2));
    }
  });
}

const uploadData = () => {
  for (var i = 0; i < newData.length; i++) {
    var input = newData[i];
    console.log(input);

    var params = {
      TableName : "prog4",
      Item : input
    };

    ddb.put(params, function(err, data) {
      if (err) {
           console.log("error - " + JSON.stringify(err, null, 2));
       } else {
           console.log("success" );
       }
    });
  }
}

const queryData = (params) => {
        ddb.scan(params, function(err, data) {
        if (err) {
            // console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            results = [];
        } else {
            // console.log("Query succeeded.");
            results = data.Items;
            // console.log(results.Items);
        }
      })
}

const setParams = (first,last) => {
  console.log(first);
  console.log(last);
  if(first == ""){
    var params = {
          TableName: "prog4",
          FilterExpression: "#last = :last",
          ExpressionAttributeNames:{
              "#last": "last"
              },
          ExpressionAttributeValues: {
              ":last":last
              }
          };
  } else if(last == ""){
    var params = {
          TableName: "prog4",
          FilterExpression: "#first = :firstValue",
          ExpressionAttributeNames:{
              "#first":"first"
              },
          ExpressionAttributeValues: {
              ":firstValue": first
              }
          };
  } else {
    var params = {
        TableName : "prog4",
        FilterExpression:"#last = :lastValue and #first = :firstValue",
        ExpressionAttributeNames: {
            "#last":"last",
            "#first":"first"
            },
        ExpressionAttributeValues: {
            ":lastValue": last,
            ":firstValue": first
            }
    };
  }
  queryData(params);
}
