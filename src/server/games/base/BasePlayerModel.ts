import RebuildableModelInterface from "@/server/games/base/RebuildableModelInterface";
import { BasePlayerModelInterface } from "@/server/games/types";

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

  rebuild(data: PlayerInterface) {
    this.id = data.id;
    this.ready = data.ready;
    this.name = data.name;
    this.connected = false;
    this.rebuildImplementation(data);
  }

  abstract rebuildImplementation(data: PlayerInterface): void;

  setReady(ready: boolean) {
    this.ready = ready;
  }
}
