import RebuildableModelInterface from "@/server/games/base/RebuildableModelInterface";

export interface BasePlayerModelInterface {
  id: string;
  ready: boolean;
}

export default abstract class BasePlayerModel<
    PlayerInterface extends BasePlayerModelInterface = BasePlayerModelInterface,
  >
  implements
    BasePlayerModelInterface,
    RebuildableModelInterface<PlayerInterface>
{
  id: string;
  ready: boolean;

  constructor(id: string) {
    this.id = id;
    this.ready = false;
  }

  abstract rebuildImplementation(data: PlayerInterface): void;

  setReady(ready: boolean) {
    this.ready = ready;
  }
}
