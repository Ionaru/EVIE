# EVIE

[![](https://img.shields.io/badge/fly_safe-o7-2F849E.svg?style=for-the-badge)](https://www.eveonline.com/)

EVIE is a web-based API interface for EVE Online. It’s built using modern web technologies to provide a fast and responsive interface while still displaying a large amount of information.

My goal of this project is to build a robust API interface that is usable on any platform: including both desktop and mobile. *cough* cross-platform app *cough*. I don’t just want to display data from the API, but also do calculations, predictions and more to make EVIE more useful, even when you also have the game open.

Right now the features are limited, but new pages are being built and I have a lot of exciting features planned!

---

### Screenshots
**Dashboard**

![](https://data.saturnserver.org/images/dashboard.png)

**Skills Page**

![](https://data.saturnserver.org/images/skills.png)

**Wallet Page**

![](https://data.saturnserver.org/images/wallet.png)

**Ore prices table**

![](https://data.saturnserver.org/images/ores.png)

---

### TODO & Ideas

#### General
* Option to switch between TQ and SiSi.
* ~~Use shared functions between client and server~~
* ~~Selecting a subset of scopes for SSO~~
* Something special on character birthday / April fools / christmas
* Responsiveness
* More pages!
* More tests!
* Set up automated testing.

#### Wallet page
* Pagination
* Cash-flow breakdown

#### Industry page
* ~~Fetch industry information from SDE(-like API) to server~~
* ~~Create routes so client can fetch industry info in small portions~~
* Do cost calculations on resources, recursively

---

### Configuration
EVIE requires some set-up to work, this information is for developers.

#### EVE Online developer applications
<https://developers.eveonline.com/applications>
EVIE works with two EVE Online developer applications, one for logging in, and one for character auth.
This is done so users can decide what scopes to grant for each of their characters.

- SSO Login (Authentication Only)
- SSO Auth (Authentication & API Access)
    - Give this all available scopes, only a subset will be used for EVIE.

#### Environment variables
- `DEBUG`: Parameters for the debug package. See <https://www.npmjs.com/package/debug> for more information.
- `EVIE_CLIENT_PORT`: The port the client should run on.
- `EVIE_DATA_VOLUME`: Docker volume for the data folder.`
- `EVIE_DB_HOST`: Host of the database to connect to.
- `EVIE_DB_NAME`: Name of the database to connect to.
- `EVIE_DB_PASS`: Password to use in the database connection.
- `EVIE_DB_PORT`: Port of the database to connect to.
- `EVIE_DB_SSL_CA` (optional): Location of the CA certificate **in the container** to use for a secure database connection.
- `EVIE_DB_SSL_CERT` (optional): Location of the client certificate **in the container** to use for a secure database connection.
- `EVIE_DB_SSL_KEY` (optional): Location of the client key **in the container** to use for a secure database connection.
- `EVIE_DB_SSL_REJECT` (boolean): Whether to reject an insecure connection to the database.
- `EVIE_DB_USER`: Username to use in the database connection.
- `EVIE_ENV`: Configuration to pass to Angular for building.
- `EVIE_FA_TOKEN`: FontAwesome 5 token.
- `EVIE_SERVER_PORT`: The port the server should run on.
- `EVIE_SESSION_KEY`: Name of the session ID cookie.
- `EVIE_SESSION_SECRET`: Secret used to sign the session ID cookie.
- `EVIE_SESSION_SECURE` (boolean): Serve cookies over a secure connection only? Disable for local development.
- `EVIE_SSO_AUTH_CALLBACK`: Callback URL of the SSO application that handles character auth.
- `EVIE_SSO_AUTH_CLIENT`: Client ID of the SSO application that handles character auth.
- `EVIE_SSO_AUTH_SECRET`: Secret Key of the SSO application that handles character auth.
- `EVIE_SSO_LOGIN_CALLBACK`: Callback URL of the SSO application that handles login.
- `EVIE_SSO_LOGIN_CLIENT`: Client ID of the SSO application that handles login.
- `EVIE_SSO_LOGIN_SECRET`: Secret Key of the SSO application that handles login.
