# GACI API Contract v0.1.3 (Stub)
Base: /api/v1
- Auth: /auth/login, /auth/me
- Check-ins: POST /checkins, PATCH /checkins/:id, POST /alignment/suggest, POST /alignment/confirm, POST /checkins/:id/complete
- Journal: GET/POST /journal/posts, POST /journal/posts/:id/save
- Constellation: GET /constellation, GET /constellation/drilldown
- Together: GET /together/feed, POST /together/share
- DM: GET/POST /dm/threads, GET/POST /dm/threads/:id/messages, POST /dm/report, POST /dm/block
Note: Together must never be auto-invoked by core loop endpoints.
