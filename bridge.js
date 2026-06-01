import fs from "fs";
let config = JSON.parse(fs.readFileSync("./config.json",{encoding:"utf-8"}));
const agent = "pineapple_bridge";

let userDetails = await (await fetch("https://aihorde.net/api/v2/find_user",{
    headers:{
        "Content-Type": "application/json",
        "apikey":config.horde_key,
        "Client-Agent":agent
    }
})).json();
console.log(userDetails);
let slots = 4;
let available = true;
let pollInterval = 2000;

function boostRate(){
    pollInterval = 500;
    setTimeout(()=>{
        pollInterval=2000;
    },5000)
}

async function loop(){
    console.log(slots);
    if(slots > 0){
        (async ()=>{
            slots-=1;

            let polled =await popRequest() 
            console.log(polled.id);
            
            if(polled.payload &&polled.id){
                let generated = await completionsRequest(polled.payload);
                console.log("generated:",generated);
                console.log(await submitRequest(polled.id,generated.length));
                boostRate();
            }
            slots++;
        })();
    }

    setTimeout(loop,pollInterval);
}

loop()



async function completionsRequest(payload){
    let body = payload;
    let headers = {
        "Content-Type": "application/json",
    };
    let response = await fetch(config.kai_url+"v1/completions", {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });
    let json = await response.json();
    
    let text = json.choices[0].text;
    return text;
}

async function popRequest(){
 let body = {
  "name": config.worker_name,
  "priority_usernames": [],
  "nsfw": true,
  "models": [
    config.model_name
  ],
  "bridge_agent": agent,
  "threads": 4,
  "require_upfront_kudos": false,
  "amount": 1,
  "extra_slow_worker": false,
  "max_length": config.max_seq_len,
  "max_context_length": config.max_seq_len,
  "softprompts": []
}
let response = await fetch("https://aihorde.net/api/v2/generate/text/pop",{
    method: "POST",
    headers:{
        "Content-Type": "application/json",
        "apikey":config.horde_key,
        "Client-Agent":agent
    },
    body: JSON.stringify(body)});
    return await response.json();
}
async function submitRequest(id,message){

    let meta = [];


    if(message.toLowerCase().includes("csam") || message.toLowerCase().includes("of minors")){
        meta.push({type:"censorship", value:"csam"})
        message = "Please don't do that.";
        console.log("filter hit :( why are people like this");
    }


    let body = {
        id:id,
        generation:message,
        state:"ok",
        gen_metadata:meta,
}
let response = await fetch("https://aihorde.net/api/v2/generate/text/submit",{
    method: "POST",
    headers:{
        "Content-Type": "application/json",
        "apikey":config.horde_key,
        "Client-Agent":agent
    },
    body: JSON.stringify(body)});
    return await response.json();
}