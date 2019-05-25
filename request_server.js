var request = require('./await-request');
var cheerio = require('cheerio');

var db;
var mongo_client;
var first = 0;

url = 'https://medium.com';

var url_stack = new Set();

async function connectMongo(){

    const MongoClient = require('mongodb').MongoClient;
    var client = await MongoClient.connect('mongodb://localhost:27017/URLApp');
    db = client.db('URLApp');
    mongo_client = client;
    return db;
}

function closeMongo(){
    mongo_client.close();
}

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



async function addValueInDB(values,params){
    var result = await db.collection('URL_details').insertOne({
        url: values,
        reference_count:1,
        query_params:params,
        visited:false
    });
    //console.log(JSON.stringify(result.ops, undefined,2));
}

async function updateValueInDB(values,params){

    if(params){
        update = {
                $inc: {reference_count:1}, 
                $addToSet: {query_params: {$each: params}}
          }
    }else{
        update = {
            $inc: {reference_count:1}
        }
    }
        var result = await db.collection('URL_details').findOneAndUpdate(
            {url:values},
            update,
            {
                returnOriginal:false
            }
            );
        //console.log(result);
    
}

async function addUrlinDB(values) 
{ 
    //console.log(values);
    var params = getQueryStringParameters(values);
    var result = await db.collection('URL_details').find(
        {
            url:values
        }).toArray();
        if(result.length<1){
            await addValueInDB(values,params);
        }else{
            await updateValueInDB(values,params);
        }
}

async function fire_url(url){
    console.log(url);
    var html = await request(url);
    var $ = cheerio.load(html)
            $('a').filter(function(){
                var data = $(this).attr('href');
                if(data.toString().includes('https://medium.com')){
                    url_stack.add(data.toString());
                }
            })
            await url_stack.forEach(addUrlinDB);
    
}

async function init(){
    
    while(1){
        var db = await connectMongo();
        var result = await db.collection('URL_details').findOne({visited:false});
        
        console.log(result);
        if(!result){
            if(first !=0){
                console.log("No new url left");
                return;
            }else{
                 first = 1;
                await fire_url(url);
            }
            }else{
                update = {
                    $set: {visited:true}, 
                    
              }
                await db.collection('URL_details').findOneAndUpdate({url:result.url},update);
                await fire_url(result.url);
            }
    }
    closeMongo();
}

init();