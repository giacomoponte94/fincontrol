ALTER TABLE `debt_payments` ADD `paymentMethod` enum('pix','debit','credit','cash','transfer','boleto','other');--> statement-breakpoint
ALTER TABLE `fixed_expenses` ADD `paymentMethod` enum('pix','debit','credit','cash','transfer','boleto','other');--> statement-breakpoint
ALTER TABLE `variable_expenses` ADD `paymentMethod` enum('pix','debit','credit','cash','transfer','boleto','other');