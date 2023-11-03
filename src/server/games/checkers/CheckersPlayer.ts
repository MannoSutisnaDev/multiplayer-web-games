import BasePlayerModel from "@/server/games/repository/BasePlayerModel";

export default class CheckersPlayer extends BasePlayerModel {
  extraData: string;
  constructor(id: string, extraData: string) {
    super(id);
    this.extraData = extraData;
  }
}
