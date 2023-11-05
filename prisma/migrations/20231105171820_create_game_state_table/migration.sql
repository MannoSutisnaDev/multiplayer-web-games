/*
  Warnings:

  - You are about to drop the column `lobbyOwner` on the `User` table. All the data in the column will be lost.
  - Added the required column `gameStarted` to the `Lobby` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "GameState" (
    "lobbyId" TEXT NOT NULL PRIMARY KEY,
    "state" BLOB NOT NULL,
    CONSTRAINT "GameState_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lobby" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gameTypeId" TEXT NOT NULL,
    "gameStarted" BOOLEAN NOT NULL,
    "lobbyOwnerId" TEXT,
    CONSTRAINT "Lobby_lobbyOwnerId_fkey" FOREIGN KEY ("lobbyOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lobby_gameTypeId_fkey" FOREIGN KEY ("gameTypeId") REFERENCES "GameType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Lobby" ("gameTypeId", "id", "name") SELECT "gameTypeId", "id", "name" FROM "Lobby";
DROP TABLE "Lobby";
ALTER TABLE "new_Lobby" RENAME TO "Lobby";
CREATE UNIQUE INDEX "Lobby_name_key" ON "Lobby"("name");
CREATE UNIQUE INDEX "Lobby_lobbyOwnerId_key" ON "Lobby"("lobbyOwnerId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "joinedLobbyId" TEXT,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "ready" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "User_joinedLobbyId_fkey" FOREIGN KEY ("joinedLobbyId") REFERENCES "Lobby" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("id", "joinedLobbyId", "username") SELECT "id", "joinedLobbyId", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
