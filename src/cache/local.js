import { promises as fs } from 'fs';
import path from 'path';

import NodeCache from 'node-cache';

import Cache from './cache';


fs.exists = path => fs.stat(path).catch(err => {
  if (err.code === "ENOENT") return false;
  throw err;
});


class LocalCache extends Cache {
  constructor(...args) {
    const local = args.shift();

    super();

    const { persistent, file='cache', ttl=0, checkperiod=600 } = local;

    this.cache = new NodeCache({
      stdTTL: ttl, // ttl in seconds, 0: unlimited
      checkperiod // delete check interval in seconds, 0: no check
    });

    if (persistent) {
      this.persistent = persistent;
      this.file = file;
      // await this.load();
      // NOTE: constructor not async - https://gist.github.com/goloroden/c976971e5f42c859f64be3ad7fc6f4ed

      // setInterval(() => this.save, 10*1000);
    }
  }

  async load(directoryPath = __dirname) {
    const filePath = path.join(directoryPath, `${this.file}.json`);
    const exists = await fs.exists(filePath);
    if (exists) {
      const json = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(json);
      for (const [key, val] of Object.entries(data)) {
        if (data.hasOwnProperty(key)) {
          this.cache.set(key, val);
        }
      }
    }
  };

  async save(directoryPath = __dirname) {
    const keys = this.cache.keys();
    const data = this.cache.mget(keys);

    const json = JSON.stringify(data);
    await fs.writeFile(path.join(directoryPath, `${this.file}.json`), json);
    console.log('Cache saved to file');
  }

  get(key) {
    if (this.cache.has(key)) {
      const data = this.cache.get(key);
      if (!data) return false;
      else return this.deserialize(data);
    } else return false;
  }

  set(key, value, ttl) {
    let result = false;
    const data = this.serialize(value);
    if (typeof ttl === 'number') {
      result = this.cache.set(key, data, ttl);
    } else {
      result = this.cache.set(key, data);
    }
    
    if (this.persistent) {
      this.save();
    }

    return result;
  }

  destroy(key) {
    // NOTE: supports single key or array of keys
    return this.cache.del(key);
  }
}

export default LocalCache;