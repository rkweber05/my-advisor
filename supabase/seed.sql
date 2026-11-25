-- Dados fictícios, só para ambiente local e de preview.
insert into public.signup_allowlist (email)
values ('pessoa.autorizada@example.test')
on conflict do nothing;
