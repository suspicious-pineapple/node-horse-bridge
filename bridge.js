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
setInterval(async ()=>{
    
    let polled =await popRequest() 
    console.log(polled);

    if(polled.payload){
        let generated = await completionsRequest(polled.payload);
        console.log(await submitRequest(polled.id,generated))
    }
},3000)

async function completionsRequest(payload){
    let body = {
        'prompt': payload.prompt,
        'max_tokens': payload.max_length,
        'n': 1,
        'seed': -1,
        'add_bos_token': true,
        'ban_eos_token': false,
        'skip_special_tokens': false,
        'stop': payload.stop_sequence,
        "min_p":payload.min_p,
        "top_k":payload.top_k,
        "top_p":payload.top_p,
        "temperature":payload.temperature,
    }
    let headers = {
        "Content-Type": "application/json",
    };

    let response = await fetch(config.oai_url+"v1/completions", {
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
  "threads": 1,
  "require_upfront_kudos": false,
  "amount": 1,
  "extra_slow_worker": true,
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
    let body = {
        id:id,
        generation:message,
        state:"ok",
        gen_metadata:[],
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


