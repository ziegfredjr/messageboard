CREATE TABLE `messageboard`.`messages` (
    `id` INT(11) PRIMARY KEY,
    `to_id` INT(11) NOT NULL,
    `from_id` INT(11) NOT NULL,
    `content` TEXT NOT NULL,
    `created` DATETIME NOT NULL,
    `modified` DATETIME NOT NULL,
    `created_ip` VARCHAR(20) NULL,
    `modified_ip` VARCHAR(20) NULL
);
