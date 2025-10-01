-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Thread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "takenOver" BOOLEAN NOT NULL DEFAULT false,
    "takenOverAt" DATETIME,
    "lastHumanAt" DATETIME,
    "lastBotAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Thread_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Thread" ("aiEnabled", "contactId", "createdAt", "id", "lastBotAt", "lastHumanAt", "updatedAt") SELECT "aiEnabled", "contactId", "createdAt", "id", "lastBotAt", "lastHumanAt", "updatedAt" FROM "Thread";
DROP TABLE "Thread";
ALTER TABLE "new_Thread" RENAME TO "Thread";
CREATE UNIQUE INDEX "Thread_contactId_key" ON "Thread"("contactId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
