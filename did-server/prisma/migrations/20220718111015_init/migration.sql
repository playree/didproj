-- CreateTable
CREATE TABLE "Issuer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "didObjectJson" TEXT NOT NULL,
    "stylesJson" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CredentialManifest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issuerId" TEXT NOT NULL,
    "outputDescriptorJson" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CredentialManifest_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "Issuer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerifiableCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "credentialManifestId" TEXT NOT NULL,
    "credentialSubjectJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerifiableCredential_credentialManifestId_fkey" FOREIGN KEY ("credentialManifestId") REFERENCES "CredentialManifest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerifiableCredentialStatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "verifiableCredentialId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerifiableCredentialStatus_verifiableCredentialId_fkey" FOREIGN KEY ("verifiableCredentialId") REFERENCES "VerifiableCredential" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
