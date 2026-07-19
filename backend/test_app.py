"""
Automated test suite for the StadiumIQ Flask backend.

Covers every endpoint in app.py with:
  - happy-path behaviour
  - input validation and boundary values
  - authentication / session / protected-route enforcement
  - security probes (SQL injection, XSS, oversized payloads, malformed JSON)
  - external-service failure handling (Groq, TheSportsDB) via mocking

Run with:
    python -m pytest test_app.py -v
"""

import json
import os
from types import SimpleNamespace

import pytest
from werkzeug.security import generate_password_hash

# ---------------------------------------------------------------------------
# Environment must be configured BEFORE importing the app module, since
# app.py reads STAFF_PASSWORD_HASH / SECRET_KEY / FLASK_ENV at import time.
# ---------------------------------------------------------------------------
os.environ.setdefault("FLASK_ENV", "testing")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("STAFF_USERNAME", "admin")
os.environ.setdefault("STAFF_PASSWORD_HASH", generate_password_hash("TestPass123!"))
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")

import app as app_module  # noqa: E402  (import after env setup is intentional)

VALID_USERNAME = "admin"
VALID_PASSWORD = "TestPass123!"


# ---------------------------------------------------------------------------
# Fakes / fixtures
# ---------------------------------------------------------------------------

class FakeGroqClient:
    """Stand-in for the Groq client so tests never hit the real API."""

    def __init__(self, content="Mocked AI response for testing purposes."):
        self._content = content
        self.last_call_kwargs = None
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    def _create(self, **kwargs):
        self.last_call_kwargs = kwargs
        message = SimpleNamespace(content=self._content)
        choice = SimpleNamespace(message=message)
        return SimpleNamespace(choices=[choice])


class FakeSportsDBResponse:
    """Stand-in for requests.get(...) responses from TheSportsDB."""

    def __init__(self, payload):
        self._payload = payload

    def json(self):
        return self._payload


@pytest.fixture
def raw_client():
    """Test client with no headers injected — for testing the CSRF gate itself."""
    app_module.app.config.update(TESTING=True)
    with app_module.app.test_client() as test_client:
        yield test_client


@pytest.fixture
def client(raw_client):
    """Default test client. Auto-attaches the CSRF header the app now requires
    on every state-changing request, so existing tests don't need to set it
    individually — only TestCsrfProtection exercises the header being absent.
    """
    raw_client.environ_base["HTTP_X_REQUESTED_WITH"] = "XMLHttpRequest"
    return raw_client


@pytest.fixture
def fake_groq(monkeypatch):
    """Patch get_groq_client() so /chat, /briefing, /crowd-advice never call the real API."""
    fake_client = FakeGroqClient()
    monkeypatch.setattr(app_module, "get_groq_client", lambda: fake_client)
    return fake_client


@pytest.fixture
def fake_schedule_ok(monkeypatch):
    """Patch requests.get so /api/schedule returns deterministic fixture data."""
    upcoming_event = {
        "idEvent": "1001",
        "strHomeTeam": "Brazil",
        "strAwayTeam": "Argentina",
        "intHomeScore": None,
        "intAwayScore": None,
        "dateEvent": "2026-07-01",
        "strTime": "18:00:00",
        "strVenue": "MetLife Stadium",
        "intRound": "1",
    }
    past_event = {
        "idEvent": "1000",
        "strHomeTeam": "Germany",
        "strAwayTeam": "Spain",
        "intHomeScore": "2",
        "intAwayScore": "1",
        "dateEvent": "2026-06-20",
        "strTime": "15:00:00",
        "strVenue": "AT&T Stadium",
        "intRound": "1",
    }

    def fake_get(url, params=None, timeout=None):
        if "eventsnextleague" in url:
            return FakeSportsDBResponse({"events": [upcoming_event]})
        return FakeSportsDBResponse({"events": [past_event]})

    monkeypatch.setattr(app_module._sportsdb_session, "get", fake_get)


@pytest.fixture
def fake_schedule_down(monkeypatch):
    """Patch the pooled session so /api/schedule simulates an unreachable data source."""

    def fake_get(*args, **kwargs):
        raise app_module.requests.RequestException("connection failed")

    monkeypatch.setattr(app_module._sportsdb_session, "get", fake_get)


def login(client):
    return client.post(
        "/api/login",
        json={"username": VALID_USERNAME, "password": VALID_PASSWORD},
    )


# ---------------------------------------------------------------------------
# Health & venues
# ---------------------------------------------------------------------------

class TestHealth:
    def test_health_returns_200(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200

    def test_health_payload_shape(self, client):
        resp = client.get("/api/health")
        data = resp.get_json()
        assert data["status"] == "running"
        assert "message" in data

    def test_health_rejects_post(self, client):
        resp = client.post("/api/health")
        assert resp.status_code == 405


class TestVenues:
    def test_venues_returns_200(self, client):
        resp = client.get("/api/venues")
        assert resp.status_code == 200

    def test_venues_payload_is_list(self, client):
        resp = client.get("/api/venues")
        data = resp.get_json()
        assert isinstance(data["venues"], list)
        assert len(data["venues"]) > 0

    def test_venues_items_have_expected_keys(self, client):
        resp = client.get("/api/venues")
        venue = resp.get_json()["venues"][0]
        assert "name" in venue and "city" in venue


# ---------------------------------------------------------------------------
# Security headers (applied to every response)
# ---------------------------------------------------------------------------

class TestSecurityHeaders:
    def test_content_type_options_header(self, client):
        resp = client.get("/api/health")
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"

    def test_frame_options_header(self, client):
        resp = client.get("/api/health")
        assert resp.headers.get("X-Frame-Options") == "DENY"

    def test_xss_protection_header(self, client):
        resp = client.get("/api/health")
        assert resp.headers.get("X-XSS-Protection") == "1; mode=block"

    def test_referrer_policy_header(self, client):
        resp = client.get("/api/health")
        assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

    def test_content_security_policy_header(self, client):
        resp = client.get("/api/health")
        assert resp.headers.get("Content-Security-Policy") == "default-src 'self'"

    def test_permissions_policy_header(self, client):
        resp = client.get("/api/health")
        assert "geolocation=()" in resp.headers.get("Permissions-Policy", "")

    def test_hsts_absent_outside_production(self, client):
        # FLASK_ENV=testing in this suite, so HSTS should not be set.
        resp = client.get("/api/health")
        assert "Strict-Transport-Security" not in resp.headers


# ---------------------------------------------------------------------------
# CSRF header gate (required on every state-changing request)
# ---------------------------------------------------------------------------

class TestCsrfProtection:
    def test_post_without_csrf_header_rejected(self, raw_client):
        resp = raw_client.post("/api/login", json={"username": "x", "password": "y"})
        assert resp.status_code == 403

    def test_post_with_wrong_csrf_header_rejected(self, raw_client):
        resp = raw_client.post(
            "/api/login",
            json={"username": "x", "password": "y"},
            headers={"X-Requested-With": "something-else"},
        )
        assert resp.status_code == 403

    def test_post_with_csrf_header_passes_gate(self, raw_client):
        # Wrong credentials, but the CSRF gate itself should let it through to auth logic (401, not 403).
        resp = raw_client.post(
            "/api/login",
            json={"username": "x", "password": "y"},
            headers={"X-Requested-With": "XMLHttpRequest"},
        )
        assert resp.status_code != 403

    def test_get_requests_do_not_require_csrf_header(self, raw_client):
        resp = raw_client.get("/api/health")
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Authentication: login / logout / session
# ---------------------------------------------------------------------------

class TestLogin:
    def test_login_missing_username(self, client):
        resp = client.post("/api/login", json={"password": VALID_PASSWORD})
        assert resp.status_code == 400

    def test_login_missing_password(self, client):
        resp = client.post("/api/login", json={"username": VALID_USERNAME})
        assert resp.status_code == 400

    def test_login_empty_body(self, client):
        resp = client.post("/api/login", json={})
        assert resp.status_code == 400

    def test_login_wrong_password(self, client):
        resp = client.post(
            "/api/login", json={"username": VALID_USERNAME, "password": "wrongpass"}
        )
        assert resp.status_code == 401

    def test_login_unknown_username(self, client):
        resp = client.post(
            "/api/login", json={"username": "not_a_real_user", "password": VALID_PASSWORD}
        )
        assert resp.status_code == 401

    def test_login_correct_credentials_succeeds(self, client):
        resp = login(client)
        assert resp.status_code == 200
        assert resp.get_json()["success"] is True

    def test_login_response_includes_username(self, client):
        resp = login(client)
        assert resp.get_json()["username"] == VALID_USERNAME

    def test_login_does_not_leak_password_hash(self, client):
        resp = login(client)
        body = resp.get_data(as_text=True)
        assert "TestPass123" not in body
        assert app_module.STAFF_PASSWORD_HASH not in body

    def test_login_username_whitespace_is_stripped(self, client):
        resp = client.post(
            "/api/login",
            json={"username": f"  {VALID_USERNAME}  ", "password": VALID_PASSWORD},
        )
        assert resp.status_code == 200

    # --- Security probes ---

    def test_login_sql_injection_username(self, client):
        resp = client.post(
            "/api/login",
            json={"username": "admin' OR '1'='1", "password": "irrelevant"},
        )
        assert resp.status_code == 401

    def test_login_sql_injection_password(self, client):
        resp = client.post(
            "/api/login",
            json={"username": VALID_USERNAME, "password": "' OR '1'='1' --"},
        )
        assert resp.status_code == 401

    def test_login_sql_injection_drop_table(self, client):
        resp = client.post(
            "/api/login",
            json={"username": "admin'; DROP TABLE users; --", "password": "x"},
        )
        assert resp.status_code == 401
        # The server should still be alive and answering afterwards.
        assert client.get("/api/health").status_code == 200

    def test_login_xss_in_username(self, client):
        resp = client.post(
            "/api/login",
            json={"username": "<script>alert(1)</script>", "password": "x"},
        )
        assert resp.status_code == 401

    def test_login_rejects_malformed_json(self, client):
        resp = client.post(
            "/api/login",
            data="{not valid json",
            content_type="application/json",
        )
        assert resp.status_code == 400

    def test_login_rejects_non_json_content_type(self, client):
        resp = client.post(
            "/api/login",
            data="username=admin&password=x",
            content_type="application/x-www-form-urlencoded",
        )
        assert resp.status_code == 415

    def test_login_handles_oversized_password(self, client):
        huge_password = "a" * 100_000
        resp = client.post(
            "/api/login", json={"username": VALID_USERNAME, "password": huge_password}
        )
        assert resp.status_code == 401  # rejected, not a 500 crash

    def test_login_handles_non_string_fields(self, client):
        resp = client.post("/api/login", json={"username": 12345, "password": ["a", "b"]})
        assert resp.status_code in (400, 401)


class TestLogout:
    def test_logout_clears_session(self, client):
        login(client)
        resp = client.post("/api/logout")
        assert resp.status_code == 200
        assert resp.get_json()["success"] is True
        session_resp = client.get("/api/session")
        assert session_resp.get_json()["authenticated"] is False

    def test_logout_without_prior_login_is_safe(self, client):
        resp = client.post("/api/logout")
        assert resp.status_code == 200


class TestSession:
    def test_session_unauthenticated_by_default(self, client):
        resp = client.get("/api/session")
        data = resp.get_json()
        assert data["authenticated"] is False
        assert data["username"] is None

    def test_session_authenticated_after_login(self, client):
        login(client)
        resp = client.get("/api/session")
        data = resp.get_json()
        assert data["authenticated"] is True
        assert data["username"] == VALID_USERNAME


# ---------------------------------------------------------------------------
# Protected-route enforcement
# ---------------------------------------------------------------------------

class TestProtectedRoutes:
    def test_briefing_rejects_unauthenticated(self, client):
        resp = client.post(
            "/api/briefing",
            json={"role": "Steward", "venue": "MetLife Stadium", "shift": "Morning"},
        )
        assert resp.status_code == 401

    def test_crowd_advice_rejects_unauthenticated(self, client):
        resp = client.post(
            "/api/crowd-advice",
            json={"venue": "MetLife Stadium", "zone": "Gate A", "crowd_level": 5},
        )
        assert resp.status_code == 401

    def test_briefing_rejects_after_logout(self, client, fake_groq):
        login(client)
        client.post("/api/logout")
        resp = client.post(
            "/api/briefing",
            json={"role": "Steward", "venue": "MetLife Stadium", "shift": "Morning"},
        )
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Chat (fan assistant)
# ---------------------------------------------------------------------------

class TestChat:
    def test_chat_happy_path(self, client, fake_groq):
        resp = client.post("/api/chat", json={"message": "Where is Gate A?", "language": "en"})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["language"] == "en"
        assert "response" in data

    def test_chat_missing_message(self, client, fake_groq):
        resp = client.post("/api/chat", json={"language": "en"})
        assert resp.status_code == 400

    def test_chat_empty_message(self, client, fake_groq):
        resp = client.post("/api/chat", json={"message": "   ", "language": "en"})
        assert resp.status_code == 400

    def test_chat_message_at_max_length_allowed(self, client, fake_groq):
        msg = "a" * app_module.MAX_MESSAGE_LEN
        resp = client.post("/api/chat", json={"message": msg, "language": "en"})
        assert resp.status_code == 200

    def test_chat_message_over_max_length_rejected(self, client, fake_groq):
        msg = "a" * (app_module.MAX_MESSAGE_LEN + 1)
        resp = client.post("/api/chat", json={"message": msg, "language": "en"})
        assert resp.status_code == 400

    def test_chat_unsupported_language(self, client, fake_groq):
        resp = client.post("/api/chat", json={"message": "hi", "language": "de"})
        assert resp.status_code == 400

    def test_chat_defaults_to_english_when_language_omitted(self, client, fake_groq):
        resp = client.post("/api/chat", json={"message": "hi"})
        assert resp.status_code == 200
        assert resp.get_json()["language"] == "en"

    def test_chat_all_supported_languages_accepted(self, client, fake_groq):
        for lang in app_module.SUPPORTED_LANGUAGES:
            resp = client.post("/api/chat", json={"message": "hi", "language": lang})
            assert resp.status_code == 200

    def test_chat_venue_over_max_length_rejected(self, client, fake_groq):
        resp = client.post(
            "/api/chat",
            json={
                "message": "hi",
                "language": "en",
                "venue": "a" * (app_module.MAX_CONTEXT_LEN + 1),
            },
        )
        assert resp.status_code == 400

    def test_chat_history_is_truncated_to_last_six(self, client, fake_groq):
        history = [{"role": "user", "content": f"msg {i}"} for i in range(20)]
        resp = client.post(
            "/api/chat", json={"message": "hi", "language": "en", "history": history}
        )
        assert resp.status_code == 200
        # system prompt + 6 history turns + final user message = 8
        assert len(fake_groq.last_call_kwargs["messages"]) == 8

    def test_chat_malformed_history_entries_ignored(self, client, fake_groq):
        history = [None, "not-a-dict", {"role": "user"}, {"content": "no role"}]
        resp = client.post(
            "/api/chat", json={"message": "hi", "language": "en", "history": history}
        )
        assert resp.status_code == 200

    # --- Security probes ---

    def test_chat_xss_payload_does_not_crash(self, client, fake_groq):
        resp = client.post(
            "/api/chat",
            json={"message": "<script>alert('xss')</script>", "language": "en"},
        )
        assert resp.status_code == 200

    def test_chat_sql_injection_payload_does_not_crash(self, client, fake_groq):
        resp = client.post(
            "/api/chat",
            json={"message": "'; DROP TABLE fans; --", "language": "en"},
        )
        assert resp.status_code == 200

    def test_chat_rejects_malformed_json(self, client, fake_groq):
        resp = client.post(
            "/api/chat", data="{bad json", content_type="application/json"
        )
        assert resp.status_code == 400

    def test_chat_handles_null_body(self, client, fake_groq):
        resp = client.post("/api/chat", json=None, content_type="application/json")
        assert resp.status_code == 400

    def test_chat_handles_non_string_message_gracefully(self, client, fake_groq):
        resp = client.post("/api/chat", json={"message": 12345, "language": "en"})
        assert resp.status_code in (200, 400, 500)


# ---------------------------------------------------------------------------
# Briefing (protected)
# ---------------------------------------------------------------------------

class TestBriefing:
    def test_briefing_happy_path(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/briefing",
            json={"role": "Steward", "venue": "MetLife Stadium", "shift": "Morning"},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["role"] == "Steward"
        assert "briefing" in data

    def test_briefing_missing_role(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/briefing", json={"venue": "MetLife Stadium", "shift": "Morning"}
        )
        assert resp.status_code == 400

    def test_briefing_missing_venue(self, client, fake_groq):
        login(client)
        resp = client.post("/api/briefing", json={"role": "Steward", "shift": "Morning"})
        assert resp.status_code == 400

    def test_briefing_missing_shift(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/briefing", json={"role": "Steward", "venue": "MetLife Stadium"}
        )
        assert resp.status_code == 400

    def test_briefing_role_over_max_length_rejected(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/briefing",
            json={"role": "a" * 51, "venue": "MetLife Stadium", "shift": "Morning"},
        )
        assert resp.status_code == 400

    def test_briefing_role_at_max_length_allowed(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/briefing",
            json={"role": "a" * 50, "venue": "MetLife Stadium", "shift": "Morning"},
        )
        assert resp.status_code == 200

    def test_briefing_shift_over_max_length_rejected(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/briefing",
            json={"role": "Steward", "venue": "MetLife Stadium", "shift": "a" * 51},
        )
        assert resp.status_code == 400

    def test_briefing_special_events_over_max_length_rejected(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/briefing",
            json={
                "role": "Steward",
                "venue": "MetLife Stadium",
                "shift": "Morning",
                "special_events": "a" * (app_module.MAX_MESSAGE_LEN + 1),
            },
        )
        assert resp.status_code == 400

    def test_briefing_optional_special_events_omitted(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/briefing",
            json={"role": "Steward", "venue": "MetLife Stadium", "shift": "Morning"},
        )
        assert resp.status_code == 200

    # --- Security probes ---

    def test_briefing_xss_in_role_does_not_crash(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/briefing",
            json={
                "role": "<img src=x onerror=alert(1)>",
                "venue": "MetLife Stadium",
                "shift": "Morning",
            },
        )
        assert resp.status_code == 200

    def test_briefing_sql_injection_in_venue_does_not_crash(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/briefing",
            json={
                "role": "Steward",
                "venue": "'; DROP TABLE venues; --",
                "shift": "Morning",
            },
        )
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Crowd advice (protected)
# ---------------------------------------------------------------------------

class TestCrowdAdvice:
    def test_crowd_advice_happy_path(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/crowd-advice",
            json={"venue": "MetLife Stadium", "zone": "Gate A", "crowd_level": 7},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["density_label"] == "high"

    def test_crowd_advice_missing_venue(self, client, fake_groq):
        login(client)
        resp = client.post("/api/crowd-advice", json={"zone": "Gate A", "crowd_level": 5})
        assert resp.status_code == 400

    def test_crowd_advice_missing_zone(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/crowd-advice", json={"venue": "MetLife Stadium", "crowd_level": 5}
        )
        assert resp.status_code == 400

    def test_crowd_advice_defaults_crowd_level_to_five(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/crowd-advice", json={"venue": "MetLife Stadium", "zone": "Gate A"}
        )
        assert resp.status_code == 200
        assert resp.get_json()["crowd_level"] == 5

    # --- Boundary values on crowd_level ---

    def test_crowd_level_minimum_boundary_valid(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/crowd-advice",
            json={"venue": "MetLife Stadium", "zone": "Gate A", "crowd_level": 1},
        )
        assert resp.status_code == 200
        assert resp.get_json()["density_label"] == "low"

    def test_crowd_level_maximum_boundary_valid(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/crowd-advice",
            json={"venue": "MetLife Stadium", "zone": "Gate A", "crowd_level": 10},
        )
        assert resp.status_code == 200
        assert resp.get_json()["density_label"] == "critical"

    def test_crowd_level_zero_rejected(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/crowd-advice",
            json={"venue": "MetLife Stadium", "zone": "Gate A", "crowd_level": 0},
        )
        assert resp.status_code == 400

    def test_crowd_level_eleven_rejected(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/crowd-advice",
            json={"venue": "MetLife Stadium", "zone": "Gate A", "crowd_level": 11},
        )
        assert resp.status_code == 400

    def test_crowd_level_negative_rejected(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/crowd-advice",
            json={"venue": "MetLife Stadium", "zone": "Gate A", "crowd_level": -5},
        )
        assert resp.status_code == 400

    def test_crowd_level_non_numeric_string_rejected(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/crowd-advice",
            json={"venue": "MetLife Stadium", "zone": "Gate A", "crowd_level": "high"},
        )
        assert resp.status_code == 400

    def test_crowd_level_float_string_rejected(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/crowd-advice",
            json={"venue": "MetLife Stadium", "zone": "Gate A", "crowd_level": "5.5"},
        )
        assert resp.status_code == 400

    def test_crowd_level_numeric_string_accepted(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/crowd-advice",
            json={"venue": "MetLife Stadium", "zone": "Gate A", "crowd_level": "8"},
        )
        assert resp.status_code == 200
        assert resp.get_json()["crowd_level"] == 8

    def test_zone_over_max_length_rejected(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/crowd-advice",
            json={"venue": "MetLife Stadium", "zone": "a" * 101, "crowd_level": 5},
        )
        assert resp.status_code == 400

    def test_incident_over_max_length_rejected(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/crowd-advice",
            json={
                "venue": "MetLife Stadium",
                "zone": "Gate A",
                "crowd_level": 5,
                "incident": "a" * (app_module.MAX_MESSAGE_LEN + 1),
            },
        )
        assert resp.status_code == 400

    # --- Security probes ---

    def test_crowd_advice_xss_in_incident_does_not_crash(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/crowd-advice",
            json={
                "venue": "MetLife Stadium",
                "zone": "Gate A",
                "crowd_level": 5,
                "incident": "<script>document.cookie</script>",
            },
        )
        assert resp.status_code == 200

    def test_crowd_advice_sql_injection_in_zone_does_not_crash(self, client, fake_groq):
        login(client)
        resp = client.post(
            "/api/crowd-advice",
            json={
                "venue": "MetLife Stadium",
                "zone": "1' OR '1'='1",
                "crowd_level": 5,
            },
        )
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Schedule (proxies TheSportsDB)
# ---------------------------------------------------------------------------

class TestSchedule:
    def test_schedule_happy_path(self, client, fake_schedule_ok):
        resp = client.get("/api/schedule")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "upcoming" in data and "recent" in data

    def test_schedule_upcoming_event_marked_scheduled(self, client, fake_schedule_ok):
        resp = client.get("/api/schedule")
        upcoming = resp.get_json()["upcoming"]
        assert upcoming[0]["status"] == "Scheduled"

    def test_schedule_recent_event_marked_final(self, client, fake_schedule_ok):
        resp = client.get("/api/schedule")
        recent = resp.get_json()["recent"]
        assert recent[0]["status"] == "Final"

    def test_schedule_returns_502_when_source_unreachable(self, client, fake_schedule_down):
        resp = client.get("/api/schedule")
        assert resp.status_code == 502

    def test_schedule_error_response_has_message(self, client, fake_schedule_down):
        resp = client.get("/api/schedule")
        assert "error" in resp.get_json()


# ---------------------------------------------------------------------------
# Food menu & checkout
# ---------------------------------------------------------------------------

class TestFoodMenu:
    def test_food_menu_returns_200(self, client):
        resp = client.get("/api/food/menu")
        assert resp.status_code == 200

    def test_food_menu_matches_source_list(self, client):
        resp = client.get("/api/food/menu")
        assert resp.get_json()["menu"] == app_module.FOOD_MENU


class TestFoodCheckout:
    def test_checkout_happy_path(self, client):
        resp = client.post(
            "/api/food/checkout",
            json={"cart": [{"id": "f1", "quantity": 2}], "venue": "MetLife Stadium"},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert data["total"] == 25.00

    def test_checkout_empty_cart_rejected(self, client):
        resp = client.post("/api/food/checkout", json={"cart": []})
        assert resp.status_code == 400

    def test_checkout_missing_cart_rejected(self, client):
        resp = client.post("/api/food/checkout", json={})
        assert resp.status_code == 400

    def test_checkout_cart_not_a_list_rejected(self, client):
        resp = client.post("/api/food/checkout", json={"cart": "f1,f2"})
        assert resp.status_code == 400

    def test_checkout_unknown_item_id_ignored(self, client):
        resp = client.post(
            "/api/food/checkout", json={"cart": [{"id": "does-not-exist", "quantity": 1}]}
        )
        assert resp.status_code == 400  # no valid items => rejected

    def test_checkout_mixed_valid_and_invalid_items(self, client):
        resp = client.post(
            "/api/food/checkout",
            json={
                "cart": [
                    {"id": "does-not-exist", "quantity": 1},
                    {"id": "f2", "quantity": 1},
                ]
            },
        )
        assert resp.status_code == 200
        assert len(resp.get_json()["items"]) == 1

    def test_checkout_generates_order_number(self, client):
        resp = client.post("/api/food/checkout", json={"cart": [{"id": "f1", "quantity": 1}]})
        assert resp.get_json()["order_number"].startswith("SIQ-")

    def test_checkout_oversized_cart_rejected(self, client):
        cart = [{"id": "f1", "quantity": 1} for _ in range(51)]
        resp = client.post("/api/food/checkout", json={"cart": cart})
        assert resp.status_code == 400

    def test_checkout_cart_at_max_size_allowed(self, client):
        cart = [{"id": "f1", "quantity": 1} for _ in range(50)]
        resp = client.post("/api/food/checkout", json={"cart": cart})
        assert resp.status_code == 200

    # --- Quantity boundary/clamping ---

    def test_checkout_quantity_zero_clamped_to_one(self, client):
        resp = client.post(
            "/api/food/checkout", json={"cart": [{"id": "f6", "quantity": 0}]}
        )
        assert resp.status_code == 200
        assert resp.get_json()["items"][0]["quantity"] == 1

    def test_checkout_negative_quantity_clamped_to_one(self, client):
        resp = client.post(
            "/api/food/checkout", json={"cart": [{"id": "f6", "quantity": -5}]}
        )
        assert resp.status_code == 200
        assert resp.get_json()["items"][0]["quantity"] == 1

    def test_checkout_quantity_over_limit_clamped_to_twenty(self, client):
        resp = client.post(
            "/api/food/checkout", json={"cart": [{"id": "f6", "quantity": 999}]}
        )
        assert resp.status_code == 200
        assert resp.get_json()["items"][0]["quantity"] == 20

    def test_checkout_non_numeric_quantity_defaults_to_one(self, client):
        resp = client.post(
            "/api/food/checkout", json={"cart": [{"id": "f6", "quantity": "lots"}]}
        )
        assert resp.status_code == 200
        assert resp.get_json()["items"][0]["quantity"] == 1

    def test_checkout_missing_quantity_defaults_to_one(self, client):
        resp = client.post("/api/food/checkout", json={"cart": [{"id": "f6"}]})
        assert resp.status_code == 200
        assert resp.get_json()["items"][0]["quantity"] == 1

    # --- Security: server-side price integrity ---

    def test_checkout_ignores_client_submitted_price(self, client):
        """Client tries to tamper with price — server must recompute from FOOD_MENU."""
        resp = client.post(
            "/api/food/checkout",
            json={"cart": [{"id": "f1", "quantity": 1, "price": 0.01}]},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["items"][0]["price"] == 12.50
        assert data["total"] == 12.50

    def test_checkout_ignores_negative_price_tampering(self, client):
        resp = client.post(
            "/api/food/checkout",
            json={"cart": [{"id": "f1", "quantity": 1, "price": -100}]},
        )
        assert resp.status_code == 200
        assert resp.get_json()["total"] == 12.50

    def test_checkout_total_matches_sum_of_line_totals(self, client):
        resp = client.post(
            "/api/food/checkout",
            json={
                "cart": [
                    {"id": "f1", "quantity": 2},
                    {"id": "f6", "quantity": 3},
                ]
            },
        )
        data = resp.get_json()
        expected = round(12.50 * 2 + 4.00 * 3, 2)
        assert data["total"] == expected

    def test_checkout_malformed_cart_entries_skipped(self, client):
        resp = client.post(
            "/api/food/checkout",
            json={"cart": ["not-a-dict", 42, None, {"id": "f1", "quantity": 1}]},
        )
        assert resp.status_code == 200
        assert len(resp.get_json()["items"]) == 1

    def test_checkout_rejects_malformed_json(self, client):
        resp = client.post(
            "/api/food/checkout", data="{oops", content_type="application/json"
        )
        assert resp.status_code == 400

    def test_checkout_sql_injection_in_item_id_ignored_safely(self, client):
        resp = client.post(
            "/api/food/checkout",
            json={"cart": [{"id": "f1' OR '1'='1", "quantity": 1}]},
        )
        assert resp.status_code == 400  # not a real item id => no valid items

    def test_checkout_note_confirms_demo_only(self, client):
        resp = client.post("/api/food/checkout", json={"cart": [{"id": "f1", "quantity": 1}]})
        assert "no real payment" in resp.get_json()["note"].lower()


# ---------------------------------------------------------------------------
# Cross-cutting: large payloads / general resilience
# ---------------------------------------------------------------------------

class TestPayloadResilience:
    def test_large_json_payload_handled_without_crash(self, client, fake_groq):
        history = [{"role": "user", "content": "x" * 1000} for _ in range(50)]
        resp = client.post(
            "/api/chat", json={"message": "hi", "language": "en", "history": history}
        )
        assert resp.status_code == 200

    def test_deeply_nested_unexpected_field_types_do_not_crash(self, client):
        resp = client.post(
            "/api/food/checkout",
            json={"cart": [{"id": "f1", "quantity": 1, "extra": {"nested": ["a", "b"]}}]},
        )
        assert resp.status_code == 200

    def test_unicode_and_emoji_input_handled(self, client, fake_groq):
        resp = client.post(
            "/api/chat", json={"message": "¿Dónde está el baño? 🚻🏟️", "language": "es"}
        )
        assert resp.status_code == 200

    def test_null_byte_input_does_not_crash(self, client, fake_groq):
        resp = client.post("/api/chat", json={"message": "hi\x00there", "language": "en"})
        assert resp.status_code == 200