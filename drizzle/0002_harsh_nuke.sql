ALTER TABLE `alerts` MODIFY COLUMN `dueDate` varchar(10);--> statement-breakpoint
ALTER TABLE `debt_payments` MODIFY COLUMN `date` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `debts` MODIFY COLUMN `startDate` varchar(10);--> statement-breakpoint
ALTER TABLE `debts` MODIFY COLUMN `expectedEndDate` varchar(10);--> statement-breakpoint
ALTER TABLE `income_entries` MODIFY COLUMN `date` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `variable_expenses` MODIFY COLUMN `date` varchar(10) NOT NULL;