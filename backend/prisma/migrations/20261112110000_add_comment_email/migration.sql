-- Add optional email column to comments table
ALTER TABLE `comments` ADD COLUMN `email` VARCHAR(191) NULL;
