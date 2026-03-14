-- CreateIndex
CREATE INDEX "OtcListing_sellerId_idx" ON "OtcListing"("sellerId");

-- CreateIndex
CREATE INDEX "OtcListing_status_idx" ON "OtcListing"("status");

-- CreateIndex
CREATE INDEX "OtcListing_investmentId_idx" ON "OtcListing"("investmentId");

-- CreateIndex
CREATE INDEX "OtcListing_unitId_idx" ON "OtcListing"("unitId");

-- CreateIndex
CREATE INDEX "OtcOffer_listingId_idx" ON "OtcOffer"("listingId");

-- CreateIndex
CREATE INDEX "OtcOffer_buyerId_idx" ON "OtcOffer"("buyerId");
