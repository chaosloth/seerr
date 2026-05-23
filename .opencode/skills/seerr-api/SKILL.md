---
name: seerr-api
description: Use ONLY when adding, modifying, or reviewing API endpoints that require changes to seerr-api.yml. Covers the OpenAPI 3.0.2 spec structure, schema conventions, path definitions, security requirements, the Date serialization gotcha, and how routes get validated by express-openapi-validator.
---

# Seerr API (OpenAPI Spec)

## The spec file

All API definitions live in `seerr-api.yml` at the repository root. This is an OpenAPI 3.0.2 specification.

The file is validated by `express-openapi-validator` middleware on every request to `/api/v1/*`. If a request or response doesn't match the spec, the validator rejects it.

## File structure

```
openapi: '3.0.2'
info: ...
tags: ...
servers: ...
components:
  schemas:
    <SchemaName>:
      type: object
      properties: ...
paths:
  /some/route:
    get: ...
    post: ...
security:
  - cookieAuth: []
  - apiKey: []
```

## Adding a new endpoint

Add paths at the end of the `paths:` section, before the `security:` block. Each path needs:

```yaml
  /route/path:
    get:
      summary: Short description
      description: Longer description
      tags:
        - settings          # use existing tag or add a new one
      parameters:           # optional: path/query params
        - in: path
          name: id
          required: true
          schema:
            type: integer
      requestBody:          # for POST/PUT
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SomeSchema'
      responses:
        '200':
          description: Human-readable result description
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SomeSchema'
```

## Adding a new schema

Add schemas in `components/schemas/`, alphabetically near related schemas. Follow the existing patterns:

```yaml
    NewSchema:
      type: object
      required:
        - name
        - type
      properties:
        id:
          type: number
          readOnly: true
          example: 1
        name:
          type: string
          example: Example Name
        createdAt:
          type: string
          format: date-time
          readOnly: true
        updatedAt:
          type: string
          format: date-time
          readOnly: true
```

## Date serialization CRITICAL GOTCHA

The OpenAPI validator validates **responses**, not just requests. The server has a workaround in `server/index.ts` that calls `JSON.parse(JSON.stringify(json))` to serialize Date objects to strings before the validator sees them.

**When adding any Date field to an API response:**
- Always declare it as `type: string` with `format: date-time` in the schema
- Never use `type: object` for a date field — the validator will reject it

If you see `500` errors with validation messages about dates being objects instead of strings, this is the cause.

## Route mounting

Routes in the spec must match the Express route mounting in `server/routes/index.ts`:

```typescript
server.use('/api/v1', routes);     // All routes are under /api/v1
```

So a path `/movie` in the spec corresponds to `/api/v1/movie` in the API.

The servers base URL in the spec:
```yaml
servers:
  - url: '{server}/api/v1'
    variables:
      server:
        default: http://localhost:5055
```

## Security

All endpoints must declare one of:

```yaml
security:
  - cookieAuth: []
  - apiKey: []
```

The security schemes are defined in the `components/securitySchemes/` section (cookie + API key auth).

## References

Use `$ref: '#/components/schemas/SchemaName'` to reference schemas. For arrays:
```yaml
schema:
  type: array
  items:
    $ref: '#/components/schemas/SchemaName'
```

## Testing changes

Restart the dev server after editing `seerr-api.yml` (nodemon watches it). Invalid spec changes will cause the server to fail on startup with validation errors.
