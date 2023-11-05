import BasePlayerModel, {
  BasePlayerModelInterface,
} from "@/server/games/base/BasePlayerModel";

export interface CheckersPlayerInterface extends BasePlayerModelInterface {
  extraData: string;
}

export default class CheckersPlayer
  extends BasePlayerModel<CheckersPlayerInterface>
  implements CheckersPlayerInterface
{
  extraData: string = "";
  constructor(id: string = "", name: string = "", extraData: string = "") {
    super(id, name);
    this.extraData = extraData;
  }

  rebuildImplementation(data: CheckersPlayerInterface) {
    this.id = data.id;
    this.ready = data.ready;
    this.name = data.name;
    this.extraData = data.extraData;
  }
}
