-- Enforce end_date >= start_date at the database level (Zod enforces it at the API layer too).
ALTER TABLE "projects" ADD CONSTRAINT "projects_end_date_check" CHECK ("end_date" >= "start_date");
