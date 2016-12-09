#!/usr/bin/env node
"use strict";

require('ts-node').register({
    project: './src/'
});
require('./www');
