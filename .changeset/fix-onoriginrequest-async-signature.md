---
"@bunny.net/edgescript-sdk": patch
---

`onOriginRequest`'s old `Promise<Request> | Promise<Response>` signature
doesn't accept `async` callbacks returning a mix of the two: TS infers
`Promise<Request | Response>` for them, which is a supertype the narrower
union won't accept. Flagged in #63 and partially fixed in #64 (which only
touched the ambient declaration).

Widen both hooks, with sync returns too:

* `onOriginRequest`: `(ctx) => Request | Response | Promise<Request | Response>`
* `onOriginResponse`: `(ctx) => Response | Promise<Response>`

Same shape as `ServerHandler`, strictly wider, nothing breaks.
