# Changelog
All notable changes to the EVIE project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Deployment to a Debian host via GHCR and SSH `docker compose`, replacing TeamCity
- Container healthchecks on both services, so a deploy waits for them to actually serve
- Dependabot configuration for npm, GitHub Actions and Docker updates
- A `migrate:dev` script, to run the migrations from source rather than from `dist/`

### Changed
- Moved the Docker setup to `deploy/`, with a Compose v2 `compose.yaml` and one Dockerfile per
  service
- Neither service publishes a host port any more. The client joins the external `edge` network and
  is reached at `evie-client:80` by a reverse proxy; the server joins the external `db` network to
  reach the database and is reached at `evie-server:3731` by the client's nginx. `EVIE_CLIENT_PORT`
  is gone
- The server container runs as the unprivileged `node` user
- Updated the server to Node.js 24 and replaced `ormconfig.js` with a `DataSource` in
  `server/src/data-source.ts`, shared by the application and the migration CLI
- Replaced the unmaintained `mysql` driver with `mysql2`
- Migrations are compiled into `dist/` and no longer need `ts-node` at runtime, so the production
  image installs with `npm ci --omit=dev`

### Fixed
- All known security advisories in the server's dependency tree

### Removed
- `server/ormconfig.js`, superseded by `server/src/data-source.ts`
- The root `docker-compose.yml`, superseded by `deploy/compose.yaml`

### Known issues
- **The client still fails `npm audit --omit=dev`.** 24 of its 31 production advisories are
  `@angular/*` itself, and the first non-vulnerable Angular is 20.3.26, so nothing short of
  upgrading from Angular 11 can clear them. Its audit job runs in CI but does not gate. The upgrade
  also drags in Bootstrap 4 to 5, ng-bootstrap 9 to 18+, ngx-graph, FontAwesome Pro 5 to 7,
  RxJS 6 to 7 and tslint to eslint, so it is a project of its own.
- Because of that, the client image is the only thing here still built on Node 16. Angular 11 ships
  webpack 4, whose hardcoded md4 hashing fails against the OpenSSL 3 in Node 17 and newer.
- The TeamCity pipeline deployed `master` to dev.spaceships.app and tags to spaceships.app. The
  replacement deploys `master` straight to the one host, and the client image is always built with
  `EVIE_ENV=production`.

[Unreleased]: https://github.com/Ionaru/EVIE/compare/c389869...HEAD
