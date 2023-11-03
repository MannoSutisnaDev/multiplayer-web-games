export default class BasePlayerModel {
  id: string;
  ready: boolean;
  constructor(id: string) {
    this.id = id;
    this.ready = false;
  }
  setReady(ready: boolean) {
    this.ready = ready;
  }
}
