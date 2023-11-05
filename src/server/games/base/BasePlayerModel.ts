import RebuildableModelInterface from "@/server/games/base/RebuildableModelInterface";

export interface BasePlayerModelInterface {
  id: string;
  name: string;
  ready: boolean;
  connected: boolean;
}

export default abstract class BasePlayerModel<
    PlayerInterface extends BasePlayerModelInterface = BasePlayerModelInterface,
  >
  implements
    BasePlayerModelInterface,
    RebuildableModelInterface<PlayerInterface>
{
  id: string;
  name: string;
  ready: boolean;
  connected: boolean;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.ready = false;
    this.connected = true;
  }

  abstract rebuildImplementation(data: PlayerInterface): void;

  setReady(ready: boolean) {
    this.ready = ready;
  }
}
