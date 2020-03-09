import Cache from './cache';


class ServiceCache extends Cache {
  prefix: string;

  constructor(prefix:string=undefined, path:string=undefined) {
    super(path);

    this.prefix = prefix; // NOTE: prefix = service name
  }

  key(id:string) {
    if (this.prefix) {
      return `${this.prefix}:${id}`;
    } else return id;
  }
}

export default ServiceCache;