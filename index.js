import mqtt from "mqtt";
import dotenv from "dotenv";
import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import http from "http";

dotenv.config();

const url = process.env.MQTT_URL || "mqtt://broker.emqx.io:1883";
const topic = process.env.MQTT_TOPIC || "drian/learn/#";
const clientId = process.env.MQTT_CLIENT_ID || `node-sub-${Math.random().toString(16).slice(2)}`;
const qos = Number(process.env.MQTT_QOS || 1);
const clean = process.env.MQTT_CLEAN === "false" ? false : true;

const app = express();
app.use(cors());
app.use(helmet());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
    socket.emit("occupancy:snapshot", Array.from(lastState, ([deviceId, v]) => ({ deviceId, ...v })));
})

const client = mqtt.connect(url, {
    clientId,
    keepalive: 60,
    reconnectPeriod: 2000,
    protocolVersion: 4,
})

client.on("connect", () => {
    console.log(`🟢 connected to ${url} as ${clientId} (clean:${clean})`);
    client.subscribe(topic, { qos }, (err, granted) => {
        if (err) return console.error("subscribe error:", err);
        console.log("subscribed:", granted.map(g => `${g.topic}@qos${g.qos}`).join(", "));
    })
})

client.on("message", (t, buf, pkt) => {
  const data = JSON.parse(buf.toString());
  
  console.log(data);
  io.emit("data:real", data)
});

client.on("reconnect", () => console.log("… reconnecting"));
client.on("close",     () => console.log("🔌 connection closed"));
client.on("error",     (e) => console.error("❌", e.message));