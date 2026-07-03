-- Run this once in the Supabase SQL Editor if the old Share Note feature
-- was previously installed. It removes public note reads without deleting
-- any existing note rows or share-related column data.

drop policy if exists "Public can read shared notes" on notes;
