CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('debt_due','fixed_expense_due','budget_exceeded','custom') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`relatedId` int,
	`relatedType` varchar(64),
	`dueDate` date,
	`isRead` boolean NOT NULL DEFAULT false,
	`isDismissed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debt_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`debtId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`date` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `debt_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`creditor` varchar(255) NOT NULL,
	`description` text,
	`type` enum('credit_card','personal_loan','bank_loan','financing','overdraft','revolving','friend_family','other') NOT NULL,
	`originalAmount` decimal(12,2) NOT NULL,
	`currentBalance` decimal(12,2) NOT NULL,
	`interestRate` decimal(8,4) NOT NULL DEFAULT '0',
	`monthlyPayment` decimal(12,2) DEFAULT '0',
	`dueDay` int,
	`startDate` date,
	`expectedEndDate` date,
	`status` enum('active','negotiating','paused','paid') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fixed_expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('housing','health','insurance','transport','education','utilities','subscription','tax','other') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`dueDay` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fixed_expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `income_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`description` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`type` enum('salary','freelance','business','investment','other') NOT NULL,
	`date` date NOT NULL,
	`isRecurring` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `income_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `variable_expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`description` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`category` enum('food','transport','leisure','shopping','health','education','personal','other') NOT NULL,
	`date` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `variable_expenses_id` PRIMARY KEY(`id`)
);
