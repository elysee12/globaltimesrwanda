-- CreateTable: comments
CREATE TABLE `comments` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `newsId`    INT          NOT NULL,
  `name`      VARCHAR(100) NOT NULL,
  `content`   TEXT         NOT NULL,
  `approved`  BOOLEAN      NOT NULL DEFAULT false,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `comments_newsId_idx` (`newsId`),
  INDEX `comments_approved_idx` (`approved`),
  PRIMARY KEY (`id`),
  CONSTRAINT `comments_newsId_fkey`
    FOREIGN KEY (`newsId`) REFERENCES `news`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
