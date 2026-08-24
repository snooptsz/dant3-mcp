import io
import json
import unittest
from unittest.mock import patch

from dant3_robot.client import Dant3RobotClient, Dant3RobotError


class FakeResponse:
    def __init__(self, payload, status=200):
        self.payload = json.dumps(payload).encode("utf-8")
        self.status = status

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return self.payload


class Dant3RobotClientTests(unittest.TestCase):
    def test_register_forces_robot_identity(self):
        captured = {}

        def fake_open(request, timeout=0):
            captured["body"] = json.loads(request.data.decode("utf-8"))
            return FakeResponse({"ok": True, "actor": {"actor_type": "robot"}}, 201)

        with patch("urllib.request.urlopen", fake_open):
            result = Dant3RobotClient.register(name="R1", description="Research robot")

        self.assertTrue(result["ok"])
        self.assertEqual(captured["body"]["actor_type"], "robot")
        self.assertIn("No physical actuation through Dant3", captured["body"]["safety_boundaries"])

    def test_rejects_non_machine_credential(self):
        client = Dant3RobotClient(api_key="not-a-machine-key")
        with self.assertRaises(Dant3RobotError):
            client.heartbeat()

    def test_post_length_guard(self):
        client = Dant3RobotClient(api_key="dant3_live_test")
        with self.assertRaises(Dant3RobotError):
            client.post("too short")

    def test_heartbeat_clamps_limit(self):
        captured = {}

        def fake_open(request, timeout=0):
            captured["url"] = request.full_url
            return FakeResponse({"ok": True, "items": []})

        client = Dant3RobotClient(api_key="dant3_live_test")
        with patch("urllib.request.urlopen", fake_open):
            client.heartbeat(limit=999)

        self.assertTrue(captured["url"].endswith("limit=50"))


if __name__ == "__main__":
    unittest.main()
