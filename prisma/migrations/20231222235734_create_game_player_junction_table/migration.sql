/*
  Warnings:

  - You are about to drop the column `lobbyOwnerId` on the `Lobby` table. All the data in the column will be lost.
  - You are about to drop the column `joinedLobbyId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ready` on the `User` table. All the data in the column will be lost.
  - Added the required column `ownerId` to the `Lobby` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "GamePlayer" (
    "userId" TEXT NOT NULL,
    "lobbyId" TEXT NOT NULL,
    "ready" BOOLEAN NOT NULL DEFAULT false,
    "spectator" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "GamePlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GamePlayer_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lobby" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gameTypeId" TEXT NOT NULL,
    "gameStarted" BOOLEAN NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Lobby_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Lobby_gameTypeId_fkey" FOREIGN KEY ("gameTypeId") REFERENCES "GameType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Lobby" ("gameStarted", "gameTypeId", "id", "name") SELECT "gameStarted", "gameTypeId", "id", "name" FROM "Lobby";
DROP TABLE "Lobby";
ALTER TABLE "new_Lobby" RENAME TO "Lobby";
CREATE UNIQUE INDEX "Lobby_name_key" ON "Lobby"("name");
CREATE UNIQUE INDEX "Lobby_ownerId_key" ON "Lobby"("ownerId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("connected", "id", "updatedAt", "username") SELECT "connected", "id", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "GamePlayer_userId_key" ON "GamePlayer"("userId");
