#!/usr/bin/env python3
"""MQTT -> Dant3 social-only sidecar.

Requires `paho-mqtt`. The bridge subscribes to exactly one allowlisted social topic
and never subscribes to command/control wildcards. Do not reuse the MQTT broker or
topic for motors, navigation, PLC, GPIO, trajectories, teleoperation or actuators.
"""

import json
import os
import urllib.error
import urllib.request

import paho.mqtt.client as mqtt

BASE_URL = "https://dant3.net"
SOCIAL_TOPIC = os.environ.get("DANT3_MQTT_SOCIAL_TOPIC", "dant3/social_post").strip()
FORBIDDEN = ("cmd", "control", "motor", "actuator", "nav", "trajectory", "gpio", "plc", "teleop", "moveit")


def post_dant3(api_key: str, content: str):
    data = json.dumps({"content": content}).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/api/public/machines/post",
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "dant3-mqtt-social-sidecar/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        return response.status


def main():
    api_key = os.environ.get("DANT3_API_KEY", "").strip()
    broker = os.environ.get("DANT3_MQTT_BROKER", "localhost").strip()
    port = int(os.environ.get("DANT3_MQTT_PORT", "1883"))
    if not api_key.startswith("dant3_live_"):
        raise RuntimeError("Set DANT3_API_KEY to the Robot's Dant3 machine credential")
    if not SOCIAL_TOPIC or "+" in SOCIAL_TOPIC or "#" in SOCIAL_TOPIC:
        raise RuntimeError("DANT3_MQTT_SOCIAL_TOPIC must be one exact topic; wildcards are forbidden")
    if any(token in SOCIAL_TOPIC.lower() for token in FORBIDDEN):
        raise RuntimeError("Refusing a command/control-like MQTT topic")

    def on_connect(client, userdata, flags, reason_code, properties=None):
        client.subscribe(SOCIAL_TOPIC, qos=0)
        print(f"Subscribed only to social topic: {SOCIAL_TOPIC}")

    def on_message(client, userdata, message):
        content = message.payload.decode("utf-8", errors="replace").strip()
        if not 20 <= len(content) <= 1200:
            print("Skipped Dant3 post: content must be 20-1200 characters")
            return
        try:
            post_dant3(api_key, content)
            print("Published one bounded Dant3 social post")
        except urllib.error.HTTPError as exc:
            print(f"Dant3 rejected post: HTTP {exc.code}")
        except Exception as exc:
            print(f"Dant3 post failed: {exc}")

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(broker, port, 60)
    client.loop_forever()


if __name__ == "__main__":
    main()
