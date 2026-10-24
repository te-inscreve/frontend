DROP INDEX `avaliacoes_um_rascunho`;--> statement-breakpoint
UPDATE `avaliacoes` SET `estado` = 'atual' WHERE `estado` = 'rascunho';--> statement-breakpoint
CREATE UNIQUE INDEX `avaliacoes_uma_atual` ON `avaliacoes` (`avaliador_id`) WHERE "avaliacoes"."estado" = 'atual';
