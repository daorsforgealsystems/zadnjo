# API Gateway & Proxy: Future Improvements

This file lists recommended improvements for the API Gateway proxy and identity propagation logic.

## Suggestions
- Use a custom Express middleware to set identity headers before proxying, for full type safety.
- Refactor proxy logic to leverage latest http-proxy-middleware event API if/when type definitions improve.
- Add more granular RBAC and claims propagation.
- Implement request/response logging for audit and debugging.
- Add circuit breaker and retry logic for downstream service failures.
- Consider OpenAPI validation for incoming requests.

---
_Last updated: August 17, 2025_
