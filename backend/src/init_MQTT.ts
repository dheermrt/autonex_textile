import mqttLib from "mqtt";
import { log } from "console";
import { input as revolution_counter_1_mqtt_input } from "./systems/revolution_counter_1/topics/input";
import { ENV } from "./utils/loadEnv";

export function init_MQTT() {
	if (!ENV.SERVER_TYPES.includes("normal")) return;

	const mqtt =
		ENV.MODE === "production"
			? mqttLib.connect(ENV.MQTT_BROKER_URL, {
					username: ENV.MQTT_USERNAME,
					password: ENV.MQTT_PASSWORD,
					clientId: ENV.MQTT_CLIENT_ID,
					clean: true, // Clean session for production - avoid old queued messages
					keepalive: 60, // Send ping every 60s to keep connection alive
					reconnectPeriod: 5000, // Retry connection every 5s
					connectTimeout: 30000, // 30s timeout for initial connection
			  })
			: mqttLib.connect("mqtt://localhost:1883", {
					clientId: `backend_dev_${Date.now()}`,
					clean: true, // Clean session - no persistent state
					keepalive: 60,
					reconnectPeriod: 5000,
					connectTimeout: 30000,
			  });
	mqtt.on("connect", () => {
		log("✓ Connected to MQTT broker");
		mqtt.subscribe("revolution_counter_1/+/+", { qos: 1 }, (err) => {
			if (err) console.error("✗ MQTT subscription failed:", err);
			else log("✓ Subscribed to revolution_counter_1/+/+");
		});
		run_mqtts(mqtt);
	});

	mqtt.on("error", (error) => console.error("✗ MQTT error:", error.message));
	mqtt.on("close", () => console.log("⚠ MQTT connection closed"));
	mqtt.on("reconnect", () => console.log("⟳ MQTT reconnecting..."));
	mqtt.on("offline", () => console.log("⚠ MQTT client offline"));
}

function run_mqtts(mqtt: mqttLib.MqttClient) {
	mqtt.on("message", (topic, message: Buffer | string) => {
		message = message.toString();
		// console.log({ topic, message });

		const [system, userId, entityId] = topic.split("/");
		if (!system) {
			console.error("Invalid topic, skipping input handling", topic.split("/"));
			return;
		}
		switch (system) {
			case "revolution_counter_1": {
				revolution_counter_1_mqtt_input(userId, entityId, message);
				break;
			}
			default:
				console.error("Unknown system, skipping input handling", system);
				return;
		}
	});
}
