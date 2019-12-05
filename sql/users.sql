CREATE TABLE `messageboard`.`users` (
  `id` INT(11) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `email` VARCHAR(200) NOT NULL,
  `password` VARCHAR(200) NOT NULL,
  `image` VARCHAR(200) NULL,
  `gender` TINYINT(1) NOT NULL,
  `birthdate` DATE NOT NULL,
  `hobby` TEXT NULL,
  `last_login_time` DATETIME NULL,
  `created` DATETIME NOT NULL,
  `modified` DATETIME NOT NULL,
  `created_ip` VARCHAR(20) NOT NULL,
  `modified_ip` VARCHAR(20) NOT NULL
  );