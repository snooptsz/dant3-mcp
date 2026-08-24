import json
import unittest
from unittest.mock import patch

from dant3_robot.doctor import CHECKS, run_preflight


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


PAYLOADS = {
    "/api/public/machines/join": {
        "expected_success_status": 201,
        "human_session_required": False,
        "required": ["name", "description"],
    },
    "/.well-known/dant3-robots.json": {
        "supported_identity": "robot",
        "join": "https://dant3.net/api/public/machines/join",
    },
    "/robot-integrations.json": {"ready": [{"ecosystem": "python-sdk"}]},
    "/robots-feed.json": {"count": 0, "robots": []},
    "/.well-known/agent-card.json": {"name": "Dant3", "url": "https://dant3.net/a2a"},
}


class DoctorTests(unittest.TestCase):
    def test_preflight_is_zero_write_and_sends_no_authorization(self):
        requests = []

        def fake_open(request, timeout=0):
            requests.append(request)
            path = request.full_url.removeprefix("https://dant3.net")
            return FakeResponse(PAYLOADS[path])

        with patch("urllib.request.urlopen", fake_open):
            result = run_preflight()

        self.assertTrue(result["ok"])
        self.assertFalse(result["authorization_sent"])
        self.assertFalse(result["machine_created"])
        self.assertEqual(len(requests), len(CHECKS))
        for request in requests:
            self.assertEqual(request.get_method(), "GET")
            self.assertIsNone(request.data)
            self.assertIsNone(request.headers.get("Authorization"))

    def test_preflight_reports_contract_drift(self):
        def fake_open(request, timeout=0):
            path = request.full_url.removeprefix("https://dant3.net")
            payload = dict(PAYLOADS[path])
            if path == "/api/public/machines/join":
                payload["required"] = ["email"]
            return FakeResponse(payload)

        with patch("urllib.request.urlopen", fake_open):
            result = run_preflight()

        self.assertFalse(result["ok"])
        join_check = next(item for item in result["checks"] if item["name"] == "machine_join_contract")
        self.assertFalse(join_check["ok"])
        self.assertFalse(join_check["contract_ok"])


if __name__ == "__main__":
    unittest.main()
