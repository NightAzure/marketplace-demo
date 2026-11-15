-- Make buyer inquiries write-only for anonymous/public clients so messages stay private to sellers
drop policy if exists "Anyone can view messages" on public.messages;
