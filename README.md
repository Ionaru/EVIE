# EVIE

[![Build Status](https://travis-ci.org/Ionaru/EVIE.svg?branch=master)](https://travis-ci.org/Ionaru/EVIE)
[![Test Coverage](https://lima.codeclimate.com/github/Ionaru/EVIE/badges/coverage.svg)](https://lima.codeclimate.com/github/Ionaru/EVIE/coverage)
[![](https://img.shields.io/badge/fly-safe-2F849E.svg)](https://www.eveonline.com/)

This project started as a practise exercise for me to get myself more familiar with Angular and Typescript.
...it's grown a bit beyond that, oops! 😉

Currently I am still working on the basic functionality, but will launch it when I feel enough features have been added to make this website useful.

---

Cross-browser testing for guaranteed compatibility, provided by

[![](https://camo.githubusercontent.com/f33f902e2e990851bff52b6e284c4f384f89378b/68747470733a2f2f7777772e62726f77736572737461636b2e636f6d2f696d616765732f6d61696c2f62726f77736572737461636b2d6c6f676f2d666f6f7465722e706e67)](https://browserstack.com)


---

### Install
```bash
docker build --build-arg FA_TOKEN=${FA_TOKEN} --tag evie:latest .
docker run --public 3001:3001 --volume C:\Data\Evie\logs:/app/server/logs --volume C:\Data\Evie\data:/app/server/data --volume C:\Data\Evie\config:/app/server/config evie:latest
```

### TODO

#### General
* Option to switch between TQ and SiSi.
* Caching of types in the server.
* Use shared functions between client and server
* Selecting a subset of scopes for SSO
* Something special on character birthday / april fools / christmas
* Responsiveness

#### Skills page
* Attribute levels

#### Industry page
* Fetch industry information from SDE(-like API) to server
* Create routes so client can fetch industry info in small portions
* Do cost calculations on resources, recursively
