CREATE TABLE `avaliacoes` (
	`id` text PRIMARY KEY NOT NULL,
	`avaliador_id` text NOT NULL,
	`evento_id` integer NOT NULL,
	`modalidade_id` integer NOT NULL,
	`categoria_id` integer NOT NULL,
	`inscricao_id` integer NOT NULL,
	`estado` text NOT NULL,
	`motivo_congelado` text,
	`payload` text NOT NULL,
	`modelo` text NOT NULL,
	`inscricao` text NOT NULL,
	`criado_em` integer NOT NULL,
	`atualizado_em` integer NOT NULL,
	`enfileirado_em` integer,
	`tentativas` integer DEFAULT 0 NOT NULL,
	`proxima_tentativa_em` integer,
	`erro` text,
	`servidor_id` integer,
	`nota` text,
	`enviado_em` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `avaliacoes_avaliador_inscricao` ON `avaliacoes` (`avaliador_id`,`inscricao_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `avaliacoes_um_rascunho` ON `avaliacoes` (`avaliador_id`) WHERE "avaliacoes"."estado" = 'rascunho';--> statement-breakpoint
CREATE INDEX `avaliacoes_fila` ON `avaliacoes` (`estado`,`enfileirado_em`);