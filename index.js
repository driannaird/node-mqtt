import mqtt from "mqtt";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.MQTT_URL || "mqtt://broker.emqx.io:1883";
const topic = process.env.MQTT_TOPIC || "drian/learn/#";
const clientId = process.env.MQTT_CLIENT_ID || `node-sub-${Math.random().toString(16).slice(2)}`;
const qos = Number(process.env.MQTT_QOS || 1);
const clean = process.env.MQTT_CLEAN === "false" ? false : true;

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
  const text = buf.toString();
  let obj; try { obj = JSON.parse(text); } catch { obj = null; }
  const ts = new Date().toISOString();
  console.log(`📥 ${ts} [${t}] (qos${pkt.qos})`);
  if (obj) console.dir(obj, { depth: null, colors: true });
  else console.log(text);
});

client.on("reconnect", () => console.log("… reconnecting"));
client.on("close",     () => console.log("🔌 connection closed"));
client.on("error",     (e) => console.error("❌", e.message));