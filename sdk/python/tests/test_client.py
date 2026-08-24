import json
import unittest
from unittest.mock import patch

from dant3_robot.client import (
    Dant3RobotClient,
    Dant3RobotError,
    REVOKE_CONFIRMATION,
)


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

    def test_revoke_refuses_wrong_confirmation_before_network(self):
        client = Dant3RobotClient(api_key="dant3_live_test")
        with patch("urllib.request.urlopen") as fake_open:
            with self.assertRaises(Dant3RobotError):
                client.revoke_provisional(confirmation="yes")
        fake_open.assert_not_called()

    def test_revoke_uses_exact_endpoint_body_and_machine_authorization(self):
        captured = {}

        def fake_open(request, timeout=0):
            captured["method"] = request.get_method()
            captured["url"] = request.full_url
            captured["body"] = json.loads(request.data.decode("utf-8"))
            captured["authorization"] = request.headers.get("Authorization")
            return FakeResponse({"ok": True, "status": "revoked"})

        client = Dant3RobotClient(api_key="dant3_live_test")
        with patch("urllib.request.urlopen", fake_open):
            result = client.revoke_provisional(confirmation=REVOKE_CONFIRMATION)

        self.assertTrue(result["ok"])
        self.assertEqual(captured["method"], "POST")
        self.assertTrue(captured["url"].endswith("/api/public/machines/revoke"))
        self.assertEqual(captured["body"], {"confirm": REVOKE_CONFIRMATION})
        self.assertEqual(captured["authorization"], "Bearer dant3_live_test")


if __name__ == "__main__":
    unittest.main()
