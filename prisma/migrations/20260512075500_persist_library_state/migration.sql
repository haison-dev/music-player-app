-- DropForeignKey
ALTER TABLE "PlaylistTrack" DROP CONSTRAINT IF EXISTS "PlaylistTrack_trackId_fkey";

-- DropForeignKey
ALTER TABLE "TrackLike" DROP CONSTRAINT IF EXISTS "TrackLike_trackId_fkey";

-- CreateTable
CREATE TABLE "UserLibraryState" (
    "userId" TEXT NOT NULL,
    "selectedFolder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLibraryState_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ArtistFollow" (
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistFollow_pkey" PRIMARY KEY ("userId","artistId")
);

-- CreateIndex
CREATE INDEX "PlaylistTrack_trackId_idx" ON "PlaylistTrack"("trackId");

-- CreateIndex
CREATE INDEX "TrackLike_trackId_idx" ON "TrackLike"("trackId");

-- CreateIndex
CREATE INDEX "ArtistFollow_artistId_idx" ON "ArtistFollow"("artistId");

-- AddForeignKey
ALTER TABLE "UserLibraryState" ADD CONSTRAINT "UserLibraryState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistFollow" ADD CONSTRAINT "ArtistFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
