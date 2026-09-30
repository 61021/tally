CREATE TABLE `sign_in_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`email_hash` text NOT NULL,
	`code_hash` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer
);
--> statement-breakpoint
CREATE INDEX `sign_in_codes_email_created` ON `sign_in_codes` (`email_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`username_key` text NOT NULL,
	`email_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`username_changed_at` integer,
	`last_sign_in_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_key` ON `users` (`username_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_hash` ON `users` (`email_hash`);