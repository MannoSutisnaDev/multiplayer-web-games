/*
  Warnings:

  - You are about to drop the column `maxPlayers` on the `Lobby` table. All the data in the column will be lost.
  - Added the required column `gameTypeId` to the `Lobby` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "lobbyOwner" BOOLEAN;

-- CreateTable
CREATE TABLE "GameType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "maxPlayers" INTEGER NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lobby" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gameTypeId" TEXT NOT NULL,
    CONSTRAINT "Lobby_gameTypeId_fkey" FOREIGN KEY ("gameTypeId") REFERENCES "GameType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Lobby" ("id", "name") SELECT "id", "name" FROM "Lobby";
DROP TABLE "Lobby";
ALTER TABLE "new_Lobby" RENAME TO "Lobby";
CREATE UNIQUE INDEX "Lobby_name_key" ON "Lobby"("name");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "GameType_name_key" ON "GameType"("name");
