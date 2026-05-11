CREATE INDEX "User_firstName_idx" ON "User"("firstName");
CREATE INDEX "User_lastName_idx" ON "User"("lastName");
CREATE INDEX "User_firstName_lastName_idx" ON "User"("firstName", "lastName");
