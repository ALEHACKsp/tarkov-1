require('./lib/globals');
const Auth            = require('./lib/auth');
const auth            = new Auth();
const Profile         = require('./lib/profile');
const Trader          = require('./lib/trader');
const Item            = require('./lib/item');
const generate_hwid   = require('./lib/hwid');


/**
* ### Unofficial Tarkov API
* @class
* @memberof Exports
*/
function Tarkov(client=request, hwid, session) {
  if (!(this instanceof Tarkov)) return new Tarkov(client, hwid, session);

  this.client = client;
  this.hwid = hwid;
  this.session = session;
}
  /**
   * Checks if the library is using the right launcher version.
   * If not it will update the version for this session.
   */
  Tarkov.prototype.checkLauncherVersion = async function() {
    let msg = "Serious error. Contant creator.";
    let url = `https://${LAUNCHER_ENDPOINT}/launcher/GetLauncherDistrib`;
    let res = await auth.post_json(this.client, url, {});
    if(!res.data.Version) msg = 'Issues while fetching launcherVersion...';
    else if(res.data.Version) {
      if(res.data.Version !== LAUNCHER_VERSION) {
        // Launcher is not up-to-date, update global param.
        LAUNCHER_VERSION = res.data.Version;
        msg = `Launcher updated to version: ${LAUNCHER_VERSION}`;
      } else {
        msg = `Launcher is up-to-date on version: ${LAUNCHER_VERSION}`;
      }
    }
    return msg;
  }

  /**
   * Checks if the library is using the right game version.
   * If not it will update the version for this session.
   */
  Tarkov.prototype.checkGameVersion = async function() {
    let msg = "Serious error. Contact creator";
    let url = `https://${LAUNCHER_ENDPOINT}/launcher/GetPatchList?launcherVersion=${LAUNCHER_VERSION}&branch=live`;
    let res = await auth.post_json(this.client, url, {});
    if(!res.data[0].Version) msg = 'Issues while fetching gameVersion...';
    else if(res.data[0].Version) {
      if(res.data[0].Version !== GAME_VERSION) {
        // Game is not up-to-date, update global param.
        GAME_VERSION = res.data[0].Version;
        msg = `Game updated to version: ${GAME_VERSION}`;
      } else {
        msg = `Game is up-to-date on version: ${GAME_VERSION}`;
      }
    }
    return msg;
  }

  /**
   * Login with email and password.
   * @param {String} email user email
   * @param {String} password password
   * @param {String} hwid hardware id
   * @returns {Tarkov} Tarkov session
   * @async
   * @example
   * // Init Tarkov
   * let tarkov = new Tarkov();
   * // Login and save instance to t
   * let t = await tarkov.login("username@domain.com", "p@assw0rd", "yourHWID");
   * // Will print your session id.
   * console.log(`Session ID: ${t.session}`);
   */
  Tarkov.prototype.login = async function(email, password, hwid) {
    try {
      let user = await auth.login(this.client, email, password, null, hwid);
      let session = await auth.exchange_access_token(this.client, user.access_token, hwid);
      return Tarkov(this.client, hwid.toString(), session.session);
    } catch (err) {
      console.log(err.message);
    }
  }

  /**
   * Login with a Bearer token.
   * @param {String} access_token
   * @param {String} hwid 
   * @private
   * Can't really see anyone would login with this. AFAIK internal use only.
   */
  Tarkov.prototype.from_access_token = async function(access_token, hwid) {
    try {
      let session = await auth.exchange_access_token(this.client, access_token, hwid);
      return Tarkov(this.client, hwid.toString(), session.session);
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Login with email, password and 2FA code
   * @param {String} email user email
   * @param {String} password user password
   * @param {String} code 2FA code
   * @param {String} hwid hardware id
   * @returns {Tarkov} Tarkov session
   * @async
   * @example
   * // Init Tarkov
   * let tarkov = new Tarkov();
   * // Login and save instance to t
   * let t = await tarkov.login_with_2fa("username@domain.com", "p@assw0rd", "2FACode", "yourHWID");
   * // Will print your session id.
   * console.log(`Session ID: ${t.session}`);
   */
  Tarkov.prototype.login_with_2fa = async function(email, password, code, hwid) {
    try {
      if(!email || !password || !code || !hwid) throw new Error('Invalid parameters');
      await auth.activate_hardware(this.client, email, code, hwid);
      let user = await auth.login(this.client, email, password, null, hwid);
      let session = await auth.exchange_access_token(this.client, user.access_token, hwid);
      return Tarkov(this.client, hwid.toString(), session.session);
    } catch (err) {
      console.log('2FA:', err.message);
    }
  }

  /* TODO: Fix res.data */
  /**
   * Gets users all profiles.  
   * Used to select players profile after login.
   * @returns {Promise<Profile[]>} Array of profiles
   * @async
   */
  Tarkov.prototype.get_profiles = async function() {
    let url = `https://${PROD_ENDPOINT}/client/game/profile/list`;
    let res = await this.post_json(url, {});
    let profiles = res.data.map(profile => { return new Profile(profile)});
    return profiles;
  }

  /**
   * Select profile with its profile id.
   * @param {String} user_id profile id
   * @async
   * @example
   * // Get profiles
   * let profiles = await tarkov.get_profiles();
   * // Get profile that isn't scav -> Your pmc
   * let profile = profiles.find(p => p.info.side !== 'Savage');
   * // Select the profile
   * await tarkov.select_profile(profile.id);
   */
  Tarkov.prototype.select_profile = async function(user_id) {
    try {
      if(!user_id) return Error("Invalid or empty profile ID");
      let url = `https://${PROD_ENDPOINT}/client/game/profile/select`;
      let res = await this.post_json(url, { uid: user_id }); // TraderResponse
      if(res.data) return;
      else throw new Error(res.errmsg);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Get a list of all traders.
   * @returns {Promise<Trader[]>} Array of traders
   */
  Tarkov.prototype.get_traders = async function() {
    try {
      let url = `https://${TRADING_ENDPOINT}/client/trading/api/getTradersList`;
      let res = await this.post_json(url, {}); // TradersResponse <Array>
      let traders = res.data.map(trader => { return new Trader(trader) });
      return traders;
    } catch (error) {
      console.log(error.message);
      return new Error(error.message);
    }
  }

  /**
   * Get a trader by their ID. 
   * 
   * ### Example of getting english tranlations for trader
   * ```
   * // Get english strings  
   * let locale = await t.get_i18n("en");   
   * // Get traders  
   * let traders = await t.get_traders();  
   * // Get traders Fence information
   * let trader = traders.find(t => locale.trading[t.id].nickname == "Fence");
   * ```
   */
  Tarkov.prototype.get_trader = async function(trader_id) {
    if(!trader_id) return Error("Invalid or empty trader ID");
    let url = `https://${TRADING_ENDPOINT}/client/trading/api/getTrader/${trader_id}`;
    let res = await this.post_json(url, {}); // TraderResponse
    let trader = res.data;
    return trader;
  }

  /**
   * Get localization table. Pass a valid ISO 639-1 language code.  
   * List of valid codes: {TODO}
   * @param {String} language - Valid ISO 639-1 language code.
   * @async
   */
  Tarkov.prototype.get_i18n = async function(language) {
    if(!language) return Error("Invalid or empty language");
    let url = `https://${PROD_ENDPOINT}/client/locale/${language}`;
    let res = await this.post_json(url, {});
    let localization = new LocalizationResponse(res);
    return localization;
  }

  /**
   * Get current forecast and time.
   * @async
   */
  Tarkov.prototype.get_weather = async function() {
    try {
      let url = `https://${PROD_ENDPOINT}/client/weather`;
      let res = await this.post_json(url, {});
      if(res.data) return res.data.weather;
      else throw new Error(res.errmsg);
    } catch (error) {
      throw new Error(error.errmsg);
    }
  }

  /**
   * Gets all the items from the game.  
   * Note! This returns all the items from the game, not items from your inventory.
   * @returns {Item[]} Array with all the items from the game.
   * @async
   */
  Tarkov.prototype.get_items = async function() {
    try {
      let url = `https://${PROD_ENDPOINT}/client/items`;
      let res = await this.post_json(url, {crc : 0});
      let items = Object.entries(res.data).map(item => { return new Item(item) });
      return items;
      //else throw new Error(res.errmsg);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Get messages from Messenger.  
   * If you know more values, please inform creator.
   * @param {Number} type 2 = NPC/Quest, 4 = Market, 7 = System
   * @async
   * @returns {Object[]} Array of messages
   */
  Tarkov.prototype.get_messages = async function(type) {
    try {
      if(!type) throw new Error(`Missing parameter type`);
      let url = `https://${PROD_ENDPOINT}/client/mail/dialog/list`;
      let res = await this.post_json(url, {});
      if(res.err != 0 || res.errmsg ) throw new Error(`get_messages error: ${res.errmsg}`);
      let list = res.data.filter(dialog => dialog.type == type);
      if(!list.length) throw new Error(`Found nothing with type: ${type}`);
      else return list;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Get all attachments of specific message.  
   * Get the message id from `tarkov.get_messages(Number)`
   * @param {String} message_id id of the message.
   * @returns {Object[]} Array of Attachments. Item located at items.data
   * @async
   * @example
   * // Get Ragfair messages
   * let messages = await tarkov.get_messages(4);
   * // Select 1st message, and get its attachments
   * let attachments = await tarkov.get_message_attachments(messages[0]._id);
   * // Move 1st attachment to users stash
   * let move = await tarkov.collect_item(attachments[0].items.data[0]_id, profile.inventory.stash, attachments[0]._id);
   */
  Tarkov.prototype.get_message_attachments = async function(message_id) {
    try {
      if(!message_id) throw new Error(`Missing parameter message_id`);
      let url = `https://${PROD_ENDPOINT}/client/mail/dialog/getAllAttachments`;
      let res = await this.post_json(url, {dialogId: message_id});
      if(res.err != 0 || res.errmsg ) throw new Error(`get_message_attachments error: ${res.errmsg}`);
      else return res.data.messages;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Search offers from Flea Market.
   * @async
   * @param {Number} page - starting page, example: start searching from page 0.
   * @param {Number} limit - limit how many results to show. Example: 15.
   * @param {Object} filter - Market Filter
   * @param {Number} [filter.sort_type=5] - ID = 0, Barter = 2, Mechant Rating = 3, Price = 5, Expiry = 6
   * @param {Number} [filter.sort_direction=0] - Ascending = 0, Descending = 1
   * @param {Number} [filter.currency=0] - All = 0, RUB = 1, USD = 2, EUR = 3
   * @param {Number} [filter.min_price=0] - Won't show offers below this number
   * @param {Number} [filter.max_price=0] - Won't show offers higher than this number
   * @param {Number} [filter.min_condition=0] - Won't show offers where item won't match minium condition
   * @param {Number} [filter.max_condition=100] - Won't show offers where item won't match maxium condition
   * @param {Boolean} [filter.expiring_within_hour=false] - Show items that are expiring within hour
   * @param {Boolean} [filter.hide_bartering_offers=true] - Should we hide bartering offers
   * @param {Number} [filter.owner_type=0] - Any owner = 0, Listed by traders = 1, Listed by players = 2
   * @param {Boolean} [filter.hide_inoperable_weapons=true] - Hide weapons that are inoperable
   * @param {String} [filter.handbook_id=""] - item id you are searching
   * @param {String} [filter.linked_search_id=""] - if you are performing linked item search, include item id
   * @param {String} [filter.required_search_id=""] - if you are performing required item search, include item id
   */
  Tarkov.prototype.search_market = async function(page, limit, filter) {
    try {
      if(limit == 0) return Error('Invalid filter');
      let url = `https://${RAGFAIR_ENDPOINT}/client/ragfair/find`;
      let body = {
        page: page,
        limit: limit,
        sortType: filter.sort_type || 5,
        sortDirection: filter.sort_direction || 0,
        currency: filter.currency || 0,
        priceFrom: filter.min_price || 0,
        priceTo: filter.max_price || 0,
        quantityFrom: filter.min_quantity || 0,
        quantityTo: filter.max_quantity || 0,
        conditionFrom: filter.min_condition || 0,
        conditionTo: filter.max_condition || 100,
        oneHourExpiration: filter.expiring_within_hour || false,
        removeBartering: filter.hide_bartering_offers || true,
        offerOwnerType: filter.owner_type || 0,
        onlyFunctional: filter.hide_inoperable_weapons || true,
        updateOfferCount: true,
        handbookId: filter.handbook_id || "",
        linkedSearchId: filter.linked_search_id || "",
        neededSearchId: filter.required_search_id || "",
        tm: 1,
      };
      let res = await this.post_json(url, body);
      if(res.data) return res.data;
      else throw new Error(res.errmsg);
    } catch(error) {
      console.log(error.message);
      return new Error(error.message);
    }
  }

  Tarkov.prototype.buy_item = async function(offer_id, quantity, barter_item) {
    try {
      if(!offer_id || quantity === 0 || !barter_item.id || !barter_item.count) return new Error('Invalid params');
      let url = `https://${PROD_ENDPOINT}/client/game/profile/items/moving`;
      let body = {
        data: [{
          Action: "RagFairBuyOffer",
          offers: [{
            id: offer_id,
            count: quantity,
            items: [{
              id: barter_item.id,
              count: barter_item.count,
            }],
          }],
        }],
        tm: 2,
      };
      let res = await this.post_json(url, body);
      if(res.err == 0 && res.data.items) return res.data.items;
      else if(res.data.badRequest[0]) return res.data.badRequest[0];
      else return res;
    } catch(error) {
      console.log(error.message); // 1503 | 1506 | 1507, offerNotFound?
      return new Error(error.message);
    }
  }

  Tarkov.prototype.sell_item = async function(trader_id, item_id, quantity) {
    try {
      if(!trader_id || !item_id || quantity == 0) return new Error('Invalid params');

      let url = `https://${PROD_ENDPOINT}/client/game/profile/items/moving`;
      let body = {
        data: [{
          Action: "TradingConfirm",
          type: "sell_to_trader",
          tid: trader_id,
          items: [{
            id: item_id,
            count: quantity,
            scheme_id: 0,
          }]
        }],
        tm: 0,
      };
      let res = await this.post_json(url, body);
      if(res.errmsg) console.log(res);
      if(res.data) return res.data.items;
      else throw new Error(res.errmsg);
    } catch (error) {
      console.log(error.message); // 1503 | 1506 | 1507, offerNotFound?
      return new Error(error.message);
    }
  }

  /**
   * Put item on flea market.
   * @param {Array} items - Array of items ids from your inventory you want to sell. (Need to be same items)
   * @param {Object} requirement - Object with sell info {_tlp: items _tlp, price: sellprice}
   * @param {String} requirement._tpl - Items schema id. Also known _tpl. Ex. Rouble_id
   * @param {String} requirement.price - On what price you want to sell.
   * @param {Boolean} sell_all - Sell all in one piece. Default false
   */
  Tarkov.prototype.offer_item = async function(items, requirement, sell_all) {
    try {
      if(!items || !requirement) throw new Error('Invalid params');
      let url = `https://${PROD_ENDPOINT}/client/game/profile/items/moving`;
      
      let body = {
        data: [{
          Action: "RagFairAddOffer",
          sellInOnePiece: sell_all || false,
          items: items, // Array of item_ids
          requirements:[{
            _tpl: requirement._tpl,
            count: requirement.price,
            level: 0,
            side: 0,
            onlyFunctional: false,
          }],
        tm: 2,
        }],
      };

      let res = await this.post_json(url, body);
      if(res.data.badRequest[0]) return res.data.badRequest[0];
      else if(res.err == 0 && res.data.items) return res.data.items;
      else return res;
    } catch(error) {
      console.log(error.message);
      return new Error(error.message);
    }
  }

  /* TODO: Handle errors correctly, as there will be bunch of invalid moves. */
  /**
   * Will merge 2 items together.  
   * ### Caution!! This functions has no error handling yet!
   * #### Example usage: 
   * - merge stack of roubles to another stack of roubles.
   * - merge stack of bullets to another stack of bullets.
   * @param from_item_id the item we will move 
   * @param to_item_id the item id where we merge(stack)
   */
  Tarkov.prototype.stack_item = async function(from_item_id, to_item_id) {
    let url = `https://${PROD_ENDPOINT}/client/game/profile/items/moving`;
    let body = {
      data: [{
        Action: "Merge",
        item: from_item_id,
        with: to_item_id
      }],
      tm: 2,
    };
    let res = await this.post_json(url, body);
    if(res.err != 0) console.log(res);
    //console.log(res);
  }

  /**
   * Move item in inventory.
   * @async
   * @param {String} item_id - the item id what we want to move.
   * @param {Object} destination - info where to move. {id, container, location:{x,y,r} }
   * @param {String} destination.id - item id where we move
   * @param {String} [destination.container="hideout"] - 'main' = container, 'hideout' = stash
   * @param {Object} [destination.location={x:0,y:0,r:0}] - {x, y, r} x & y locations, topleft is 0,0. r = 0 or 1.
   */
  Tarkov.prototype.move_item = async function(item_id, destination) {
    if(!item_id || !destination.id) return new Error('Invalid params');
    let url = `https://${PROD_ENDPOINT}/client/game/profile/items/moving`;
    let body = {
      data: [{
        Action: "Move",
        item: item_id,
        to:{
          id: destination.id,
          container: destination.container || 'hideout', // main = container, hideout = stash 
          location: destination.location || {x: 0, y: 0, r: 0}, // try to put to topleft if empty
        },
      }],
      tm: 2,
    };
    let res = await this.post_json(url, body);
    if(res.err != 0) throw new Error(`Move item error: ${res.errmsg}`);
    else if(res.err == 0) return 'Moved';
    //console.log(res);
  }

  /**
   * Collect items to stash from messages.
   * @async
   * @param {String} item_id collect item id
   * @param {String} stash_id players stash_id. Get it from `profile.inventory.stash`
   * @param {String} attachment_id attachments id
   */
  Tarkov.prototype.collect_item = async function(item_id, stash_id, attachment_id) {
    if(!item_id || !stash_id.id || !attachment_id) return new Error('Invalid params');
    let url = `https://${PROD_ENDPOINT}/client/game/profile/items/moving`;
    let body = {
      data: [{
        Action: "Move",
        item: item_id,
        to:{
          id: stash_id,
          container:'hideout',
        },
        fromOwner: {
          id: attachment_id,
          type: 'Mail'
        }
      }]
    };
    let res = await this.post_json(url, body);
    if(res.err != 0) throw new Error(`Collect item error: ${res.errmsg}`);
    else if(res.err == 0) return 'Collected';
  }

  /**
   * Send JSON to EFT Server
   * @param {*} this 
   * @param {String} url path were the request should be sent
   * @param {Object} body data to send
   * @private
   */
  
  Tarkov.prototype.post_json = async function(url, data) {
    try {
      let response = await this.client({
        url: url,
        type: 'post',
        headers: {
          'User-Agent': `UnityPlayer/${UNITY_VERSION} (UnityWebRequest/1.0, libcurl/7.52.0-DEV)`,
          'App-Version': `EFT Client ${GAME_VERSION}`,
          'X-Unity-Version': UNITY_VERSION,
          'Cookie': `PHPSESSID=${this.session}`
        },
        gzip: true,
        encoding: null,
        json: data,
        transform: body => JSON.parse(pako.inflate(body, {to: 'string' })) 
      });
      return response;
    } catch (err) {
      console.log('ERROR', err);
    }
  }

  /**
   * Keep the current session alive. Session expires after ~30 seconds of idling.
   * @async
   * @example
   * // Will extend the sessions for ~30 sec
   * await tarkov.keep_alive();
   */
  Tarkov.prototype.keep_alive = async function() {
    let url = `https://${PROD_ENDPOINT}/client/game/keepalive`;
    let res = await this.post_json(url, {});
    if(!res || res.err != 0) throw Error(res.errmsg);
    else if(res.err == 0) return;
  }

  class LocalizationResponse {
    constructor(obj) {
      Object.assign(this, obj);
      this.data = new Localization(obj.data);
      if(obj.err == 0) {
        /*
        let jsonCont = JSON.stringify(this.data);
        fs.writeFile('lang_en.json', jsonCont, 'utf8', function(err) {
          if(err) {console.log(err.message); return console.log(err);}
        });*/
        //console.log(Object.keys(this.data));
        //console.log(Object.values(this.data.enum));
        //console.log(this.data.handbook['5b5f757486f774093e6cb507'][0]);
        LOCAL_STRINGS = this.data;
        return this.data; 
      }
      else return new Error(obj.errmsg);
    }
  }

  class Localization {
    constructor(obj) {
      Object.assign(this, obj)
    }
  }

module.exports = { Tarkov, generate_hwid };