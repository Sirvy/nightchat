const express = require('express')
const mongo = require('mongodb')
const { WebSocketServer } = require('ws')
const {MongoClient} = require('mongodb');

async function main() {

    const uri = "mongodb://127.0.0.1:27017/newdb";

    const dbClient = new MongoClient(uri);
 
    try {
        await dbClient.connect();
        await startServer(dbClient);
    } catch (e) {
        console.error(e);
    } finally {
        // await dbClient.close();
    }
}

async function startServer(dbClient) {
    const webserver = express()
        .use((req, res) => res.sendFile('/websocket-client.html', { root: __dirname }))
        .listen(3000, () => console.log(`Listening on ${3000}`))

    const sockserver = new WebSocketServer({ port: 8080 })

    sockserver.on('connection', ws => {
        console.log('New client connected!')
        const boxes = dbClient.db().collection("box").find().forEach(box => {
            ws.send(JSON.stringify(box));
        });
        
        ws.on('close', () => console.log('Client has disconnected!'))
        ws.on('message', data => {
            sockserver.clients.forEach(client => {
                console.log(`distributing message: ${data}`)
                let pdata = JSON.parse(data.toString());
                dbClient.db().collection("box").updateMany({}, {$set: {x: pdata.x, y: pdata.y}});
                client.send(data.toString());
            })
        })
        ws.onerror = function () {
            console.log('websocket error')
        }
    });
};
 

main().catch(console.error);
