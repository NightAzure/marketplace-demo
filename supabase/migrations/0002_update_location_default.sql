-- Update default location from 'Palo Alto, CA' to 'Local pickup'
alter table public.listings alter column location set default 'Local pickup';
