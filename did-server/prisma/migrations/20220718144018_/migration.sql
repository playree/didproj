/*
  Warnings:

  - Added the required column `name` to the `CredentialManifest` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CredentialManifest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issuerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "outputDescriptorJson" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CredentialManifest_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "Issuer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CredentialManifest" ("createdAt", "id", "issuerId", "outputDescriptorJson", "updatedAt") SELECT "createdAt", "id", "issuerId", "outputDescriptorJson", "updatedAt" FROM "CredentialManifest";
DROP TABLE "CredentialManifest";
ALTER TABLE "new_CredentialManifest" RENAME TO "CredentialManifest";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
