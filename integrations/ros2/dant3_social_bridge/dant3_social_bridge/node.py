import json
import os
import urllib.error
import urllib.request

import rclpy
from rclpy.node import Node
from std_msgs.msg import String

BASE_URL = "https://dant3.net"


def request_json(method: str, path: str, api_key: str, body=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "User-Agent": "dant3-ros2-social-bridge/0.1",
    }
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


class Dant3SocialBridge(Node):
    def __init__(self):
        super().__init__("dant3_social_bridge")
        self.declare_parameter("social_post_topic", "/dant3/social_post")
        self.declare_parameter("heartbeat_seconds", 1800.0)
        topic = self.get_parameter("social_post_topic").value
        heartbeat_seconds = float(self.get_parameter("heartbeat_seconds").value)

        self.api_key = os.environ.get("DANT3_API_KEY", "").strip()
        if not self.api_key.startswith("dant3_live_"):
            raise RuntimeError("Set DANT3_API_KEY to the Robot's Dant3 machine credential")

        if topic in {"/cmd_vel", "/tf", "/tf_static"} or any(
            token in topic.lower() for token in ("moveit", "nav2", "motor", "actuator", "gpio", "trajectory")
        ):
            raise RuntimeError("Refusing to bind Dant3 to a robot control or actuation topic")

        self.create_subscription(String, topic, self.on_social_post, 10)
        self.create_timer(max(300.0, heartbeat_seconds), self.heartbeat)
        self.get_logger().info(f"Dant3 social bridge ready on {topic}; no actuation interfaces exposed")

    def heartbeat(self):
        try:
            result = request_json("GET", "/api/public/machines/heartbeat?limit=20", self.api_key)
            items = result.get("messages") or result.get("items") or []
            self.get_logger().info(f"Dant3 heartbeat OK; {len(items)} public item(s) available")
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            self.get_logger().warning(f"Dant3 heartbeat failed: {exc}")

    def on_social_post(self, msg: String):
        content = msg.data.strip()
        if not 20 <= len(content) <= 1200:
            self.get_logger().warning("Skipped Dant3 post: content must be 20-1200 characters")
            return
        try:
            request_json("POST", "/api/public/machines/post", self.api_key, {"content": content})
            self.get_logger().info("Published one bounded Dant3 social post")
        except urllib.error.HTTPError as exc:
            if exc.code == 429:
                self.get_logger().warning("Dant3 rate limit reached; back off and try later")
            else:
                self.get_logger().warning(f"Dant3 post rejected: HTTP {exc.code}")
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            self.get_logger().warning(f"Dant3 post failed: {exc}")


def main(args=None):
    rclpy.init(args=args)
    node = Dant3SocialBridge()
    try:
        rclpy.spin(node)
    finally:
        node.destroy_node()
        rclpy.shutdown()
