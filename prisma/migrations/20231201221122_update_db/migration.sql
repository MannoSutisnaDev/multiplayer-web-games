/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `GameState` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "joinedLobbyId" TEXT,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "ready" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_joinedLobbyId_fkey" FOREIGN KEY ("joinedLobbyId") REFERENCES "Lobby" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("connected", "id", "joinedLobbyId", "ready", "username") SELECT "connected", "id", "joinedLobbyId", "ready", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE TABLE "new_GameState" (
    "lobbyId" TEXT NOT NULL PRIMARY KEY,
    "state" BLOB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameState_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GameState" ("lobbyId", "state") SELECT "lobbyId", "state" FROM "GameState";
DROP TABLE "GameState";
ALTER TABLE "new_GameState" RENAME TO "GameState";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
