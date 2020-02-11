# Tarkov &middot; [![NPM](https://img.shields.io/npm/l/tarkov?color=blue&style=plastic)](https://github.com/matias-kovero/tarkov/blob/master/LICENSE) [![npm](https://img.shields.io/npm/v/tarkov?color=blue&style=plastic)](https://www.npmjs.com/package/tarkov) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=plastic)](https://github.com/matias-kovero/tarkov/pulls) [![https://github.com/matias-kovero/tarkov/](https://img.shields.io/badge/Tarkov-blue?style=plastic&logo=github&labelColor=24292e&color=4b5936)](https://github.com/matias-kovero/tarkov/)

A js library for the [Escape from Tarkov](https://escapefromtarkov.com) API.  
This library is currently in alpha. Everything may change significantly in future releases.  

View [Documentation](https://matias-kovero.github.io/tarkov/)
## Features
- [x] Authentication
- [x] Flea market
- [x] Traders
- [ ] Hideout
- [x] Inventory management(_*_)  
- [ ] Messenger
- [ ] Quests

_* Move & Stack are implemented_
## Install
```
npm i tarkov
```
## Usage
```javascript
const { Tarkov, generate_hwid } = require('tarkov');
const tarkov = new Tarkov();

// Check if launcherVersion is up-to-date
let lv = await tarkov.checkLauncherVersion();
console.log('>', lv);

// Check if gameVersion is up-to-date
let gv = await tarkov.checkGameVersion();
console.log('>', gv);

// Login with username, pw, hwid
let t = await tarkov.login("username", "pw", "hwid");

// Get profiles and select your pmc 
let profiles = await t.get_profiles();
let profile = profiles.find(p => p.info.side !== 'Savage');
await t.select_profile(profile.id);
console.log(`> Hello, ${profile.info.nickname}!`);

// Get localization strings.
await t.get_i18n("en");
 
// Get all items
let items = await t.get_items();
```
**Contains many other functions that will be documented later on.**
  
### Hardware ID
Hardware ID (HWID) may be required on authentication, it can either be sniffed from the EFT launcher or generated. It's recommended to save the HWID and reuse it after the first successful authentication.  
  
Using a fresh HWID means both captcha and 2FA code will be required on your first login attempt. This can be avoid by using the HWID generated by the EFT launcher or authenticating with your session cookie.
### Captcha
This library does not attempt to solve captchas for you, the `g-recaptcha-response` token from reCAPTCHA may be required on authentication.

reCAPTCHA can be solved externally using tools like [captcha-harvester](https://github.com/dzt/captcha-harvester).
```
URL: https://launcher.escapefromtarkov.com/launcher/login
Site_key: 6LexEI4UAAAAAIFtNZALcloZfEgHhB8rEUqC1LwV
```
## _"Unofficial"_
I should emphasize that this library is _unofficial_. EFT does not have a public API, everything in this repo was reversed from the game.

The API is clearly designed for internal use. It contains numerous spelling mistakes, inconsistent conventions, and tons of bad practice JSON. The developers may push breaking changes without prior warning.
## Want to Contribute?  
[Read this first!](CONTRIBUTING.md)
## License
[MIT](LICENSE)
