var request = require('request');
var cheerio = require('cheerio');
const MongoClient = require('mongodb').MongoClient;

url = 'https://medium.com';

var url_stack = new Set();

var db;


const getQueryStringParameters = url => {
    var params=[];
    if(url.includes('?')){
    query = url.split("?")[1].split('&');
    
    for(var i=0;i<query.length;i++){
        params.push(query[i].split("=")[0]);
    }
    return params;
}


};

MongoClient.connect('mongodb://localhost:27017/URLApp',function(err,client){
    if(err)
        {
            return console.log("Unable to connect to MongoDB server");
        }
    console.log("Connected to MongoDB server");
    db = client.db('URLApp');
        
});

function addValueInDB(values,params){
    db.collection('URL_details').insertOne({
        url: values,
        reference_count:1,
        query_params:params
    },function(err,result){
        if(err){
            return console.log("Unable to insert todo", err);
        }

        console.log(JSON.stringify(result.ops, undefined,2));

    });
}



function addUrlinDB(values) 
{ 
    var params = getQueryStringParameters(values);
    db.collection('URL_details').find(
        {
            url:values
        }).toArray().then(function(docs){
            if(docs.length<1){
                addValueInDB(values,params);
            }else{
                console.log(docs);
            }
        },function(err){
            console.log("Unable to fetch urls",err);
        });
}

    request(url, function(error, response, html){

        if(!error){
            var $ = cheerio.load(html)
            $('a').filter(function(){
                var data = $(this).attr('href');
                if(data.toString().includes('https://medium.com')){
                    url_stack.add(data.toString());
                }
            })
            
            url_stack.forEach(addUrlinDB); 
        

    }
});



