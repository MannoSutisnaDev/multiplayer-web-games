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
  constructor(id: string = "", extraData: string = "") {
    super(id);
    this.extraData = extraData;
  }

  rebuildImplementation(data: CheckersPlayerInterface) {
    this.id = data.id;
    this.ready = data.ready;
    this.extraData = data.extraData;
  }
}
